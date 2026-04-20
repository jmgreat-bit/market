import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';
import { useUser } from './useUser';

export function useAnalytics() {
    const { profile } = useUser();
    const [metrics, setMetrics] = useState<{
        total_views: number;
        views_last_week: number;
        total_engagements: number;
        engagement_rate: number;
        total_navigations: number;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Track a view on a specific post
    // NOTE: Silenced until post_views table is created in Supabase
    const logPostView = useCallback(async (_postId: string) => {
        // Table not yet deployed — no-op to prevent 400 errors
        return;
    }, []);

    // Track navigation to a business
    const logNavigation = useCallback(async (businessId: string) => {
        try {
            const userId = profile?.id || null;
            const supabase = getSupabaseClient();
            
            await supabase
                .from('store_navigations')
                .insert({
                    business_id: businessId,
                    navigator_id: userId
                });
        } catch (err) {
            console.error('Failed to log navigation', err);
        }
    }, [profile?.id]);

    // Fetch the metrics for the trader dashboard
    const fetchTraderMetrics = useCallback(async () => {
        if (profile?.role !== 'trader') return;
        
        setIsLoading(true);
        try {
            const supabase = getSupabaseClient();
            // Using the RPC function we defined in SQL
            const { data, error } = await supabase.rpc('get_trader_metrics', {
                trader_user_id: profile.id
            });

            if (error) throw error;
            
            if (data && !data.error) {
                setMetrics(data as any);
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
            fetchTraderMetrics();
        }
    }, [profile?.id, profile?.role, fetchTraderMetrics]);

    return {
        metrics,
        isLoading,
        error,
        logPostView,
        logNavigation,
        refreshMetrics: fetchTraderMetrics
    };
}
