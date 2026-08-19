'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Map, Newspaper, Settings, MessageSquare, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { useSettings } from '@/contexts/SettingsContext';
import { useConversations } from '@/hooks/useConversations';

export function MobileTabBar() {
    const pathname = usePathname();
    const { t } = useSettings();
    const { totalUnread } = useConversations();

    const tabs = [
        { href: ROUTES.FEED, label: t.nav.feed, icon: Newspaper },
        { href: ROUTES.INBOX, label: 'Messages', icon: MessageSquare },
        { href: ROUTES.EXPLORE, label: 'Explore', icon: Compass },
        { href: ROUTES.MAP, label: 'Map', icon: Map },
        { href: ROUTES.MENU, label: 'Menu', icon: Settings },
    ];

    const MAIN_TABS = [ROUTES.FEED, ROUTES.INBOX, ROUTES.EXPLORE, ROUTES.MAP, '/'];
    const isMainTab = MAIN_TABS.includes(pathname || '');

    if (!isMainTab) return null;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 pb-safe bg-background/80 backdrop-blur-2xl border-t border-border/50 shadow-[0_-4px_32px_rgba(0,0,0,0.05)]">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href || (tab.href === ROUTES.INBOX && pathname?.startsWith('/inbox'));
                const Icon = tab.icon;
                const isInbox = tab.href === ROUTES.INBOX;

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
                            {isInbox && totalUnread > 0 && (
                                <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 bg-primary text-primary-foreground text-[9px] font-black rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(143,245,255,0.7)]">
                                    {totalUnread > 9 ? '9+' : totalUnread}
                                </span>
                            )}
                        </span>
                        <span className="font-display text-[10px] font-medium">{tab.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
