'use client';

import { useEffect, useState } from 'react';
import { Heart, MessageCircle, Reply, UserPlus, Bell, Loader2 } from 'lucide-react';
import { StandalonePageLayout } from '@/components/layout/StandalonePageLayout';
import { useUser } from '@/hooks/useUser';
import { getSupabaseClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';

// ── Types ──────────────────────────────────────────────
type AlertType = 'like' | 'comment' | 'reply' | 'follow' | 'system';

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
    like:    { icon: Heart,         color: 'text-rose-400',   bg: 'bg-rose-500/10' },
    comment: { icon: MessageCircle, color: 'text-blue-400',   bg: 'bg-blue-500/10' },
    reply:   { icon: Reply,         color: 'text-purple-400', bg: 'bg-purple-500/10' },
    follow:  { icon: UserPlus,      color: 'text-emerald-400',bg: 'bg-emerald-500/10' },
    system:  { icon: Bell,          color: 'text-amber-400',  bg: 'bg-amber-500/10' },
};

// ── Page component ─────────────────────────────────────
export default function NotificationsPage() {
    const { user, isLoading: authLoading } = useUser();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        // Still waiting for auth context to initialise — don't bail out yet
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
                    // If the table simply doesn't exist yet, show empty instead of error
                    if (error.code === '42P01') {
                        setAlerts([]);
                    } else {
                        setHasError(true);
                    }
                } else {
                    setAlerts(data || []);
                }
            } catch {
                setHasError(true);
            } finally {
                setLoading(false);
            }
        }
        fetchAlerts();
    }, [user, authLoading]);

    return (
        <StandalonePageLayout title="Notifications">
            <div className="max-w-2xl mx-auto px-4 py-4">

                {/* Loading state — shown while auth is initialising OR fetching alerts */}
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

                {/* Notifications list */}
                {!authLoading && !loading && !hasError && alerts.length > 0 && (
                    <div className="divide-y divide-border/10">
                        {alerts.map((alert) => {
                            const typeConfig = typeIconMap[alert.type] || typeIconMap.system;
                            const IconComponent = typeConfig.icon;

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
                                    </div>

                                    {/* Unread indicator */}
                                    {!alert.is_read && (
                                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2 shadow-[0_0_6px_rgba(143,245,255,0.6)]" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </StandalonePageLayout>
    );
}
