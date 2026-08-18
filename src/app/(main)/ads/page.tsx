'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { getSupabaseClient } from '@/lib/supabase/client';
import { AdWithDetails } from '@/hooks/useAds';
import { Megaphone, Plus, Clock, Target, CheckCircle2, Lock, XCircle, Globe, MapPin, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { motion } from 'framer-motion';
import { PostCard } from '@/components/features/feed/PostCard';

export default function AdsDashboardPage() {
    const { profile, isLoading: authLoading } = useUser();
    const [ads, setAds] = useState<AdWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const isTrader = profile?.role === 'trader';
    const hasPaidTier = profile?.trader_tier === 'pro' || profile?.trader_tier === 'national';

    useEffect(() => {
        if (!isTrader || !profile?.id || !hasPaidTier) {
            setIsLoading(false);
            return;
        }

        async function fetchMyAds() {
            try {
                setIsLoading(true);
                const supabase = getSupabaseClient();
                
                // First get business ID
                const { data: biz } = await supabase
                    .from('business_details')
                    .select('id')
                    .eq('profile_id', profile!.id)
                    .single();

                if (!biz) return;

                // Then get all ads for this business
                const { data, error } = await supabase
                    .from('ads')
                    .select(`
                        *,
                        post:posts(id, content, image_url, created_at, likes_count, comments_count)
                    `)
                    .eq('business_id', biz.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setAds(data as AdWithDetails[]);
            } catch (err) {
                console.error('Failed to fetch ads:', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchMyAds();
    }, [isTrader, profile?.id, hasPaidTier]);

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isTrader) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
                <Lock className="w-12 h-12 text-primary mb-4 opacity-50" />
                <h1 className="font-display text-2xl font-bold mb-2">Traders Only</h1>
                <p className="text-muted-foreground mb-6">You must be a verified trader to access the Ads Dashboard.</p>
                <Link href={ROUTES.FEED} className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold">
                    Return to Feed
                </Link>
            </div>
        );
    }

    if (!hasPaidTier) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
                <Megaphone className="w-12 h-12 text-primary mb-4 opacity-50" />
                <h1 className="font-display text-2xl font-bold mb-2">Ads Requires Pro</h1>
                <p className="text-muted-foreground mb-6 max-w-sm">Upgrade your account to Pro or National to unlock the advertising suite.</p>
                <Link href={ROUTES.PREMIUM} className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold">
                    Upgrade Now
                </Link>
            </div>
        );
    }

    const activeAds = ads.filter(a => a.status === 'active');
    const pendingAds = ads.filter(a => a.status === 'pending');
    const pastAds = ads.filter(a => a.status === 'expired' || a.status === 'cancelled');

    return (
        <div className="min-h-screen bg-background text-foreground pb-32 md:pb-12">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-12">
                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="font-display text-3xl font-black text-foreground tracking-tight mb-2">
                            Ads Dashboard
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Manage your active campaigns and create new direct ads.
                        </p>
                    </div>
                    <Link
                        href="/ads/create"
                        className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl font-bold text-sm shadow-geo-glow hover:opacity-90 transition-all shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        Create New Ad
                    </Link>
                </header>

                <div className="space-y-12">
                    {/* Active Ads */}
                    <section>
                        <h2 className="flex items-center gap-2 font-display text-xl font-bold mb-4">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            Active Campaigns
                        </h2>
                        {activeAds.length === 0 ? (
                            <div className="glass-card border border-border/50 rounded-2xl p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
                                <Target className="w-8 h-8 mb-3 opacity-20" />
                                <p className="text-sm">No active campaigns running.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {activeAds.map(ad => <AdCard key={ad.id} ad={ad} />)}
                            </div>
                        )}
                    </section>

                    {/* Pending Ads */}
                    <section>
                        <h2 className="flex items-center gap-2 font-display text-xl font-bold mb-4">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                            Pending Approval
                        </h2>
                        {pendingAds.length === 0 ? (
                            <div className="glass-card border border-border/50 rounded-2xl p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
                                <Clock className="w-8 h-8 mb-3 opacity-20" />
                                <p className="text-sm">No pending ads.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {pendingAds.map(ad => <AdCard key={ad.id} ad={ad} />)}
                            </div>
                        )}
                    </section>

                    {/* Past Ads */}
                    {pastAds.length > 0 && (
                        <section>
                            <h2 className="font-display text-xl font-bold mb-4 opacity-70">Past Campaigns</h2>
                            <div className="grid gap-4 sm:grid-cols-2 opacity-70 grayscale">
                                {pastAds.map(ad => <AdCard key={ad.id} ad={ad} />)}
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}

function AdCard({ ad }: { ad: AdWithDetails }) {
    const daysRemaining = Math.max(0, Math.ceil((new Date(ad.ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
    
    return (
        <div className="glass-card border border-border/50 rounded-2xl p-5 relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                        {ad.is_nationwide ? 'Nationwide Ad' : `${ad.radius_km}km Radius`}
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                        {ad.placements.map(p => (
                            <span key={p} className="text-[10px] bg-secondary px-2 py-0.5 rounded-md font-medium text-foreground capitalize">
                                {p.replace('in_', '')}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-display font-black text-lg text-foreground tracking-tight">
                        {ad.total_cost.toLocaleString()} <span className="text-[10px] text-muted-foreground">RWF</span>
                    </p>
                    {ad.status === 'active' && (
                        <p className="text-xs text-green-500 font-bold">{daysRemaining} days left</p>
                    )}
                </div>
            </div>
            
            <div className="bg-secondary/30 rounded-xl p-3 border border-border/30 flex-1 flex flex-col justify-center">
                {ad.post?.image_url && (
                    <div className="w-full h-24 rounded-lg bg-secondary mb-2 overflow-hidden">
                        <img src={ad.post.image_url} alt="Ad media" className="w-full h-full object-cover" />
                    </div>
                )}
                <p className="text-sm font-medium text-foreground line-clamp-2">
                    {ad.post?.content || "No text content"}
                </p>
            </div>
        </div>
    );
}
