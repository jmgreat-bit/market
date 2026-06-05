'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Eye, TrendingUp, Activity, Footprints,
    ArrowRight, Zap, Lock, Heart, MessageCircle,
    Navigation, Calendar, BarChart3, Crown
} from 'lucide-react';
import { useAnalytics, TimeFilter } from '@/hooks/useAnalytics';
import { useUser } from '@/hooks/useUser';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Post } from '@/types';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

const TIME_FILTERS: { id: TimeFilter; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week',  label: '7 Days' },
    { id: 'month', label: '30 Days' },
    { id: 'all',   label: 'All Time' },
];

export default function AnalyticsDashboardPage() {
    const { metrics, isLoading, timeFilter, setTimeFilter } = useAnalytics();
    const { profile, isLoading: authLoading } = useUser();
    const [traderPosts, setTraderPosts] = useState<Post[]>([]);
    const [postsLoading, setPostsLoading] = useState(false);

    const isTrader = profile?.role === 'trader';
    const traderTier = profile?.trader_tier;
    const hasPaidTier = traderTier === 'pro' || traderTier === 'national';

    useEffect(() => {
        if (!isTrader || !profile?.id || !hasPaidTier) return;

        async function fetchTraderPosts() {
            setPostsLoading(true);
            try {
                const supabase = getSupabaseClient();

                const { data: biz } = await supabase
                    .from('business_details')
                    .select('id')
                    .eq('profile_id', profile!.id)
                    .single();

                if (!biz) return;

                const { data } = await supabase
                    .from('posts')
                    .select(`
                        *,
                        likes:likes(count),
                        comments:comments(count),
                        views:post_views(count)
                    `)
                    .eq('business_id', biz.id)
                    .order('created_at', { ascending: false })
                    .limit(8);

                if (data) {
                    const enriched = data.map((post: any) => ({
                        ...post,
                        likes_count: post.likes?.[0]?.count ?? 0,
                        comments_count: post.comments?.[0]?.count ?? 0,
                        views_count: post.views?.[0]?.count ?? 0,
                    }));
                    setTraderPosts(enriched as Post[]);
                }
            } catch (err) {
                console.warn('Failed to fetch trader posts:', err);
            } finally {
                setPostsLoading(false);
            }
        }

        fetchTraderPosts();
    }, [isTrader, profile?.id, hasPaidTier]);

    // ── Non-trader gate ────────────────────────────────
    if (!authLoading && !isTrader) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center"
                >
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                        <Lock className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="font-display text-2xl font-bold text-foreground mb-2">Trader Analytics</h1>
                    <p className="text-muted-foreground max-w-xs mb-6">
                        Analytics dashboards are available to verified trader accounts only.
                    </p>
                    <Link
                        href={ROUTES.FEED}
                        className="bg-primary text-primary-foreground font-display font-bold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
                    >
                        Return to Feed
                    </Link>
                </motion.div>
            </div>
        );
    }

    // ── Free tier / undefined tier upgrade gate ────────
    if (!authLoading && isTrader && !hasPaidTier) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="glass-card rounded-2xl border border-border/50 p-8 sm:p-10 max-w-md w-full flex flex-col items-center"
                >
                    {/* Icon */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6"
                    >
                        <BarChart3 className="w-10 h-10 text-primary" />
                    </motion.div>

                    {/* Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.25 }}
                        className="font-display text-2xl sm:text-3xl font-black text-foreground tracking-tight mb-3"
                    >
                        Unlock Analytics
                    </motion.h1>

                    {/* Subtext */}
                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.35 }}
                        className="text-muted-foreground text-sm leading-relaxed max-w-sm mb-8"
                    >
                        Upgrade to Pro or National to access your full analytics dashboard — track views, engagement, navigation requests, and more.
                    </motion.p>

                    {/* CTA Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.45 }}
                    >
                        <Link
                            href={ROUTES.PREMIUM}
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-display font-bold px-8 py-3.5 rounded-full hover:opacity-90 transition-opacity text-sm"
                        >
                            <Crown className="w-4 h-4" />
                            Upgrade Now
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

    // ── Full analytics dashboard (Pro / National) ─────
    return (
        <div className="font-sans min-h-screen flex flex-col antialiased bg-background text-foreground pb-32 md:pb-12">
            <main className="flex-1 px-4 sm:px-6 lg:px-12 py-24 md:py-12 max-w-5xl mx-auto w-full">

                {/* Header */}
                <header className="mb-8">
                    <h1 className="font-display text-3xl font-black text-foreground tracking-tight mb-1">Analytics</h1>
                    <p className="text-muted-foreground text-sm">
                        Track your business performance and post engagement.
                    </p>
                </header>

                {/* Time Filter Toggle */}
                <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl w-fit mb-8">
                    <Calendar className="w-4 h-4 text-muted-foreground ml-2 mr-1 shrink-0" />
                    {TIME_FILTERS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setTimeFilter(f.id)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                timeFilter === f.id
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Total Views */}
                    <div className="bg-card rounded-2xl p-5 border border-border/30 relative overflow-hidden col-span-1">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                        <div className="flex items-center gap-2 text-muted-foreground mb-3">
                            <Eye className="w-4 h-4" />
                            <span className="text-xs font-medium">Views</span>
                        </div>
                        {isLoading ? (
                            <div className="h-9 bg-secondary rounded-lg animate-pulse w-20" />
                        ) : (
                            <div className="font-display text-3xl font-bold text-foreground">
                                {metrics
                                    ? metrics.total_views >= 1000
                                        ? `${(metrics.total_views / 1000).toFixed(1)}K`
                                        : metrics.total_views.toString()
                                    : '—'}
                            </div>
                        )}
                        <div className="text-xs text-primary mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> post views
                        </div>
                    </div>

                    {/* Engagement Rate */}
                    <div className="bg-card rounded-2xl p-5 border border-border/30 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
                        <div className="flex items-center gap-2 text-muted-foreground mb-3">
                            <Activity className="w-4 h-4" />
                            <span className="text-xs font-medium">Engagement</span>
                        </div>
                        {isLoading ? (
                            <div className="h-9 bg-secondary rounded-lg animate-pulse w-20" />
                        ) : (
                            <div className="font-display text-3xl font-bold text-foreground">
                                {metrics ? `${metrics.engagement_rate}%` : '—'}
                            </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                            {metrics ? `${metrics.total_engagements} interactions` : 'No data'}
                        </div>
                    </div>

                    {/* Likes */}
                    <div className="bg-card rounded-2xl p-5 border border-border/30 relative overflow-hidden">
                        <div className="flex items-center gap-2 text-muted-foreground mb-3">
                            <Heart className="w-4 h-4" />
                            <span className="text-xs font-medium">Likes</span>
                        </div>
                        {isLoading ? (
                            <div className="h-9 bg-secondary rounded-lg animate-pulse w-20" />
                        ) : (
                            <div className="font-display text-3xl font-bold text-foreground">
                                {metrics ? metrics.total_likes.toLocaleString() : '—'}
                            </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">across all posts</div>
                    </div>

                    {/* Store Navigations */}
                    <div className="bg-card rounded-2xl p-5 border border-border/30 relative overflow-hidden">
                        <div className="flex items-center gap-2 text-muted-foreground mb-3">
                            <Navigation className="w-4 h-4" />
                            <span className="text-xs font-medium">Directions</span>
                        </div>
                        {isLoading ? (
                            <div className="h-9 bg-secondary rounded-lg animate-pulse w-20" />
                        ) : (
                            <div className="font-display text-3xl font-bold text-foreground">
                                {metrics ? metrics.total_navigations.toLocaleString() : '—'}
                            </div>
                        )}
                        <div className="text-xs text-primary mt-1 flex items-center gap-1">
                            <Footprints className="w-3 h-3" /> store visits
                        </div>
                    </div>
                </div>

                {/* Reach Trend Visual */}
                <section className="bg-card rounded-2xl p-6 lg:p-8 flex flex-col relative overflow-hidden border border-border/30 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="font-display text-lg font-bold text-foreground">Reach Overview</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Engagement trend across your posts</p>
                        </div>
                        <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full border border-border/20">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-medium text-primary tracking-wider uppercase">Live</span>
                        </div>
                    </div>
                    <div className="min-h-[180px] flex items-end relative w-full">
                        <div className="absolute inset-0 flex items-end opacity-20 pointer-events-none">
                            <div className="w-full h-full bg-gradient-to-t from-primary/20 to-transparent blur-xl" />
                        </div>
                        <svg className="w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 200" style={{ height: 180 }}>
                            <defs>
                                <linearGradient id="chartGradient2" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <line opacity="0.1" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="50" y2="50" />
                            <line opacity="0.1" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="100" y2="100" />
                            <line opacity="0.1" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="150" y2="150" />
                            <path d="M0,170 C150,140 250,180 400,110 C550,40 650,100 800,70 L1000,40 L1000,200 L0,200 Z" fill="url(#chartGradient2)" />
                            <path d="M0,170 C150,140 250,180 400,110 C550,40 650,100 800,70 L1000,40" fill="none" stroke="var(--foreground)" strokeWidth="2.5" strokeLinecap="round" />
                            <circle cx="400" cy="110" fill="var(--background)" r="5" stroke="var(--primary)" strokeWidth="2.5" />
                            <circle cx="800" cy="70" fill="var(--background)" r="5" stroke="var(--primary)" strokeWidth="2.5" />
                            <circle className="animate-pulse" cx="1000" cy="40" fill="var(--primary)" r="7" />
                        </svg>
                    </div>
                </section>

                {/* Per-Post Breakdown */}
                <section className="bg-card border border-border/30 rounded-2xl p-6 lg:p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-display text-lg font-bold text-foreground">Post Performance</h2>
                        <Link
                            href={ROUTES.COMPOSE}
                            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                        >
                            New Post <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {postsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-secondary/50 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : traderPosts.length === 0 ? (
                        <div className="text-center py-10">
                            <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                            <p className="text-muted-foreground text-sm">No posts yet. Create your first one!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {traderPosts.map((post: any, i) => (
                                <div
                                    key={post.id}
                                    className="bg-secondary/40 rounded-xl p-4 flex items-center gap-4 border border-border/20 hover:bg-secondary/70 transition-colors"
                                >
                                    {/* Post Icon */}
                                    <div className={`w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center ${i % 2 === 0 ? 'bg-primary/10' : 'bg-accent/10'}`}>
                                        {post.image_url ? (
                                            <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Zap className={`w-5 h-5 ${i % 2 === 0 ? 'text-primary' : 'text-accent'}`} />
                                        )}
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-foreground truncate">
                                            {post.content?.substring(0, 55)}{(post.content?.length ?? 0) > 55 ? '…' : ''}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                    {/* Stats */}
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="text-center">
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Eye className="w-3.5 h-3.5" />
                                                <span className="text-sm font-bold text-foreground">{(post.views_count ?? 0).toLocaleString()}</span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">views</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Heart className="w-3.5 h-3.5" />
                                                <span className="text-sm font-bold text-foreground">{(post.likes_count ?? 0).toLocaleString()}</span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">likes</p>
                                        </div>
                                        <div className="text-center hidden sm:block">
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <MessageCircle className="w-3.5 h-3.5" />
                                                <span className="text-sm font-bold text-foreground">{(post.comments_count ?? 0).toLocaleString()}</span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">replies</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
}
