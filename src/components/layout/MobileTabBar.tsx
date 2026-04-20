'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Map, Newspaper, Settings, Search, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { useSettings } from '@/contexts/SettingsContext';

export function MobileTabBar() {
    const pathname = usePathname();
    const { t } = useSettings();

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
                        <Icon className="w-6 h-6 mb-1" />
                        <span className="font-display text-[10px] font-medium">{tab.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
