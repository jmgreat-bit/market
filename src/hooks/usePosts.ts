'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getMockPosts } from '@/lib/mockData';
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

                // Use mock data if explicitly requested or as fallback
                if (options.useMockData) {
                    setPosts(getMockPosts(options.limit));
                    setIsLoading(false);
                    return;
                }

                const supabase = getSupabaseClient();
                let query = supabase
                    .from('posts')
                    .select(`
                        *,
                        business:business_details(*)
                    `)
                    .order('created_at', { ascending: false });

                // Filter by business ID if provided
                if (options.businessId) {
                    query = query.eq('business_id', options.businessId);
                }

                // Filter by map bounds if provided
                if (options.bounds) {
                    query = query
                        .gte('latitude', options.bounds.south)
                        .lte('latitude', options.bounds.north)
                        .gte('longitude', options.bounds.west)
                        .lte('longitude', options.bounds.east);
                }

                // Apply limit
                if (options.limit) {
                    query = query.limit(options.limit);
                }

                const { data, error: fetchError } = await query;

                if (fetchError) throw fetchError;

                // Use mock data if no real data found
                if (!data || data.length === 0) {
                    setPosts(getMockPosts(options.limit));
                } else {
                    setPosts(data);
                }
            } catch (err) {
                // Fallback to mock data on error
                console.warn('Using mock data due to error:', err);
                setPosts(getMockPosts(options.limit));
                setError(null); // Clear error since we have mock data
            } finally {
                setIsLoading(false);
            }
        }

        fetchPosts();
    }, [options.bounds?.north, options.bounds?.south, options.bounds?.east, options.bounds?.west, options.businessId, options.limit, options.useMockData]);

    return { posts, isLoading, error };
}
