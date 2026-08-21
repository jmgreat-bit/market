'use client';

import { useState, useEffect, useMemo } from 'react';
import { Sparkles, TrendingUp, Zap, MapPin, Loader2 } from 'lucide-react';
import { FeedList } from '@/components/features/feed/FeedList';
import { SponsoredPostCard } from '@/components/features/feed/SponsoredPostCard';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAds } from '@/hooks/useAds';
import { PostWithBusiness, CommercialHub } from '@/types';
import { DiscoveryChipBar } from '@/components/features/feed/DiscoveryChipBar';
import { DISCOVERY_TOPICS, DiscoveryTopic } from '@/lib/constants';
import Link from 'next/link';

let cachedTrending: PostWithBusiness[] | null = null;
let cachedHubs: CommercialHub[] | null = null;
let lastExploreFetch = 0;
const EXPLORE_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export default function ExplorePage() {
    const [trendingPosts, setTrendingPosts] = useState<PostWithBusiness[]>(cachedTrending || []);
    const [hubs, setHubs] = useState<CommercialHub[]>(cachedHubs || []);
    const [isLoading, setIsLoading] = useState(!cachedTrending);
    const [error, setError] = useState<string | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<DiscoveryTopic>(DISCOVERY_TOPICS[0]);
    const { ads: exploreAds } = useAds('explore');

    // Filter trending posts based on selected topic
    const filteredTrendingPosts = useMemo(() => {
        if (!selectedTopic || selectedTopic.id === 'all') return trendingPosts;
        return trendingPosts.filter((p) => {
            const contentLower = (p.content || '').toLowerCase();
            const categoryLower = (p.business?.category || '').toLowerCase();
            const matchesKeyword = selectedTopic.keywords.some(
                (kw) => contentLower.includes(kw.toLowerCase()) || categoryLower.includes(kw.toLowerCase())
            );
            const matchesCategory = selectedTopic.categoryFilter 
                && categoryLower === selectedTopic.categoryFilter.toLowerCase();
            return matchesKeyword || matchesCategory;
        });
    }, [trendingPosts, selectedTopic]);

    useEffect(() => {
        async function fetchTrending() {
            if (cachedTrending && Date.now() - lastExploreFetch < EXPLORE_CACHE_TTL) {
                setTrendingPosts(cachedTrending);
                setHubs(cachedHubs || []);
                setIsLoading(false);
                return;
            }

            try {
                if (!cachedTrending) setIsLoading(true);
                const supabase = getSupabaseClient();

                // Fetch Commercial Hubs
                const { data: hubsData } = await supabase
                    .from('commercial_hubs')
                    .select('*');
                if (hubsData) setHubs(hubsData);

                const { data, error: fetchError } = await supabase
                    .from('posts')
                    .select(`
                        *,
                        business:business_details(
                            *,
                            profile:profiles(avatar_url, full_name, username, trader_tier)
                        ),
                        media:post_media(*),
                        likes:likes(count),
                        comments:comments(count)
                    `)
                    .eq('is_hidden', false)
                    .order('created_at', { ascending: false })
                    .limit(10);
                
                if (fetchError) throw fetchError;

                // Enrich with aggregated counts and sort by engagement
                const enriched = (data || []).map((post: any) => ({
                    ...post,
                    likes_count: post.likes?.[0]?.count ?? 0,
                    comments_count: post.comments?.[0]?.count ?? 0,
                    images: (post.media && post.media.length > 0) ? post.media.filter((m: any) => m.type === "image").sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)).map((m: any) => ({ id: m.id, url: m.url, alt: m.alt_text })) : (post.image_url ? [{ id: "legacy", url: post.image_url }] : []),
                }));

                // Sort by total engagement (likes + comments) descending
                enriched.sort((a: any, b: any) =>
                    (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count)
                );

                const finalPosts = enriched as unknown as PostWithBusiness[];
                cachedTrending = finalPosts;
                if (hubsData) cachedHubs = hubsData;
                lastExploreFetch = Date.now();

                setTrendingPosts(finalPosts);
            } catch (err) {
                console.error('Failed to fetch trending:', err);
                if (!cachedTrending) setError('Failed to load posts');
            } finally {
                setIsLoading(false);
            }
        }
        fetchTrending();
    }, []);

    return (
        <div className="min-h-screen bg-background pb-32 md:pb-12 text-foreground">
            {/* Explore Header (Identical sizing to Feed) */}
            <div className="px-4 md:px-8 pt-16 md:pt-20 max-w-3xl mx-auto w-full">
                <div className="flex flex-col gap-1 mb-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
                            Explore
                        </h1>
                        <span className="bg-primary/15 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-primary/25 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> Trending
                        </span>
                    </div>
                    <p className="text-muted-foreground text-xs md:text-sm">
                        Discover popular businesses, active markets, and trending items.
                    </p>
                </div>

                {/* Sub-navigation Chips Bar (Matches Feed size) */}
                <div className="mb-6">
                    <DiscoveryChipBar 
                        activeTopicId={selectedTopic.id} 
                        onSelectTopic={setSelectedTopic} 
                    />
                </div>
            </div>

            {/* Feed content */}
            <div className="px-4 md:px-8 max-w-3xl mx-auto w-full">
                
                {/* Commercial Hubs Carousel */}
                {!isLoading && hubs.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-xl font-display font-black mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" /> Popular Commercial Hubs
                        </h2>
                        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x">
                            {hubs.map(hub => (
                                <Link key={hub.id} href={`/explore/hub/${hub.id}`} className="snap-start flex-none w-64 md:w-72 bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                                    <div className="h-32 bg-secondary relative overflow-hidden">
                                        {hub.image_url ? (
                                            <img 
                                                src={hub.image_url} 
                                                alt={hub.name} 
                                                onError={(e) => { 
                                                    (e.currentTarget as HTMLElement).style.display = 'none'; 
                                                }}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                            />
                                        ) : (
                                            <div className="w-full h-full geo-gradient opacity-20" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-3 left-3 text-white">
                                            <p className="font-bold font-display text-lg leading-tight">{hub.name}</p>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <p className="text-sm text-muted-foreground flex items-center gap-1 font-medium">
                                            <MapPin className="w-3.5 h-3.5" /> {hub.address || 'Kigali'}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

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
                        <FeedList posts={filteredTrendingPosts} isLoading={false} error={error} />
                    </>
                )}
            </div>
        </div>
    );
}
