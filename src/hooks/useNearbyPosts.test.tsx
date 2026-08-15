import { renderHook, waitFor, act } from '@testing-library/react';
import { useNearbyPosts } from './useNearbyPosts';
import { getSupabaseClient } from '@/lib/supabase/client';

jest.mock('@/lib/supabase/client', () => ({
    getSupabaseClient: jest.fn()
}));

const mockCoords = { latitude: 0, longitude: 0 };

describe('useNearbyPosts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const createMockSupabase = (postsData: any[] | null, adsData: any[] | null, postsError: any = null) => {
        const postsQuery = {
            select: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: postsData, error: postsError })
        };

        const adsQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            contains: jest.fn().mockResolvedValue({ data: adsData, error: null })
        };

        const mockClient = {
            from: jest.fn((table: string) => {
                if (table === 'posts') return postsQuery;
                if (table === 'ads') return adsQuery;
                return {};
            })
        };

        (getSupabaseClient as jest.Mock).mockReturnValue(mockClient);
    };

    it('handles initial loading state and resolves', async () => {
        createMockSupabase([], []);
        const { result } = renderHook(() => useNearbyPosts(null));
        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });
    });

    it('returns trending posts when no coordinates are provided', async () => {
        const mockPosts = [
            { id: '1', likes: [{ count: 5 }], comments: [{ count: 2 }] },
            { id: '2', likes: [{ count: 10 }], comments: [{ count: 5 }] }, // highest engagement
            { id: '3', likes: [{ count: 1 }], comments: [{ count: 1 }] },
        ];
        createMockSupabase(mockPosts, []);

        const { result } = renderHook(() => useNearbyPosts(null));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.hasNearby).toBe(false);
        expect(result.current.nearbyPosts).toEqual([]);
        expect(result.current.trendingPosts.length).toBe(3);
        // trending should be sorted by likes + comments
        expect(result.current.trendingPosts[0].id).toBe('2');
        expect(result.current.trendingPosts[1].id).toBe('1');
        expect(result.current.trendingPosts[2].id).toBe('3');
    });

    it('handles error state if fetch fails', async () => {
        createMockSupabase(null, null, new Error('Database Error'));

        const { result } = renderHook(() => useNearbyPosts(mockCoords));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBe('Failed to load posts');
        expect(result.current.nearbyPosts).toEqual([]);
        expect(result.current.trendingPosts).toEqual([]);
    });

    it('calculates nearby posts and expands radius if needed', async () => {
        const mockPosts = [
            { id: '1', latitude: 0, longitude: 0 }, // 0km
            { id: '2', latitude: 0.01, longitude: 0 }, // ~1.1km
            { id: '3', latitude: 0.03, longitude: 0 }, // ~3.3km
            { id: '4', latitude: 0.1, longitude: 0 }, // ~11km
        ];
        createMockSupabase(mockPosts, []);

        const { result } = renderHook(() => useNearbyPosts(mockCoords));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // 1km has 1 post. Expands to 2km: has 2 posts. Expands to 5km: has 3 posts.
        // It will stop at 5km and radiusUsed will be 5.
        // Post 4 is beyond 5km.
        expect(result.current.radiusUsed).toBe(5);
        expect(result.current.nearbyPosts.length).toBe(3);
        const nearbyIds = result.current.nearbyPosts.map(p => p.id);
        expect(nearbyIds).toContain('1');
        expect(nearbyIds).toContain('2');
        expect(nearbyIds).toContain('3');
        expect(nearbyIds).not.toContain('4');

        // Post 4 should be in trending
        expect(result.current.trendingPosts.length).toBe(1);
        expect(result.current.trendingPosts[0].id).toBe('4');
    });

    it('always includes ads and sorts them first in nearby', async () => {
        const mockPosts = [
            { id: '1', latitude: 0, longitude: 0 }, // 0km
            { id: '2', latitude: 0.1, longitude: 0 }, // ~11km (outside radius)
        ];
        const mockAds = [
            { post: { id: '3', latitude: 0.1, longitude: 0 } }, // Ad outside radius
        ];
        createMockSupabase(mockPosts, mockAds);

        const { result } = renderHook(() => useNearbyPosts(mockCoords));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Nearby should include post 1 (in radius) and post 3 (ad)
        expect(result.current.nearbyPosts.length).toBe(2);
        // Ads should be first
        expect(result.current.nearbyPosts[0].id).toBe('3');
        expect(result.current.nearbyPosts[0].is_ad).toBe(true);
        expect(result.current.nearbyPosts[1].id).toBe('1');
    });

    it('always includes national traders in nearby', async () => {
        const mockPosts = [
            { id: '1', latitude: 0.1, longitude: 0, business: { profile: { trader_tier: 'national' } } }, // Outside radius but national
            { id: '2', latitude: 0, longitude: 0 }, // Inside radius
        ];
        createMockSupabase(mockPosts, []);

        const { result } = renderHook(() => useNearbyPosts(mockCoords));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.nearbyPosts.length).toBe(2);
        const nearbyIds = result.current.nearbyPosts.map(p => p.id);
        expect(nearbyIds).toContain('1');
        expect(nearbyIds).toContain('2');
    });

    it('sorts pinned posts before regular nearby posts but after ads', async () => {
        const mockPosts = [
            { id: '1', latitude: 0, longitude: 0 }, // regular
            { id: '2', latitude: 0, longitude: 0, is_pinned: true }, // pinned
        ];
        const mockAds = [
            { post: { id: '3', latitude: 0, longitude: 0 } }, // ad
        ];
        createMockSupabase(mockPosts, mockAds);

        const { result } = renderHook(() => useNearbyPosts(mockCoords));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.nearbyPosts.length).toBe(3);
        expect(result.current.nearbyPosts[0].id).toBe('3'); // ad
        expect(result.current.nearbyPosts[1].id).toBe('2'); // pinned
        expect(result.current.nearbyPosts[2].id).toBe('1'); // regular
    });
});
