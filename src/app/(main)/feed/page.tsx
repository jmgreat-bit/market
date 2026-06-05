'use client';

import { useGeolocation } from '@/hooks/useGeolocation';
import { useNearbyPosts } from '@/hooks/useNearbyPosts';
import { FeedList } from '@/components/features/feed/FeedList';
import { MapPin, TrendingUp, Loader2, Radar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FeedPage() {
    const { coordinates, isLoading: locationLoading } = useGeolocation();
    const { nearbyPosts, trendingPosts, isLoading, error, hasNearby, radiusUsed } = useNearbyPosts(coordinates);

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
                                <FeedList posts={nearbyPosts} isLoading={false} error={error} />
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

                                <FeedList posts={trendingPosts} isLoading={false} error={null} />
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
