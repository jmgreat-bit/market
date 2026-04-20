'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Map, Newspaper, User, Search, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { useSettings } from '@/contexts/SettingsContext';

export function DesktopHeader() {
    const pathname = usePathname();
    const { t } = useSettings();

    const tabs = [
        { href: ROUTES.FEED, label: t.nav.feed, icon: Newspaper },
        { href: ROUTES.EXPLORE, label: 'Explore', icon: Compass },
        { href: ROUTES.PROFILE, label: t.nav.profile, icon: User },
        { href: ROUTES.MAP, label: 'Map', icon: Map },
    ];

    return (
        <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 justify-between items-center w-full px-6 py-4 bg-[#0e0e0f]/80 backdrop-blur-lg bg-[#131314]">
            <div className="flex items-center gap-4">
                <Link href={ROUTES.FEED} className="flex items-center">
                    <h1 className="font-display font-black text-primary tracking-tighter text-2xl">
                        GeoPulse
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
                                'font-display font-bold tracking-tight transition-colors duration-300',
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

            <button className="text-muted-foreground hover:text-primary transition-colors">
                <Search className="w-5 h-5" />
            </button>
        </nav>
    );
}
