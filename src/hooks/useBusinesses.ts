'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getMockBusinesses } from '@/lib/mockData';
import { BusinessDetails, MapBounds } from '@/types';

interface UseBusinessesOptions {
    bounds?: MapBounds;
    useMockData?: boolean;
}

export function useBusinesses(options: UseBusinessesOptions = {}) {
    const [businesses, setBusinesses] = useState<BusinessDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchBusinesses() {
            try {
                setIsLoading(true);
                setError(null);

                // Use mock data if explicitly requested or as fallback
                if (options.useMockData) {
                    setBusinesses(getMockBusinesses());
                    setIsLoading(false);
                    return;
                }

                const supabase = getSupabaseClient();
                let query = supabase.from('business_details').select('*');

                // Filter by map bounds if provided
                if (options.bounds) {
                    query = query
                        .gte('latitude', options.bounds.south)
                        .lte('latitude', options.bounds.north)
                        .gte('longitude', options.bounds.west)
                        .lte('longitude', options.bounds.east);
                }

                const { data, error: fetchError } = await query;

                if (fetchError) throw fetchError;

                // Use mock data if no real data found
                if (!data || data.length === 0) {
                    setBusinesses(getMockBusinesses());
                } else {
                    setBusinesses(data);
                }
            } catch (err) {
                // Fallback to mock data on error
                console.warn('Using mock data due to error:', err);
                setBusinesses(getMockBusinesses());
                setError(null); // Clear error since we have mock data
            } finally {
                setIsLoading(false);
            }
        }

        fetchBusinesses();
    }, [options.bounds?.north, options.bounds?.south, options.bounds?.east, options.bounds?.west, options.useMockData]);

    return { businesses, isLoading, error };
}
