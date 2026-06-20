'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Map, Newspaper, Settings, Search, Compass, Bell, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { useSettings } from '@/contexts/SettingsContext';
import { useUser } from '@/hooks/useUser';

export function DesktopHeader({ hasUnreadAlerts = false }: { hasUnreadAlerts?: boolean }) {
    const pathname = usePathname();
    const { t } = useSettings();
    const { profile } = useUser();

    const tabs = [
        { href: ROUTES.FEED, label: t.nav.feed, icon: Newspaper },
        { href: ROUTES.SEARCH, label: 'Search', icon: Search },
        { href: ROUTES.EXPLORE, label: 'Explore', icon: Compass },
        { href: ROUTES.MAP, label: 'Map', icon: Map },
        { href: ROUTES.MENU, label: 'Menu', icon: Settings },
    ];

    return (
        <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 justify-between items-center w-full px-6 py-4 bg-background/90 backdrop-blur-xl border-b border-border/40">
            <div className="flex items-center gap-4">
                <Link href={ROUTES.FEED} className="flex items-center">
                    <h1 className="font-display font-black text-primary tracking-tighter text-2xl">
                        MarketPLC
                    </h1>
                </Link>
            </div>

            <div className="flex gap-8">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                'font-display font-bold tracking-tight transition-colors duration-300 flex items-center gap-2',
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-accent'
                            )}
                        >
                            {tab.label}
                        </Link>
                    );
                })}
            </div>

            <div className="flex items-center gap-3">
                <Link href={ROUTES.SEARCH} className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                    <Search className="w-5 h-5" />
                </Link>

                <Link href="/ai" suppressHydrationWarning className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500/15 text-purple-500 hover:bg-purple-500/25 transition-all">
                    <Sparkles className="w-5 h-5" />
                </Link>
                
                <Link href={ROUTES.ALERTS} className="relative w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                    <Bell className="w-5 h-5" />
                    {hasUnreadAlerts && (
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-destructive rounded-full border border-background" />
                    )}
                </Link>

                {profile?.role === 'trader' && (
                    <Link 
                        href={ROUTES.COMPOSE} 
                        className="ml-2 flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-full hover:opacity-90 transition-opacity whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="font-display">Create Post</span>
                    </Link>
                )}
            </div>
        </nav>
    );
}
