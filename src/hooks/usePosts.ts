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
    // Start with mock data immediately — no loading flash
    const [posts, setPosts] = useState<PostWithBusiness[]>(() => getMockPosts(options.limit));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If mock mode explicitly requested, nothing to do — already loaded
        if (options.useMockData) return;

        async function fetchPosts() {
            try {
                setIsLoading(true);
                setError(null);

                const supabase = getSupabaseClient();
                let query = supabase
                    .from('posts')
                    .select(`
                        *,
                        business:business_details(*)
                    `)
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

                // Only replace mock data if we got real posts back
                if (data && data.length > 0) {
                    setPosts(data);
                }
                // If empty, mock data is still shown (already set as initial state)
            } catch (err) {
                // Network failed — mock data stays in place, no error flash to user
                console.warn('Could not fetch real posts, showing mock data:', err);
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
