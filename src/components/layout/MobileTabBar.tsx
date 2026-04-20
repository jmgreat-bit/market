'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Map, Newspaper, User, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { useSettings } from '@/contexts/SettingsContext';

export function MobileTabBar() {
    const pathname = usePathname();
    const { t } = useSettings();

    const tabs = [
        { href: ROUTES.MAP, label: 'Map', icon: Map },
        { href: ROUTES.EXPLORE, label: 'Explore', icon: Compass },
        { href: ROUTES.FEED, label: t.nav.feed, icon: Newspaper },
        { href: ROUTES.PROFILE, label: t.nav.profile, icon: User },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 pb-safe bg-[#262627]/50 backdrop-blur-2xl border-none shadow-[0_0_32px_rgba(0,240,255,0.08)]">
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
                                ? 'text-primary drop-shadow-[0_0_8px_rgba(143,245,255,0.6)]'
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
