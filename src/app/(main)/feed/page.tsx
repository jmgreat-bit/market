'use client';

import { useGeolocation } from '@/hooks/useGeolocation';
import { useNearbyPosts } from '@/hooks/useNearbyPosts';
import { FeedList } from '@/components/features/feed/FeedList';
import { MapPin, TrendingUp, Loader2, Radar, LocateFixed, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAds } from '@/hooks/useAds';
import { SponsoredPostCard } from '@/components/features/feed/SponsoredPostCard';
import { PostWithBusiness } from '@/types';
import { PostCard } from '@/components/features/feed/PostCard';
import type { AdWithDetails } from '@/hooks/useAds';

function SponsoredFeedList({ posts, isLoading: listLoading, error: listError, ads }: { posts: PostWithBusiness[]; isLoading: boolean; error: string | null; ads: AdWithDetails[] }) {
    if (ads.length === 0) {
        return <FeedList posts={posts} isLoading={listLoading} error={listError} />;
    }

    // Interleave: insert a sponsored post every 5 regular posts
    const items: React.ReactNode[] = [];
    let adIndex = 0;
    posts.forEach((post, i) => {
        items.push(
            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}>
                <PostCard post={post} />
            </motion.div>
        );
        if ((i + 1) % 5 === 0 && adIndex < ads.length) {
            items.push(
                <SponsoredPostCard key={`ad-${ads[adIndex].id}`} ad={ads[adIndex]} />
            );
            adIndex++;
        }
    });

    if (listLoading && posts.length === 0) {
        return <FeedList posts={posts} isLoading={listLoading} error={listError} />;
    }

    if (listError || posts.length === 0) {
        return <FeedList posts={posts} isLoading={listLoading} error={listError} />;
    }

    return <div className="space-y-4">{items}</div>;
}

import { useState, useMemo } from 'react';
import { DiscoveryChipBar } from '@/components/features/feed/DiscoveryChipBar';
import { DISCOVERY_TOPICS, DiscoveryTopic } from '@/lib/constants';

export default function FeedPage() {
    const { coordinates, isLoading: locationLoading, error: geoError, requestLocation } = useGeolocation();
    const { nearbyPosts, trendingPosts, isLoading, error, hasNearby, radiusUsed } = useNearbyPosts(coordinates);
    const { ads } = useAds('feed');
    const [selectedTopic, setSelectedTopic] = useState<DiscoveryTopic>(DISCOVERY_TOPICS[0]);

    // Filter posts based on selected topic
    const filterPostsByTopic = (list: PostWithBusiness[]) => {
        if (!selectedTopic || selectedTopic.id === 'all') return list;
        return list.filter((p) => {
            const contentLower = (p.content || '').toLowerCase();
            const categoryLower = (p.business?.category || '').toLowerCase();
            const matchesKeyword = selectedTopic.keywords.some(
                (kw) => contentLower.includes(kw.toLowerCase()) || categoryLower.includes(kw.toLowerCase())
            );
            const matchesCategory = selectedTopic.categoryFilter 
                && categoryLower === selectedTopic.categoryFilter.toLowerCase();
            return matchesKeyword || matchesCategory;
        });
    };

    const filteredNearby = useMemo(() => filterPostsByTopic(nearbyPosts), [nearbyPosts, selectedTopic]);
    const filteredTrending = useMemo(() => filterPostsByTopic(trendingPosts), [trendingPosts, selectedTopic]);

    return (
        <div className="min-h-screen">
            <div className="flex-1 px-4 md:px-8 pt-16 md:pt-20 max-w-3xl mx-auto w-full pb-32 md:pb-10">
                <div className="flex flex-col gap-1 mb-4">
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
                        Your Feed
                    </h1>
                    <p className="text-muted-foreground text-xs md:text-sm">
                        Discover what&apos;s happening around you.
                    </p>
                </div>

                {/* Horizontal Quick Discovery & Filter Bar */}
                <div className="mb-6">
                    <DiscoveryChipBar 
                        activeTopicId={selectedTopic.id} 
                        onSelectTopic={setSelectedTopic} 
                    />
                </div>



                {geoError && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/40 text-muted-foreground text-xs mb-4 shadow-sm">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="leading-relaxed">{geoError}</span>
                        <button onClick={requestLocation} className="ml-auto flex-shrink-0 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors">
                            Retry
                        </button>
                    </div>
                )}

                {/* Loading state */}
                {(isLoading || locationLoading) && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">
                            {locationLoading ? 'Finding your location...' : 'Loading posts...'}
                        </p>
                    </div>
                )}

                {!isLoading && !locationLoading && (
                    <>
                        {/* ── Near You Section ── */}
                        <section className="mb-10">
                            <div className="flex items-center gap-2 mb-5">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Radar className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <h2 className="font-display font-bold text-lg text-foreground">
                                        Near You
                                    </h2>
                                    {hasNearby && coordinates && (
                                        <p className="text-xs text-muted-foreground">
                                            Within {radiusUsed}km of your location
                                        </p>
                                    )}
                                </div>
                            </div>

                            {filteredNearby.length > 0 ? (
                                <SponsoredFeedList posts={filteredNearby} isLoading={false} error={error} ads={ads} />
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-card/60 backdrop-blur-[20px] border border-border/30 rounded-2xl p-8 text-center"
                                >
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                        <MapPin className="w-7 h-7 text-primary" />
                                    </div>
                                    <h3 className="font-display font-bold text-foreground text-lg mb-2">
                                        {selectedTopic.id !== 'all' ? `No ${selectedTopic.label} posts nearby yet` : 'No traders nearby yet'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                        {selectedTopic.id !== 'all' 
                                            ? `Try selecting another category or "All" to explore other posts in your area.`
                                            : coordinates
                                                ? "There are no active traders within 2km of your location yet. Be the first to discover what's happening nearby!"
                                                : "Enable location access to see what's happening around you."}
                                    </p>
                                    {selectedTopic.id !== 'all' && (
                                        <button
                                            onClick={() => setSelectedTopic(DISCOVERY_TOPICS[0])}
                                            className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold hover:bg-primary/20 transition-all"
                                        >
                                            View All Posts
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </section>

                        {/* ── Trending Section ── */}
                        {filteredTrending.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="font-display font-bold text-lg text-foreground">
                                            Trending {selectedTopic.id !== 'all' ? `in ${selectedTopic.label}` : ''}
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            Most active posts right now
                                        </p>
                                    </div>
                                </div>

                                <SponsoredFeedList posts={filteredTrending} isLoading={false} error={null} ads={[]} />
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
