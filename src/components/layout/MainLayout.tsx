'use client';

import { ReactNode, useEffect, useState } from 'react';
import { TabNavigation } from './TabNavigation';
import { PageTransition } from './PageTransition';
import Link from 'next/link';
import { Bell, Plus, Sparkles } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useUser } from '@/hooks/useUser';
import { getSupabaseClient } from '@/lib/supabase/client';

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const { profile } = useUser();
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
