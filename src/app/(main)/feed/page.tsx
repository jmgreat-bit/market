'use client';

import { useGeolocation } from '@/hooks/useGeolocation';
import { useNearbyPosts } from '@/hooks/useNearbyPosts';
import { FeedList } from '@/components/features/feed/FeedList';
import { MapPin, TrendingUp, Loader2, Radar } from 'lucide-react';
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

    return <div className="space-y-8">{items}</div>;
}

export default function FeedPage() {
    const { coordinates, isLoading: locationLoading } = useGeolocation();
    const { nearbyPosts, trendingPosts, isLoading, error, hasNearby, radiusUsed } = useNearbyPosts(coordinates);
    const { ads } = useAds('feed');

    return (
        <div className="min-h-screen">
            <div className="flex-1 px-6 md:px-10 pt-20 md:pt-28 max-w-3xl mx-auto w-full pb-32 md:pb-10">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight mb-2">
                    Your Feed
                </h1>
                <p className="text-muted-foreground text-base mb-8 max-w-lg">
                    Discover what&apos;s happening around you.
                </p>

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

                            {hasNearby ? (
                                <SponsoredFeedList posts={nearbyPosts} isLoading={false} error={error} ads={ads} />
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
                                        No traders nearby yet
                                    </h3>
                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                        {coordinates
                                            ? "There are no active traders within 2km of your location yet. Be the first to discover what's happening nearby!"
                                            : "Enable location access to see what's happening around you."}
                                    </p>
                                </motion.div>
                            )}
                        </section>

                        {/* ── Trending Section ── */}
                        {trendingPosts.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="font-display font-bold text-lg text-foreground">
                                            Trending
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            Popular posts across Rwanda
                                        </p>
                                    </div>
                                </div>

                                <SponsoredFeedList posts={trendingPosts} isLoading={false} error={null} ads={ads} />
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
