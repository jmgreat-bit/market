'use client';

import { useState, useEffect, useMemo } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { PostWithBusiness, Coordinates } from '@/types';

type EnrichedPost = PostWithBusiness & {
    is_ad?: boolean;
    _distance?: number;
};

/**
 * Haversine formula — returns distance in km between two lat/lng points.
 */
function haversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

interface UseNearbyPostsResult {
    nearbyPosts: EnrichedPost[];
    trendingPosts: EnrichedPost[];
    isLoading: boolean;
    error: string | null;
    hasNearby: boolean;
    radiusUsed: number;
}

export function useNearbyPosts(coordinates: Coordinates | null): UseNearbyPostsResult {
    const [allPosts, setAllPosts] = useState<PostWithBusiness[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all posts once
    useEffect(() => {
        async function fetchPosts() {
            try {
                setIsLoading(true);
                setError(null);

                const supabase = getSupabaseClient();
                const now = new Date().toISOString();
                const { data, error: fetchError } = await supabase
                    .from('posts')
                    .select(`
                        *,
                        business:business_details(
                            *,
                            profile:profiles(avatar_url, full_name, username, trader_tier)
                        ),
                        likes:likes(count),
                        comments:comments(count),
                        poll_options:poll_options(id, post_id, label, votes_count, created_at)
                    `)
                    .or(`expires_at.gte.${now},expires_at.is.null`)
                    .order('is_pinned', { ascending: false })
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (fetchError) throw fetchError;

                const enriched = (data || []).map((post: any) => ({
                    ...post,
                    likes_count: post.likes?.[0]?.count ?? 0,
                    comments_count: post.comments?.[0]?.count ?? 0,
                }));

                // Fetch active ads
                const { data: adsData } = await supabase
                    .from('ads')
                    .select(`
                        id,
                        post:posts(
                            *,
                            business:business_details(
                                *,
                                profile:profiles(avatar_url, full_name, username, trader_tier)
                            ),
                            likes:likes(count),
                            comments:comments(count),
                            poll_options:poll_options(id, post_id, label, votes_count, created_at)
                        )
                    `)
                    .eq('status', 'active')
                    .lte('starts_at', now)
                    .gte('ends_at', now)
                    .contains('placements', ['feed']);

                const adPosts = (adsData || [])
                    .filter((ad: any) => ad.post)
                    .map((ad: any) => ({
                        ...ad.post,
                        likes_count: ad.post.likes?.[0]?.count ?? 0,
                        comments_count: ad.post.comments?.[0]?.count ?? 0,
                        is_ad: true
                    }));

                // Combine regular posts and ad posts, filtering duplicates
                const adPostIds = new Set(adPosts.map((p: any) => p.id));
                const finalPosts = [...adPosts, ...enriched.filter((p: any) => !adPostIds.has(p.id))];

                setAllPosts(finalPosts);
            } catch (err) {
                console.error('Failed to fetch posts:', err);
                setError('Failed to load posts');
            } finally {
                setIsLoading(false);
            }
        }

        fetchPosts();
    }, []);

    // Compute nearby and trending from the fetched posts
    const result = useMemo(() => {
        if (!coordinates || allPosts.length === 0) {
            // No location available — just show trending
            const trending = [...allPosts].sort(
                (a, b) =>
                    (b.likes_count + b.comments_count) -
                    (a.likes_count + a.comments_count)
            );
            return {
                nearbyPosts: [],
                trendingPosts: trending,
                hasNearby: false,
                radiusUsed: 1,
            };
        }

        const { latitude: userLat, longitude: userLng } = coordinates;

        // Attach distance to every post that has coords
        const postsWithDistance = allPosts
            .filter((p) => p.latitude != null && p.longitude != null)
            .map((p) => ({
                ...p,
                _distance: haversineDistance(userLat, userLng, p.latitude!, p.longitude!),
            }));

        // Try 1km first, but always include national traders or active ads
        let nearby = postsWithDistance.filter((p: any) => p._distance <= 1 || p.is_ad || p.business?.profile?.trader_tier === 'national');
        let radiusUsed = 1;

        // If fewer than 3 posts within 1km, expand to 2km
        if (nearby.length < 3) {
            nearby = postsWithDistance.filter((p: any) => p._distance <= 2 || p.is_ad || p.business?.profile?.trader_tier === 'national');
            radiusUsed = 2;
        }

        // If fewer than 3 posts within 2km, expand to 5km
        if (nearby.length < 3) {
            nearby = postsWithDistance.filter((p: any) => p._distance <= 5 || p.is_ad || p.business?.profile?.trader_tier === 'national');
            radiusUsed = 5;
        }

        // Sort nearby by: ads first, then pinned, then distance
        nearby.sort((a, b) => {
            if (a.is_ad && !b.is_ad) return -1;
            if (!a.is_ad && b.is_ad) return 1;
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            return a._distance! - b._distance!;
        });

        // Trending = all posts sorted by engagement (exclude already-shown nearby)
        const nearbyIds = new Set(nearby.map((p) => p.id));
        const trending = allPosts
            .filter((p) => !nearbyIds.has(p.id))
            .sort(
                (a, b) =>
                    (b.likes_count + b.comments_count) -
                    (a.likes_count + a.comments_count)
            );

        return {
            nearbyPosts: nearby as PostWithBusiness[],
            trendingPosts: trending,
            hasNearby: nearby.length > 0,
            radiusUsed,
        };
    }, [coordinates, allPosts]);

    return {
        ...result,
        isLoading,
        error,
    };
}
