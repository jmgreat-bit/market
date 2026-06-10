'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Target, Zap, Globe, Loader2, Check } from 'lucide-react';
import { TraderTier } from '@/types';
import { getSupabaseClient } from '@/lib/supabase/client';

interface BoostModalProps {
    postId: string;
    businessId: string;
    tier: TraderTier;
    onClose: () => void;
    onSuccess: () => void;
}

export function BoostModal({ postId, businessId, tier, onClose, onSuccess }: BoostModalProps) {
    const [days, setDays] = useState<number>(7);
    const [radius, setRadius] = useState<number>(tier === 'national' ? 999 : 2);
    const [placements, setPlacements] = useState<string[]>(['feed']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Dynamic daily rate based on duration
    const dailyRate = useMemo(() => {
        if (days >= 30) return 350;
        if (days >= 14) return 400;
        if (days >= 7) return 450;
        return 500;
    }, [days]);

    // Bundle multiplier
    const bundleMultiplier = useMemo(() => {
        const count = placements.length;
        if (count >= 4) return 2;
        if (count === 3) return 1.8;
        if (count === 2) return 1.5;
        return 1;
    }, [placements.length]);

    // Radius multiplier
    const radiusMultiplier = useMemo(() => {
        if (radius === 2) return 1;
        if (radius === 4) return 1.5;
        if (radius === 15) return 3; // Citywide
        if (radius === 999) return 10; // Nationwide
        return 1;
    }, [radius]);

    const totalCost = Math.round(dailyRate * days * bundleMultiplier * radiusMultiplier);

    const togglePlacement = (id: string) => {
        if (placements.includes(id) && placements.length > 1) {
            setPlacements(placements.filter(p => p !== id));
        } else if (!placements.includes(id)) {
            setPlacements([...placements, id]);
        }
    };

    const handleBoost = async () => {
        setIsSubmitting(true);
        try {
            const supabase = getSupabaseClient();
            
            // Note: We need the post's lat/lng, but we'll fetch it from the server or assume 0 for now
            // since this is just creating the DB record
            const { data: post } = await supabase.from('posts').select('latitude, longitude').eq('id', postId).single();
            
            await supabase.from('ads').insert({
                business_id: businessId,
                post_id: postId,
                placements,
                radius_km: radius,
                center_lat: post?.latitude || 0,
                center_lng: post?.longitude || 0,
                is_nationwide: radius === 999,
                starts_at: new Date().toISOString(),
                ends_at: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
                daily_rate: dailyRate,
                total_cost: totalCost,
                status: 'active' // Auto-active for this MVP, normally 'pending' until paid
            });

            setIsSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Failed to boost:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
                <div className="w-full max-w-sm p-8 bg-card rounded-3xl border border-primary/30 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                        <Check className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="font-display font-bold text-2xl text-foreground mb-2">Boost Activated!</h2>
                    <p className="text-muted-foreground text-sm">Your ad is now running across the network.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="w-full max-w-md bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-4 border-b border-border/50 flex justify-between items-center bg-secondary/20">
                    <h2 className="font-display font-bold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        Boost Post
                    </h2>
                    <button onClick={onClose} className="p-2 bg-secondary rounded-full hover:bg-secondary/80">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Placements */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-foreground">Where should the ad appear?</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'feed', label: 'In-Feed' },
                                { id: 'comments', label: 'In-Comments' },
                                { id: 'explore', label: 'Explore Page' },
                                { id: 'search', label: 'Search Results' }
                            ].map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => togglePlacement(p.id)}
                                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                                        placements.includes(p.id)
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-secondary border-border hover:border-primary/50'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Radius */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-foreground">Reach / Radius</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setRadius(2)}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all ${radius === 2 ? 'bg-primary/10 border-primary text-primary' : 'bg-secondary border-border'}`}
                            >
                                2 km (Local)
                            </button>
                            <button
                                onClick={() => setRadius(4)}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all ${radius === 4 ? 'bg-primary/10 border-primary text-primary' : 'bg-secondary border-border'}`}
                            >
                                4 km (Expanded)
                            </button>
                            
                            <button
                                onClick={() => setRadius(15)}
                                disabled={tier !== 'national'}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all ${radius === 15 ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-secondary border-border disabled:opacity-30 disabled:cursor-not-allowed'}`}
                            >
                                Citywide
                            </button>
                            <button
                                onClick={() => setRadius(999)}
                                disabled={tier !== 'national'}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all ${radius === 999 ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-secondary border-border disabled:opacity-30 disabled:cursor-not-allowed'}`}
                            >
                                Nationwide
                            </button>
                        </div>
                        {tier !== 'national' && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Globe className="w-3 h-3" /> Upgrade to National to unlock Citywide & Nationwide
                            </p>
                        )}
                    </div>

                    {/* Duration */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-foreground flex justify-between">
                            Duration
                            <span className="text-primary">{days} Days</span>
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            className="w-full accent-primary"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>1 Day (500/d)</span>
                            <span>30 Days (350/d)</span>
                        </div>
                    </div>
                </div>

                {/* Footer / Payment */}
                <div className="p-4 bg-secondary/30 border-t border-border/50">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-muted-foreground">Total Cost</span>
                        <span className="font-display font-bold text-2xl text-foreground">
                            {totalCost.toLocaleString()} RWF
                        </span>
                    </div>
                    <button
                        onClick={handleBoost}
                        disabled={isSubmitting}
                        className="w-full bg-primary text-primary-foreground font-display font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pay & Boost with MoMo'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
