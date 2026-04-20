'use client';

import { motion } from 'framer-motion';
import { Navigation, Bookmark } from 'lucide-react';

interface MapDetailPeekProps {
    businessName?: string;
    status?: string;
    distance?: string;
}

export function MapDetailPeek({ businessName = "Neon Noodle Bar", status = "Trending Now", distance = "0.2 mi" }: MapDetailPeekProps) {
    return (
        <div className="absolute bottom-0 md:bottom-6 left-0 right-0 px-0 md:px-6 z-30 pointer-events-none flex justify-center pb-24 md:pb-0">
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.8 }}
                className="w-full max-w-xl bg-[#262627]/40 backdrop-blur-[24px] rounded-t-xl md:rounded-xl p-6 pointer-events-auto border border-[rgba(72,72,73,0.15)] transform translate-y-0 transition-transform duration-500"
            >
                {/* Drag Handle (Mobile) */}
                <div className="w-12 h-1 bg-[#484849]/30 rounded-full mx-auto mb-6 md:hidden" />

                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="font-display text-2xl font-bold text-foreground tracking-tight mb-1">
                            {businessName}
                        </h2>
                        <p className="font-sans text-sm text-muted-foreground flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-primary inline-block shadow-[0_0_8px_rgba(143,245,255,0.8)]" />
                            {status} • {distance}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="w-10 h-10 rounded-full bg-[#2c2c2d]/50 border border-[rgba(72,72,73,0.15)] flex items-center justify-center text-foreground hover:text-primary transition-colors">
                            <Bookmark className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex gap-4 mt-6">
                    <button className="flex-1 bg-gradient-to-r from-primary to-accent text-[#003f43] py-3 rounded-lg font-sans font-semibold flex justify-center items-center gap-2 shadow-[0_0_24px_rgba(143,245,255,0.2)] hover:shadow-[0_0_32px_rgba(143,245,255,0.3)] transition-shadow">
                        <Navigation className="w-5 h-5" />
                        Navigate
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
