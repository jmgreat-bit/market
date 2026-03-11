'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Map, Newspaper, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { useSettings } from '@/contexts/SettingsContext';

export function TabNavigation() {
    const pathname = usePathname();
    const { t } = useSettings();

    const tabs = [
        {
            href: ROUTES.MAP,
            label: t.nav.map,
            icon: Map,
            description: 'Discover nearby'
        },
        {
            href: ROUTES.FEED,
            label: t.nav.feed,
            icon: Newspaper,
            description: 'Latest shouts'
        },
        {
            href: ROUTES.PROFILE,
            label: t.nav.profile,
            icon: User,
            description: 'Your account'
        },
    ];

    return (
        <>
            {/* Desktop Navigation - Top */}
            <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 glass-card border-b border-border">
                <div className="container mx-auto px-6 flex items-center justify-between">
                    {/* Logo */}
                    <Link href={ROUTES.MAP} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg geo-gradient flex items-center justify-center">
                            <Map className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-[#635bff] to-[#00d4ff] bg-clip-text text-transparent">
                            GeoPulse
                        </span>
                    </Link>

                    {/* Desktop Tabs */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/50">
                        {tabs.map((tab) => {
                            const isActive = pathname === tab.href;
                            const Icon = tab.icon;

                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={cn(
                                        'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                        isActive
                                            ? 'text-primary-foreground'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-primary rounded-lg"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Placeholder for user menu */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent" />
                </div>
            </nav>

            {/* Mobile Navigation - Bottom */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border safe-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href;
                        const Icon = tab.icon;

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    'relative flex flex-col items-center justify-center w-full h-full gap-0.5 rounded-xl transition-colors',
                                    isActive ? 'text-primary' : 'text-muted-foreground'
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabMobile"
                                        className="absolute inset-1 bg-primary/10 rounded-xl"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <Icon className={cn('w-5 h-5 relative z-10', isActive && 'scale-110')} />
                                <span className="text-[10px] font-medium relative z-10">{tab.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
