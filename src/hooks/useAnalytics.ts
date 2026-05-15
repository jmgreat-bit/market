import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';
import { useUser } from './useUser';

export type TimeFilter = 'today' | 'week' | 'month' | 'all';

export interface TraderMetrics {
    total_views: number;
    total_engagements: number;
    total_likes: number;
    total_comments: number;
    engagement_rate: number;
    total_navigations: number;
    time_filter: TimeFilter;
}

export function useAnalytics() {
    const { profile } = useUser();
    const [metrics, setMetrics] = useState<TraderMetrics | null>(null);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Session-level deduplication: don't count the same post twice per page load
    const [viewedPosts] = useState(() => new Set<string>());

    // Track a view on a specific post
    const logPostView = useCallback(async (postId: string) => {
        if (viewedPosts.has(postId)) return;
        viewedPosts.add(postId);

        try {
            const userId = profile?.id || null;
            const supabase = getSupabaseClient();
            await supabase
                .from('post_views')
                .insert({ post_id: postId, viewer_id: userId });
        } catch (err) {
            console.warn('Failed to log post view:', err);
        }
    }, [profile?.id, viewedPosts]);

    // Track navigation to a business
    const logNavigation = useCallback(async (businessId: string) => {
        try {
            const userId = profile?.id || null;
            const supabase = getSupabaseClient();
            await supabase
                .from('store_navigations')
                .insert({ business_id: businessId, navigator_id: userId });
        } catch (err) {
            console.error('Failed to log navigation', err);
        }
    }, [profile?.id]);

    // Fetch the metrics for the trader dashboard
    const fetchTraderMetrics = useCallback(async (filter: TimeFilter) => {
        if (profile?.role !== 'trader') return;

        setIsLoading(true);
        setMetrics(null);
        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase.rpc('get_trader_metrics', {
                trader_user_id: profile.id,
                time_filter: filter
            });

            if (error) throw error;
            if (data && !data.error) {
                setMetrics(data as TraderMetrics);
            }
        } catch (err) {
            console.error('Error fetching trader metrics:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch metrics'));
        } finally {
            setIsLoading(false);
        }
    }, [profile?.id, profile?.role]);

    useEffect(() => {
        if (profile?.role === 'trader') {
            fetchTraderMetrics(timeFilter);
        }
    }, [profile?.id, profile?.role, timeFilter, fetchTraderMetrics]);

    return {
        metrics,
        isLoading,
        error,
        timeFilter,
        setTimeFilter,
        logPostView,
        logNavigation,
        refreshMetrics: () => fetchTraderMetrics(timeFilter),
    };
}
