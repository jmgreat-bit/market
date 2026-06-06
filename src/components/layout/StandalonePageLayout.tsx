'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface StandalonePageLayoutProps {
    title: string;
    children: ReactNode;
    rightElement?: ReactNode;
}

export function StandalonePageLayout({ title, children, rightElement }: StandalonePageLayoutProps) {
    const router = useRouter();

    return (
        <div className="fixed inset-0 z-[100] bg-background min-h-screen overflow-y-auto">
            {/* Top bar */}
            <header className="fixed top-0 left-0 right-0 z-[110] bg-background/80 backdrop-blur-2xl border-b border-border/10">
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all active:scale-90"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="font-display font-bold text-base tracking-tight text-foreground">
                            {title}
                        </h1>
                    </div>
                    {rightElement && (
                        <div className="flex items-center">
                            {rightElement}
                        </div>
                    )}
                </div>
            </header>

            {/* Content area */}
            <div className="pt-16">
                {children}
            </div>
        </div>
    );
}
