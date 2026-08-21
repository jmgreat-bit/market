'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { ConversationWithDetails } from '@/types';

interface ConversationsContextValue {
    conversations: ConversationWithDetails[];
    totalUnread: number;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    getOrCreateConversation: (targetProfileId: string, businessId?: string | null) => Promise<string>;
}

const ConversationsContext = createContext<ConversationsContextValue | null>(null);

export function ConversationsProvider({ children }: { children: ReactNode }) {
    const { user, profile } = useUser();
    const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = useMemo(() => getSupabaseClient(), []);

    const fetchConversations = useCallback(async () => {
        if (!user?.id) {
            setConversations([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const { data: convData, error: convError } = await supabase
                .from('direct_conversations')
                .select('*')
                .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
                .order('last_message_at', { ascending: false });

            if (convError) {
                console.warn('Conversations query error:', convError);
                setConversations([]);
                return;
            }

            if (!convData || convData.length === 0) {
                setConversations([]);
                return;
            }

            const otherUserIds = (convData as any[]).map((c: any) =>
                c.participant1_id === user.id ? c.participant2_id : c.participant1_id
            );
            const businessIds = (convData as any[]).map((c: any) => c.business_id).filter(Boolean) as string[];

            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url, role, trader_tier, is_premium')
                .in('id', otherUserIds);

            const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

            let businessMap = new Map();
            if (businessIds.length > 0) {
                const { data: bizData } = await supabase
                    .from('business_details')
                    .select('id, profile_id, business_name, category, phone')
                    .in('id', businessIds);
                businessMap = new Map((bizData || []).map((b: any) => [b.id, b]));
            }

            const unreadCountsPromises = (convData as any[]).map(async (c: any) => {
                const { count } = await supabase
                    .from('direct_messages')
                    .select('id', { count: 'exact', head: true })
                    .eq('conversation_id', c.id)
                    .neq('sender_id', user.id)
                    .eq('is_read', false);
                return { conversationId: c.id, unreadCount: count || 0 };
            });

            const unreadCounts = await Promise.all(unreadCountsPromises);
            const unreadMap = new Map(unreadCounts.map(u => [u.conversationId, u.unreadCount]));

            const enriched: ConversationWithDetails[] = (convData as any[]).map((c: any) => {
                const otherId = c.participant1_id === user.id ? c.participant2_id : c.participant1_id;
                return {
                    ...c,
                    other_participant: profilesMap.get(otherId) || null,
                    business: c.business_id ? businessMap.get(c.business_id) || null : null,
                    unread_count: unreadMap.get(c.id) || 0,
                };
            });

            setConversations(enriched);
        } catch (err: unknown) {
            console.error('Error fetching conversations:', err);
            setError(err instanceof Error ? err.message : 'Failed to load conversations');
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, supabase]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Single real-time subscription for the entire app
    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel(`user-inbox-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'direct_conversations',
                },
                () => {
                    fetchConversations();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                },
                () => {
                    fetchConversations();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'direct_messages',
                },
                () => {
                    fetchConversations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, supabase, fetchConversations]);

    const totalUnread = useMemo(() => {
        return conversations.reduce((acc, curr) => acc + (curr.unread_count || 0), 0);
    }, [conversations]);

    const getOrCreateConversation = useCallback(async (
        targetProfileId: string,
        businessId?: string | null
    ): Promise<string> => {
        if (!user?.id) throw new Error('You must be logged in to send messages');
        if (user.id === targetProfileId) throw new Error('Cannot start a conversation with yourself');

        const { data: existing } = await supabase
            .from('direct_conversations')
            .select('id')
            .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${targetProfileId}),and(participant1_id.eq.${targetProfileId},participant2_id.eq.${user.id})`)
            .maybeSingle();

        if (existing?.id) {
            return existing.id;
        }

        const { data: targetProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', targetProfileId)
            .single();

        const isSenderTrader = profile?.role === 'trader';
        const isTargetTrader = targetProfile?.role === 'trader';

        if (!isSenderTrader && !isTargetTrader) {
            throw new Error('Direct messaging is available for inquiries to businesses and traders only.');
        }

        let resolvedBizId = businessId;
        if (!resolvedBizId && isTargetTrader) {
            const { data: biz } = await supabase
                .from('business_details')
                .select('id')
                .eq('profile_id', targetProfileId)
                .maybeSingle();
            resolvedBizId = biz?.id || null;
        }

        const now = new Date().toISOString();
        const { data: newConv, error: createError } = await supabase
            .from('direct_conversations')
            .insert({
                participant1_id: user.id,
                participant2_id: targetProfileId,
                business_id: resolvedBizId,
                last_message_at: now,
                last_message_preview: null,
            })
            .select('id')
            .single();

        if (createError || !newConv) {
            throw createError || new Error('Failed to create conversation');
        }

        // Refresh conversations list after creating new one
        fetchConversations();
        return newConv.id;
    }, [user?.id, profile?.role, supabase, fetchConversations]);

    const value = useMemo(() => ({
        conversations,
        totalUnread,
        isLoading,
        error,
        refresh: fetchConversations,
        getOrCreateConversation,
    }), [conversations, totalUnread, isLoading, error, fetchConversations, getOrCreateConversation]);

    return (
        <ConversationsContext.Provider value={value}>
            {children}
        </ConversationsContext.Provider>
    );
}

export function useConversations() {
    const context = useContext(ConversationsContext);
    if (!context) {
        // Return safe defaults when used outside provider (e.g. during SSR or outside main layout)
        return {
            conversations: [] as ConversationWithDetails[],
            totalUnread: 0,
            isLoading: false,
            error: null,
            refresh: async () => {},
            getOrCreateConversation: async () => { throw new Error('ConversationsProvider not found'); },
        };
    }
    return context;
}
