import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Ad } from '@/types';

type AdPlacement = 'feed' | 'comments' | 'explore' | 'search';

export interface AdWithDetails extends Ad {
    post?: {
        id: string;
        content: string;
        image_url: string | null;
        created_at: string;
        likes_count?: number;
        comments_count?: number;
    };
    business?: {
        business_name: string;
        category: string | null;
        profile_id: string;
    };
}

interface UseAdsResult {
    ads: AdWithDetails[];
    isLoading: boolean;
}

export function useAds(placement: AdPlacement): UseAdsResult {
    const [ads, setAds] = useState<AdWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAds() {
            try {
                setIsLoading(true);
                const supabase = getSupabaseClient();
                const now = new Date().toISOString();

                const { data, error } = await supabase
                    .from('ads')
                    .select(`
                        *,
                        post:posts(id, content, image_url, created_at),
                        business:business_details(business_name, category, profile_id)
                    `)
                    .eq('status', 'active')
                    .contains('placements', [placement])
                    .lte('starts_at', now)
                    .gte('ends_at', now);

                if (error) {
                    console.warn('Failed to fetch ads:', error.message);
                    setAds([]);
                    return;
                }

                setAds((data as AdWithDetails[]) || []);
            } catch (err) {
                console.warn('Failed to fetch ads:', err);
                setAds([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchAds();
    }, [placement]);

    return { ads, isLoading };
}
