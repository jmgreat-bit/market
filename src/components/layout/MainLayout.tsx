'use client';

import { ReactNode, useEffect, useState } from 'react';
import { TabNavigation } from './TabNavigation';
import { PageTransition } from './PageTransition';
import Link from 'next/link';
import { Bell, Plus, Sparkles, AlertTriangle } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useUser } from '@/hooks/useUser';
import { getSupabaseClient } from '@/lib/supabase/client';

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const { profile, signOut } = useUser();
    const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);

    // Check for unread alerts — silent fail if table doesn't exist yet
    useEffect(() => {
        if (!profile?.id) return;

        const supabase = getSupabaseClient();
        supabase
            .from('alerts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', profile.id)
            .eq('is_read', false)
            .then(({ count }: { count: number | null }) => {
                setHasUnreadAlerts((count ?? 0) > 0);
            })
            .catch(() => {
                // alerts table may not exist yet — keep dot hidden
                setHasUnreadAlerts(false);
            });
    }, [profile?.id]);

    if (profile?.scheduled_for_deletion_at) {
        const deleteDate = new Date(profile.scheduled_for_deletion_at);
        const hardDeleteDate = new Date(deleteDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const daysLeft = Math.max(0, Math.ceil((hardDeleteDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

        const handleRecover = async () => {
            const supabase = getSupabaseClient();
            await supabase.rpc('recover_account');
            window.location.reload();
        };

        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-destructive/20 blur-[100px] animate-pulse-slow pointer-events-none mix-blend-screen" />
                <div className="z-10 max-w-md w-full space-y-6 glass-card p-8 rounded-3xl border border-destructive/20">
                    <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="w-10 h-10 text-destructive" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="font-headline font-black text-2xl tracking-tighter">Account Pending Deletion</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Your account is scheduled for permanent deletion in <strong className="text-foreground">{daysLeft} days</strong>. All your data, posts, and business details will be wiped permanently.
                        </p>
                    </div>
                    <div className="space-y-3 pt-4">
                        <button 
                            onClick={handleRecover}
                            className="w-full py-4 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-geo-glow"
                        >
                            Recover My Account
                        </button>
                        <button 
                            onClick={signOut}
                            className="w-full py-4 rounded-xl font-bold bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors border border-border/50"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Ambient Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] animate-pulse-slow pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[100px] animate-pulse-slow pointer-events-none mix-blend-screen" style={{ animationDelay: '2s' }} />

            <div className="relative z-10 h-full flex flex-col min-h-screen">
                {/* Mobile Top Bar - Logo + Notification Bell */}
                <header className="md:hidden fixed top-0 left-0 right-0 z-[60] flex justify-between items-center px-5 py-3.5 bg-background/80 backdrop-blur-2xl border-b border-border/10">
                    <Link href={ROUTES.FEED} className="flex items-center">
                        <h1 className="font-display font-black text-primary tracking-tighter text-xl">
                            MarketPLC
                        </h1>
                    </Link>
                    <div className="flex items-center gap-2">
                        {profile?.role === 'trader' && (
                            <Link
                                href={ROUTES.COMPOSE}
                                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-geo-glow"
                            >
                                <Plus className="w-5 h-5" />
                            </Link>
                        )}
                        <Link
                            href="/ai"
                            suppressHydrationWarning
                            className="relative w-10 h-10 rounded-full flex items-center justify-center bg-purple-500/15 text-purple-500 hover:bg-purple-500/25 transition-all"
                        >
                            <Sparkles className="w-5 h-5" />
                        </Link>
                        <Link
                            href={ROUTES.ALERTS}
                            className="relative w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                        >
                            <Bell className="w-5 h-5" />
                            {/* Notification dot — only shown when there are real unread alerts */}
                            {hasUnreadAlerts && (
                                <span className="absolute top-2 right-2.5 w-2 h-2 bg-destructive rounded-full border border-background" />
                            )}
                        </Link>
                    </div>
                </header>

                <TabNavigation hasUnreadAlerts={hasUnreadAlerts} />

                {/* Main content area - adjusted for fixed nav */}
                <main className="pt-[4.5rem] md:pt-20 pb-20 md:pb-0 flex-1 relative">
                    <PageTransition>
                        {children}
                    </PageTransition>
                </main>
            </div>
        </div>
    );
}
