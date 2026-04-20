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
