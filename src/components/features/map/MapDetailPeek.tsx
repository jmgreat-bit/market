'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Bookmark, X } from 'lucide-react';
import { BusinessDetails } from '@/types';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';

interface MapDetailPeekProps {
    business: BusinessDetails | null;
    onClose: () => void;
}

export function MapDetailPeek({ business, onClose }: MapDetailPeekProps) {
    const { profile } = useUser();

    if (!business) return null;

    const handleStartNavigation = async () => {
        // Open Google Maps directions (works on mobile — opens app, on desktop — opens web)
        const url = `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`;
        window.open(url, '_blank');

        // Log navigation event for trader analytics
        if (profile?.id) {
            try {
                const supabase = getSupabaseClient();
                await supabase.from('store_navigations').insert({
                    business_id: business.id,
                    user_id: profile.id,
                });
            } catch (err) {
                // Silent fail — don't block user navigation
                console.error('Failed to log navigation:', err);
            }
        }
    };

    return (
        <div className="absolute bottom-0 md:bottom-6 left-0 right-0 px-0 md:px-6 z-30 pointer-events-none flex justify-center pb-24 md:pb-0">
            <motion.div 
                initial={{ y: 200, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 200, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-xl bg-background/80 backdrop-blur-[24px] rounded-t-3xl md:rounded-[2rem] p-8 pointer-events-auto border border-border/50 shadow-2xl"
            >
                {/* Drag Handle (Mobile) */}
                <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6 md:hidden" />

                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{business.category || 'Active Pulse'}</span>
                        </div>
                        <h2 className="font-display text-2xl font-black text-foreground tracking-tight mb-1">
                            {business.business_name}
                        </h2>
                        {business.address && (
                            <p className="font-sans text-sm text-muted-foreground">
                                {business.address}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button className="w-10 h-10 rounded-full bg-secondary border border-border/50 flex items-center justify-center text-foreground hover:text-primary transition-colors">
                            <Bookmark className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-secondary border border-border/50 flex items-center justify-center text-foreground hover:text-primary transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <button 
                        onClick={handleStartNavigation}
                        className="flex-1 bg-primary text-primary-foreground py-4 rounded-2xl font-sans font-bold flex justify-center items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Navigation className="w-5 h-5" />
                        Start Navigation
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

