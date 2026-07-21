'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Map, Newspaper, Settings, Search, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { useSettings } from '@/contexts/SettingsContext';
import { useUser } from '@/hooks/useUser';
import { getSupabaseClient } from '@/lib/supabase/client';

export function MobileTabBar() {
    const pathname = usePathname();
    const { t } = useSettings();
    const { user } = useUser();
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        if (!user) return;

        async function checkUnread() {
            try {
                const supabase = getSupabaseClient();
                const { count, error } = await supabase
                    .from('alerts')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user!.id)
                    .eq('is_read', false);

                if (!error && count !== null && count > 0) {
                    setHasUnread(true);
                } else {
                    setHasUnread(false);
                }
            } catch {
                // Silently ignore — dot just won't show
            }
        }

        checkUnread();
    }, [user]);

    const tabs = [
        { href: ROUTES.FEED, label: t.nav.feed, icon: Newspaper },
        { href: ROUTES.SEARCH, label: 'Search', icon: Search },
        { href: ROUTES.EXPLORE, label: 'Explore', icon: Compass },
        { href: ROUTES.MAP, label: 'Map', icon: Map },
        { href: ROUTES.MENU, label: 'Menu', icon: Settings },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 pb-safe bg-background/80 backdrop-blur-2xl border-t border-border/50 shadow-[0_-4px_32px_rgba(0,0,0,0.05)]">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                const Icon = tab.icon;
                const isMenu = tab.href === ROUTES.MENU;

                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            'flex flex-col items-center justify-center transition-all active:scale-90 duration-200',
                            isActive
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-primary/80'
                        )}
                    >
                        <span className="relative">
                            <Icon className="w-6 h-6 mb-1" />
                            {isMenu && hasUnread && (
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(143,245,255,0.7)]" />
                            )}
                        </span>
                        <span className="font-display text-[10px] font-medium">{tab.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
