'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Heart, MessageCircle, Reply, UserPlus, Bell, Loader2,
    Phone, Eye, Bookmark, MapPin, Search, Trophy, Clock,
    TrendingUp, Zap, RefreshCw, Rss, Flame,
} from 'lucide-react';
import { StandalonePageLayout } from '@/components/layout/StandalonePageLayout';
import { useUser } from '@/hooks/useUser';
import { getSupabaseClient } from '@/lib/supabase/client';
import { formatDistanceToNow, isToday, isThisWeek } from 'date-fns';

// ── Types ──────────────────────────────────────────────
type AlertType =
    | 'like' | 'comment' | 'reply' | 'follow' | 'system'
    | 'contact_click' | 'profile_view' | 'bookmark' | 'navigation'
    | 'search_match' | 'competitive' | 'inactivity' | 'demand_signal'
    | 'reach_report' | 'repost_suggestion' | 'followed_post' | 'trending';

interface Alert {
    id: string;
    user_id: string;
    type: AlertType;
    title: string;
    body: string;
    is_read: boolean;
    created_at: string;
    related_post_id: string | null;
    from_user_id: string | null;
}

// ── Icon map ───────────────────────────────────────────
const typeIconMap: Record<AlertType, { icon: typeof Heart; color: string; bg: string }> = {
    like:              { icon: Heart,          color: 'text-rose-400',    bg: 'bg-rose-500/10' },
    comment:           { icon: MessageCircle,  color: 'text-blue-400',    bg: 'bg-blue-500/10' },
    reply:             { icon: Reply,          color: 'text-purple-400',  bg: 'bg-purple-500/10' },
    follow:            { icon: UserPlus,       color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    system:            { icon: Bell,           color: 'text-amber-400',   bg: 'bg-amber-500/10' },
    contact_click:     { icon: Phone,          color: 'text-green-400',   bg: 'bg-green-500/10' },
    profile_view:      { icon: Eye,            color: 'text-sky-400',     bg: 'bg-sky-500/10' },
    bookmark:          { icon: Bookmark,       color: 'text-yellow-400',  bg: 'bg-yellow-500/10' },
    navigation:        { icon: MapPin,         color: 'text-orange-400',  bg: 'bg-orange-500/10' },
    search_match:      { icon: Search,         color: 'text-cyan-400',    bg: 'bg-cyan-500/10' },
    competitive:       { icon: Trophy,         color: 'text-red-400',     bg: 'bg-red-500/10' },
    inactivity:        { icon: Clock,          color: 'text-zinc-400',    bg: 'bg-zinc-500/10' },
    demand_signal:     { icon: TrendingUp,     color: 'text-lime-400',    bg: 'bg-lime-500/10' },
    reach_report:      { icon: Zap,            color: 'text-indigo-400',  bg: 'bg-indigo-500/10' },
    repost_suggestion: { icon: RefreshCw,      color: 'text-teal-400',    bg: 'bg-teal-500/10' },
    followed_post:     { icon: Rss,            color: 'text-pink-400',    bg: 'bg-pink-500/10' },
    trending:          { icon: Flame,          color: 'text-amber-400',   bg: 'bg-amber-500/10' },
};

// ── Grouping helper ────────────────────────────────────
function getAlertGroup(createdAt: string): 'Today' | 'This Week' | 'Earlier' {
    const date = new Date(createdAt);
    if (isToday(date)) return 'Today';
    if (isThisWeek(date, { weekStartsOn: 1 })) return 'This Week';
    return 'Earlier';
}

const GROUP_ORDER: Array<'Today' | 'This Week' | 'Earlier'> = ['Today', 'This Week', 'Earlier'];

// ── Page component ─────────────────────────────────────
export default function NotificationsPage() {
    const { user, isLoading: authLoading } = useUser();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [repostingId, setRepostingId] = useState<string | null>(null);
    const [repostedIds, setRepostedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setLoading(false);
            return;
        }

        async function fetchAlerts() {
            setLoading(true);
            try {
                const supabase = getSupabaseClient();
                const { data, error } = await supabase
                    .from('alerts')
                    .select('*')
                    .eq('user_id', user!.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) {
                    if (error.code === '42P01') {
                        setAlerts([]);
                    } else {
                        setHasError(true);
                    }
                } else {
                    setAlerts(data || []);

                    // Mark all unread alerts as read
                    const unreadIds = (data || []).filter((a: Alert) => !a.is_read).map((a: Alert) => a.id);
                    if (unreadIds.length > 0) {
                        await supabase
                            .from('alerts')
                            .update({ is_read: true })
                            .in('id', unreadIds);
                    }
                }
            } catch {
                setHasError(true);
            } finally {
                setLoading(false);
            }
        }
        fetchAlerts();
    }, [user, authLoading]);

    // ── Repost handler ─────────────────────────────────
    const handleRepost = useCallback(async (alert: Alert) => {
        if (!alert.related_post_id || repostingId) return;
        setRepostingId(alert.id);

        try {
            const supabase = getSupabaseClient();

            // Fetch original post
            const { data: originalPost, error: fetchError } = await supabase
                .from('posts')
                .select('business_id, content')
                .eq('id', alert.related_post_id)
                .single();

            if (fetchError || !originalPost) {
                console.error('[alerts] Failed to fetch original post:', fetchError);
                return;
            }

            // Insert repost
            const { error: insertError } = await supabase
                .from('posts')
                .insert({
                    business_id: originalPost.business_id,
                    content: originalPost.content,
                    created_at: new Date().toISOString(),
                });

            if (insertError) {
                console.error('[alerts] Failed to create repost:', insertError);
                return;
            }

            // Mark alert as read & track success
            await supabase
                .from('alerts')
                .update({ is_read: true })
                .eq('id', alert.id);

            setRepostedIds((prev) => new Set(prev).add(alert.id));
        } catch (err) {
            console.error('[alerts] Repost error:', err);
        } finally {
            setRepostingId(null);
        }
    }, [repostingId]);

    // ── Group alerts ───────────────────────────────────
    const grouped = alerts.reduce<Record<string, Alert[]>>((acc, alert) => {
        const group = getAlertGroup(alert.created_at);
        if (!acc[group]) acc[group] = [];
        acc[group].push(alert);
        return acc;
    }, {});

    return (
        <StandalonePageLayout title="Notifications">
            <div className="max-w-2xl mx-auto px-4 py-4">

                {/* Loading state */}
                {(authLoading || loading) && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                )}

                {/* Empty / error state */}
                {!authLoading && !loading && (hasError || alerts.length === 0) && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
                        <div className="w-16 h-16 rounded-2xl bg-muted-foreground/5 flex items-center justify-center mb-5">
                            <Bell className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                        <h2 className="font-display font-bold text-lg text-foreground mb-2">
                            No notifications yet
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                            When someone likes or comments on your posts, you&apos;ll see it here.
                        </p>
                    </div>
                )}

                {/* Notifications list — grouped */}
                {!authLoading && !loading && !hasError && alerts.length > 0 && (
                    <div className="space-y-6">
                        {GROUP_ORDER.map((groupName) => {
                            const groupAlerts = grouped[groupName];
                            if (!groupAlerts || groupAlerts.length === 0) return null;

                            return (
                                <section key={groupName}>
                                    <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-2">
                                        {groupName}
                                    </h3>
                                    <div className="divide-y divide-border/10">
                                        {groupAlerts.map((alert) => {
                                            const typeConfig = typeIconMap[alert.type] || typeIconMap.system;
                                            const IconComponent = typeConfig.icon;
                                            const isReposting = repostingId === alert.id;
                                            const wasReposted = repostedIds.has(alert.id);

                                            return (
                                                <div
                                                    key={alert.id}
                                                    className={`flex items-start gap-3 py-3.5 px-2 rounded-lg transition-colors ${
                                                        !alert.is_read ? 'bg-primary/[0.03]' : ''
                                                    }`}
                                                >
                                                    {/* Icon */}
                                                    <div className={`w-8 h-8 rounded-full ${typeConfig.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                                        <IconComponent className={`w-4 h-4 ${typeConfig.color}`} />
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-foreground leading-snug">
                                                            {alert.title}
                                                        </p>
                                                        {alert.body && (
                                                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                                                {alert.body}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground/60 mt-1">
                                                            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                                                        </p>

                                                        {/* Repost button for repost_suggestion alerts */}
                                                        {alert.type === 'repost_suggestion' && alert.related_post_id && (
                                                            <div className="mt-2">
                                                                {wasReposted ? (
                                                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                                        Reposted!
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleRepost(alert)}
                                                                        disabled={isReposting}
                                                                        className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                                                                    >
                                                                        <RefreshCw className={`w-3.5 h-3.5 ${isReposting ? 'animate-spin' : ''}`} />
                                                                        {isReposting ? 'Reposting…' : 'Repost Now'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Unread indicator */}
                                                    {!alert.is_read && (
                                                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2 shadow-[0_0_6px_rgba(143,245,255,0.6)]" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </StandalonePageLayout>
    );
}
