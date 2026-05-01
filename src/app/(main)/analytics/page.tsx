'use client';

import { useEffect, useState } from 'react';
import {
    Eye,
    TrendingUp,
    Activity,
    Footprints,
    ArrowRight,
    Zap,
    Lock
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useUser } from '@/hooks/useUser';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Post } from '@/types';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

function timeRemaining(expiresAt: string | null): string {
    if (!expiresAt) return 'No expiry';
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    if (h > 0) return `${h}h ${m}m remaining`;
    return `${m}m remaining`;
}

export default function AnalyticsDashboardPage() {
    const { metrics, isLoading } = useAnalytics();
    const { profile, isLoading: authLoading } = useUser();
    const [traderPosts, setTraderPosts] = useState<Post[]>([]);
    const [postsLoading, setPostsLoading] = useState(false);

    const isTrader = profile?.role === 'trader';

    useEffect(() => {
        if (!isTrader || !profile?.id) return;

        async function fetchTraderPosts() {
            setPostsLoading(true);
            try {
                const supabase = getSupabaseClient();

                // First get the business linked to this trader
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
                        comments:comments(count)
                    `)
                    .eq('business_id', biz.id)
                    .order('created_at', { ascending: false })
                    .limit(6);

                if (data) {
                    const enriched = data.map((post: any) => ({
                        ...post,
                        likes_count: post.likes?.[0]?.count ?? 0,
                        comments_count: post.comments?.[0]?.count ?? 0,
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
    }, [isTrader, profile?.id]);

    // Non-trader access denied
    if (!authLoading && !isTrader) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
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
            </div>
        );
    }

    const displayName = profile?.full_name || 'Navigator';

    return (
        <div className="font-sans min-h-screen flex flex-col antialiased relative selection:bg-primary/30 selection:text-primary pb-32 md:pb-12 bg-background text-foreground">
            {/* Main Content Canvas */}
            <main className="flex-1 px-4 sm:px-6 lg:px-12 py-24 md:py-12 max-w-5xl mx-auto w-full z-10">
                {/* Page Header */}
                <header className="mb-10">
                    <p className="font-sans text-muted-foreground text-base mb-8 max-w-2xl">
                        Real-time engagement metrics and conversion tracking for your active GeoPulse campaigns.
                    </p>
                </header>

                {/* Real-time Reach Chart */}
                <section className="bg-card rounded-2xl p-6 lg:p-8 flex flex-col relative overflow-hidden border border-border/30 mb-8">
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div>
                            <div className="flex items-center gap-4">
                                <h2 className="font-display text-xl font-bold text-foreground">Real-time Reach</h2>
                                {isLoading && <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></span>}
                            </div>
                            <p className="font-sans text-sm text-muted-foreground mt-1">Unique views across all active zones (Last 24h)</p>
                        </div>
                        <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full border border-border/20">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            <span className="font-sans text-xs font-medium text-primary tracking-wider uppercase">Live</span>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[200px] md:min-h-[280px] flex items-end relative z-10 w-full pt-4">
                        {/* Ambient glow */}
                        <div className="absolute inset-0 flex items-end opacity-20 pointer-events-none">
                            <div className="w-full h-full bg-gradient-to-t from-primary/20 to-transparent blur-xl"></div>
                        </div>
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 300">
                            <line opacity="0.15" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="75" y2="75"></line>
                            <line opacity="0.15" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="150" y2="150"></line>
                            <line opacity="0.15" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="225" y2="225"></line>
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M0,250 C100,220 200,280 300,180 C400,80 500,150 600,120 C700,90 800,40 900,100 L1000,60 L1000,300 L0,300 Z" fill="url(#chartGradient)"></path>
                            <path className="blur-md" d="M0,250 C100,220 200,280 300,180 C400,80 500,150 600,120 C700,90 800,40 900,100 L1000,60" fill="none" opacity="0.2" stroke="var(--primary)" strokeWidth="12"></path>
                            <path d="M0,250 C100,220 200,280 300,180 C400,80 500,150 600,120 C700,90 800,40 900,100 L1000,60" fill="none" stroke="var(--foreground)" strokeWidth="2.5" strokeLinecap="round"></path>
                            <circle cx="300" cy="180" fill="var(--background)" r="5" stroke="var(--primary)" strokeWidth="2.5"></circle>
                            <circle cx="600" cy="120" fill="var(--background)" r="5" stroke="var(--primary)" strokeWidth="2.5"></circle>
                            <circle cx="900" cy="100" fill="var(--background)" r="5" stroke="var(--primary)" strokeWidth="2.5"></circle>
                            <circle className="animate-pulse" cx="1000" cy="60" fill="var(--primary)" r="7"></circle>
                        </svg>
                    </div>
                </section>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {/* Total Views */}
                    <div className="bg-card rounded-2xl p-6 border border-border/30 relative overflow-hidden">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="flex items-center gap-3 text-muted-foreground mb-4">
                            <Eye className="w-5 h-5" />
                            <h3 className="font-display text-sm font-medium">Total Views</h3>
                        </div>
                        <div>
                            {isLoading ? (
                                <div className="h-10 bg-secondary rounded-lg animate-pulse w-24 mb-1"></div>
                            ) : (
                                <div className="font-display text-4xl font-bold text-foreground mb-1">
                                    {metrics
                                        ? metrics.total_views >= 1000
                                            ? `${(metrics.total_views / 1000).toFixed(1)}K`
                                            : metrics.total_views.toString()
                                        : '—'}
                                </div>
                            )}
                            <div className="font-sans text-sm text-primary flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                <span>{metrics ? `${metrics.views_last_week} this week` : 'No data yet'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Shout Engagement */}
                    <div className="bg-card rounded-2xl p-6 border border-border/30 relative overflow-hidden">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent/5 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="flex items-center gap-3 text-muted-foreground mb-4">
                            <Activity className="w-5 h-5" />
                            <h3 className="font-display text-sm font-medium">Post Engagement</h3>
                        </div>
                        <div>
                            {isLoading ? (
                                <div className="h-10 bg-secondary rounded-lg animate-pulse w-24 mb-1"></div>
                            ) : (
                                <div className="font-display text-4xl font-bold text-foreground mb-1">
                                    {metrics ? `${metrics.engagement_rate}%` : '—'}
                                </div>
                            )}
                            <div className="font-sans text-sm text-primary flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                <span>{metrics ? `${metrics.total_engagements} engagements` : 'No data yet'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Store Navigations */}
                    <div className="bg-card rounded-2xl p-6 border border-border/30 relative overflow-hidden">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="flex items-center gap-3 text-muted-foreground mb-4">
                            <Footprints className="w-5 h-5" />
                            <h3 className="font-display text-sm font-medium">Store Navigations</h3>
                        </div>
                        <div>
                            {isLoading ? (
                                <div className="h-10 bg-secondary rounded-lg animate-pulse w-24 mb-1"></div>
                            ) : (
                                <div className="font-display text-4xl font-bold text-foreground mb-1">
                                    {metrics ? metrics.total_navigations.toLocaleString() : '—'}
                                </div>
                            )}
                            <div className="font-sans text-sm text-muted-foreground flex items-center gap-1">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <span>from map interactions</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Shouts Section — real posts */}
                <section className="bg-card border border-border/30 rounded-2xl p-6 lg:p-8 relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-display text-xl font-bold text-foreground">Active Posts</h2>
                        <Link
                            href={ROUTES.COMPOSE}
                            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                        >
                            New Post <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {postsLoading ? (
                        <div className="space-y-3">
                            {[1, 2].map(i => (
                                <div key={i} className="h-16 bg-secondary/50 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : traderPosts.length === 0 ? (
                        <div className="text-center py-10">
                            <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                            <p className="text-muted-foreground text-sm">No posts yet. Create your first one!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {traderPosts.map((post, i) => (
                                <div
                                    key={post.id}
                                    className="bg-secondary/50 rounded-xl p-4 flex items-center gap-4 border border-border/20 hover:bg-secondary/80 transition-colors cursor-pointer group"
                                >
                                    <div className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center ${i % 2 === 0 ? 'bg-primary/10' : 'bg-accent/10'}`}>
                                        {post.image_url ? (
                                            <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Zap className={`w-6 h-6 ${i % 2 === 0 ? 'text-primary' : 'text-accent'}`} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-display text-sm font-bold text-foreground truncate">
                                            {post.content.substring(0, 50)}{post.content.length > 50 ? '…' : ''}
                                        </h4>
                                        <p className="font-sans text-xs text-muted-foreground">
                                            {post.likes_count ?? 0} likes • {post.comments_count ?? 0} comments • {timeRemaining(post.expires_at)}
                                        </p>
                                    </div>
                                    <div className="w-16 h-8 shrink-0 flex items-end justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 30">
                                            <path d="M0,25 L20,20 L40,28 L60,15 L80,22 L100,5" fill="none" stroke={i % 2 === 0 ? 'var(--primary)' : 'var(--accent)'} strokeWidth="2"></path>
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Analytics Badge */}
                <div className="mt-8 flex justify-center">
                    <div className="flex flex-col items-center gap-2 py-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-primary text-xs font-display font-bold tracking-widest uppercase">Analytics</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
