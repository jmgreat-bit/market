'use client';

import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Zap, MapPin, Loader2 } from 'lucide-react';
import { FeedList } from '@/components/features/feed/FeedList';
import { SponsoredPostCard } from '@/components/features/feed/SponsoredPostCard';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAds } from '@/hooks/useAds';
import { PostWithBusiness } from '@/types';

export default function ExplorePage() {
    const [trendingPosts, setTrendingPosts] = useState<PostWithBusiness[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { ads: exploreAds } = useAds('explore');

    useEffect(() => {
        async function fetchTrending() {
            try {
                setIsLoading(true);
                const supabase = getSupabaseClient();
                const { data, error: fetchError } = await supabase
                    .from('posts')
                    .select(`
                        *,
                        business:business_details(
                            *,
                            profile:profiles(avatar_url, full_name)
                        ),
                        likes:likes(count),
                        comments:comments(count)
                    `)
                    .order('created_at', { ascending: false })
                    .limit(10);
                
                if (fetchError) throw fetchError;

                // Enrich with aggregated counts and sort by engagement
                const enriched = (data || []).map((post: any) => ({
                    ...post,
                    likes_count: post.likes?.[0]?.count ?? 0,
                    comments_count: post.comments?.[0]?.count ?? 0,
                }));

                // Sort by total engagement (likes + comments) descending
                enriched.sort((a: any, b: any) =>
                    (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count)
                );

                setTrendingPosts(enriched as unknown as PostWithBusiness[]);
            } catch (err) {
                console.error('Failed to fetch trending:', err);
                setError('Failed to load trending pulses');
            } finally {
                setIsLoading(false);
            }
        }
        fetchTrending();
    }, []);

    return (
        <div className="min-h-screen bg-background pb-32 md:pb-12 text-foreground">
            {/* Explore Header */}
            <div className="relative pt-20 md:pt-28 pb-8 px-6 md:px-10 max-w-3xl mx-auto w-full z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50 pointer-events-none" />
                <h1 className="text-4xl md:text-5xl font-display font-black text-foreground mb-4 tracking-tight flex items-center gap-4">
                    Explore
                    <span className="bg-primary/20 text-primary text-sm font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-primary/30 flex items-center gap-1">
                        <Sparkles className="w-4 h-4" /> Trending
                    </span>
                </h1>
                <p className="text-muted-foreground text-lg mb-8 max-w-lg">
                    Discover buzzing events, viral drops, and the hottest spots emerging in your city right now.
                </p>

                {/* Sub-navigation Pills */}
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                    <button className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm shadow-sm group">
                        🔥 Trending Now
                    </button>
                    <button className="px-5 py-2.5 rounded-full bg-secondary border border-border/10 text-foreground hover:bg-muted font-sans font-medium text-sm whitespace-nowrap">
                        <Zap className="w-4 h-4 inline-block mr-1.5 align-text-bottom text-primary" />
                        Flash Discounts
                    </button>
                    <button className="px-5 py-2.5 rounded-full bg-secondary border border-border/10 text-foreground hover:bg-muted font-sans font-medium text-sm whitespace-nowrap">
                        <MapPin className="w-4 h-4 inline-block mr-1.5 align-text-bottom text-primary" />
                        Local Events
                    </button>
                </div>
            </div>

            {/* Feed content */}
            <div className="px-6 md:px-10 max-w-3xl mx-auto w-full">
                {isLoading ? (
                    <div className="flex flex-col items-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-muted-foreground font-medium">Fetching the latest pulses...</p>
                    </div>
                ) : (
                    <>
                        {/* Sponsored posts at the top */}
                        {exploreAds.length > 0 && (
                            <div className="space-y-8 mb-8">
                                {exploreAds.slice(0, 2).map((ad) => (
                                    <SponsoredPostCard key={`explore-ad-${ad.id}`} ad={ad} />
                                ))}
                            </div>
                        )}
                        <FeedList posts={trendingPosts} isLoading={false} error={error} />
                    </>
                )}
            </div>
        </div>
    );
}
