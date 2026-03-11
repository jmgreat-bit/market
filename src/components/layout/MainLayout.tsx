'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TabNavigation } from './TabNavigation';
import { PageTransition } from './PageTransition';

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Ambient Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] animate-pulse-slow pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[100px] animate-pulse-slow pointer-events-none mix-blend-screen" style={{ animationDelay: '2s' }} />

            <div className="relative z-10 h-full flex flex-col min-h-screen">
                <TabNavigation />

                {/* Main content area - adjusted for fixed nav */}
                <main className="pt-0 md:pt-16 pb-16 md:pb-0 flex-1 relative">
                    <PageTransition>
                        {children}
                    </PageTransition>
                </main>
            </div>
        </div>
    );
}
