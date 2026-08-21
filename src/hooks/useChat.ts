'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { Message, Conversation, Profile, BusinessDetails } from '@/types';

export function useChat(conversationId: string) {
    const { user } = useUser();
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [otherParticipant, setOtherParticipant] = useState<Profile | null>(null);
    const [business, setBusiness] = useState<BusinessDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = useMemo(() => getSupabaseClient(), []);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = useCallback((smooth = true) => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
        }
    }, []);

    // Fetch conversation metadata & other participant
    const fetchConversationDetails = useCallback(async () => {
        if (!conversationId || !user?.id) return;

        try {
            const { data: conv, error: convError } = await supabase
                .from('direct_conversations')
                .select('*')
                .eq('id', conversationId)
                .single();

            if (convError || !conv) throw convError || new Error('Conversation not found');
            setConversation(conv);

            const otherId = conv.participant1_id === user.id ? conv.participant2_id : conv.participant1_id;

            // Fetch other participant profile
            const { data: prof } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', otherId)
                .single();
            if (prof) setOtherParticipant(prof);

            // Fetch business if set or if other participant is a trader
            if (conv.business_id) {
                const { data: biz } = await supabase
                    .from('business_details')
                    .select('*')
                    .eq('id', conv.business_id)
                    .maybeSingle();
                if (biz) setBusiness(biz);
            } else if (prof?.role === 'trader') {
                const { data: biz } = await supabase
                    .from('business_details')
                    .select('*')
                    .eq('profile_id', otherId)
                    .maybeSingle();
                if (biz) setBusiness(biz);
            }
        } catch (err: unknown) {
            console.error('Error fetching conversation:', err);
            setError(err instanceof Error ? err.message : 'Failed to load conversation');
        }
    }, [conversationId, user?.id, supabase]);

    // Fetch messages
    const fetchMessages = useCallback(async () => {
        if (!conversationId || !user?.id) return;

        try {
            setIsLoading(true);
            const { data: msgs, error: msgsError } = await supabase
                .from('direct_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (msgsError) throw msgsError;

            setMessages(msgs || []);

            // Mark unread messages as read
            await supabase
                .from('direct_messages')
                .update({ is_read: true })
                .eq('conversation_id', conversationId)
                .neq('sender_id', user.id)
                .eq('is_read', false);

            setTimeout(() => scrollToBottom(false), 50);
        } catch (err: unknown) {
            console.error('Error loading messages:', err);
            setError(err instanceof Error ? err.message : 'Failed to load messages');
        } finally {
            setIsLoading(false);
        }
    }, [conversationId, user?.id, supabase, scrollToBottom]);

    useEffect(() => {
        fetchConversationDetails();
        fetchMessages();
    }, [fetchConversationDetails, fetchMessages]);

    // Real-time live messages subscription
    useEffect(() => {
        if (!conversationId || !user?.id) return;

        const channel = supabase
            .channel(`chat-${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload: any) => {
                    const newMsg = payload.new as Message;
                    
                    setMessages((prev) => {
                        // Avoid duplicates if optimistic message exists
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        // Replace matching temporary optimistic message
                        const tempIndex = prev.findIndex(
                            (m) => m.id.startsWith('temp-') && m.content === newMsg.content && m.sender_id === newMsg.sender_id
                        );
                        if (tempIndex !== -1) {
                            const updated = [...prev];
                            updated[tempIndex] = newMsg;
                            return updated;
                        }
                        return [...prev, newMsg];
                    });

                    // If received message from other user, mark it as read immediately
                    if (newMsg.sender_id !== user.id) {
                        supabase
                            .from('direct_messages')
                            .update({ is_read: true })
                            .eq('id', newMsg.id)
                            .then(() => {});
                    }

                    setTimeout(() => scrollToBottom(true), 50);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, user?.id, supabase, scrollToBottom]);

    // Send message function
    const sendMessage = useCallback(async (content: string) => {
        const trimmed = content.trim();
        if (!trimmed || !user?.id || !conversationId) return;

        setIsSending(true);

        const tempId = `temp-${Date.now()}`;
        const now = new Date().toISOString();

        // Optimistic UI update
        const optimisticMsg: Message = {
            id: tempId,
            conversation_id: conversationId,
            sender_id: user.id,
            content: trimmed,
            is_read: false,
            created_at: now,
        };

        setMessages((prev) => [...prev, optimisticMsg]);
        setTimeout(() => scrollToBottom(true), 30);

        try {
            const { data: sentMsg, error: sendError } = await supabase
                .from('direct_messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    content: trimmed,
                    is_read: false,
                })
                .select('*')
                .single();

            if (sendError) throw sendError;

            // Update conversation last_message_at and preview
            await supabase
                .from('direct_conversations')
                .update({
                    last_message_at: now,
                    last_message_preview: trimmed.substring(0, 100),
                })
                .eq('id', conversationId);

            // Replace optimistic message with actual message from DB
            setMessages((prev) =>
                prev.map((m) => (m.id === tempId ? (sentMsg as Message) : m))
            );
        } catch (err: unknown) {
            console.error('Failed to send message:', err);
            // Remove failed optimistic message
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            setError('Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    }, [conversationId, user?.id, supabase, scrollToBottom]);

    return {
        messages,
        conversation,
        otherParticipant,
        business,
        isLoading,
        isSending,
        error,
        sendMessage,
        messagesEndRef,
        scrollToBottom,
    };
}
