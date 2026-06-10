'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { PostWithBusiness, MapBounds } from '@/types';

interface UsePostsOptions {
    bounds?: MapBounds;
    businessId?: string;
    limit?: number;
    useMockData?: boolean;
}

export function usePosts(options: UsePostsOptions = {}) {
    const [posts, setPosts] = useState<PostWithBusiness[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPosts() {
            try {
                setIsLoading(true);
                setError(null);

                const supabase = getSupabaseClient();
                let query = supabase
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
                    .order('is_pinned', { ascending: false })
                    .order('created_at', { ascending: false });

                if (options.businessId) {
                    query = query.eq('business_id', options.businessId);
                }

                if (options.bounds) {
                    query = query
                        .gte('latitude', options.bounds.south)
                        .lte('latitude', options.bounds.north)
                        .gte('longitude', options.bounds.west)
                        .lte('longitude', options.bounds.east);
                }

                if (options.limit) {
                    query = query.limit(options.limit);
                }

                const { data, error: fetchError } = await query;

                if (fetchError) throw fetchError;

                // Map the count aggregates into flat likes_count / comments_count
                const enriched = (data || []).map((post: any) => ({
                    ...post,
                    likes_count: post.likes?.[0]?.count ?? 0,
                    comments_count: post.comments?.[0]?.count ?? 0,
                }));

                setPosts(enriched);
            } catch (err) {
                console.error('Failed to fetch posts:', err);
                setError('Failed to load posts');
            } finally {
                setIsLoading(false);
            }
        }

        fetchPosts();
    }, [
        options.bounds?.north,
        options.bounds?.south,
        options.bounds?.east,
        options.bounds?.west,
        options.businessId,
        options.limit,
        options.useMockData,
    ]);

    return { posts, isLoading, error };
}
