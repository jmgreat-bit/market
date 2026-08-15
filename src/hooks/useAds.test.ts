import { renderHook, waitFor } from '@testing-library/react';
import { useAds } from './useAds';
import { getSupabaseClient } from '@/lib/supabase/client';

jest.mock('@/lib/supabase/client', () => ({
    getSupabaseClient: jest.fn()
}));

describe('useAds hook', () => {
    let mockGte: jest.Mock;
    let mockLte: jest.Mock;
    let mockContains: jest.Mock;
    let mockEq: jest.Mock;
    let mockSelect: jest.Mock;
    let mockFrom: jest.Mock;
    let mockSupabase: unknown;

    beforeEach(() => {
        // Reset all mocks before each test
        mockGte = jest.fn();
        mockLte = jest.fn().mockReturnValue({ gte: mockGte });
        mockContains = jest.fn().mockReturnValue({ lte: mockLte });
        mockEq = jest.fn().mockReturnValue({ contains: mockContains });
        mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
        mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

        mockSupabase = {
            from: mockFrom
        };

        jest.spyOn(console, 'warn').mockImplementation(() => {}); // Mock console.warn to keep test output clean
        jest.clearAllMocks();
        (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
    });

    afterEach(() => {
        jest.restoreAllMocks(); // Restore original console.warn
    });

    it('fetches ads successfully and returns data', async () => {
        const mockAds = [{ id: '1', title: 'Ad 1' }, { id: '2', title: 'Ad 2' }];
        mockGte.mockResolvedValueOnce({ data: mockAds, error: null });

        const { result } = renderHook(() => useAds('feed'));

        expect(result.current.isLoading).toBe(true);
        expect(result.current.ads).toEqual([]);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.ads).toEqual(mockAds);
        expect(mockFrom).toHaveBeenCalledWith('ads');
        expect(mockSelect).toHaveBeenCalledWith(`
                        *,
                        post:posts(id, content, image_url, created_at),
                        business:business_details(business_name, category, profile_id)
                    `);
        expect(mockEq).toHaveBeenCalledWith('status', 'active');
        expect(mockContains).toHaveBeenCalledWith('placements', ['feed']);
    });

    it('handles empty results successfully', async () => {
        mockGte.mockResolvedValueOnce({ data: [], error: null });

        const { result } = renderHook(() => useAds('comments'));

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.ads).toEqual([]);
        expect(mockContains).toHaveBeenCalledWith('placements', ['comments']);
    });

    it('handles null data gracefully', async () => {
        mockGte.mockResolvedValueOnce({ data: null, error: null });

        const { result } = renderHook(() => useAds('explore'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.ads).toEqual([]);
    });

    it('handles Supabase errors and logs a warning', async () => {
        const mockError = { message: 'Database error' };
        mockGte.mockResolvedValueOnce({ data: null, error: mockError });

        const { result } = renderHook(() => useAds('search'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.ads).toEqual([]);
        expect(console.warn).toHaveBeenCalledWith('Failed to fetch ads:', 'Database error');
    });

    it('handles generic exceptions during fetch and logs a warning', async () => {
        const mockException = new Error('Network error');
        mockGte.mockRejectedValueOnce(mockException);

        const { result } = renderHook(() => useAds('feed'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.ads).toEqual([]);
        expect(console.warn).toHaveBeenCalledWith('Failed to fetch ads:', mockException);
    });

    it('refetches when placement argument changes', async () => {
        const mockAdsFeed = [{ id: '1', title: 'Feed Ad' }];
        const mockAdsSearch = [{ id: '2', title: 'Search Ad' }];

        // Setup mock to return different data on consecutive calls
        mockGte
            .mockResolvedValueOnce({ data: mockAdsFeed, error: null })
            .mockResolvedValueOnce({ data: mockAdsSearch, error: null });

        const { result, rerender } = renderHook(({ placement }) => useAds(placement as 'feed' | 'comments' | 'explore' | 'search'), {
            initialProps: { placement: 'feed' }
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.ads).toEqual(mockAdsFeed);
        expect(mockContains).toHaveBeenCalledWith('placements', ['feed']);

        // Rerender with a new placement
        rerender({ placement: 'search' });

        // Wait for the new fetch to complete
        await waitFor(() => {
            // Note: Since react renders synchronously and state update is batched,
            // isLoading will briefly go back to true and then false, but we wait for it to settle at false and have the new data
            expect(result.current.ads).toEqual(mockAdsSearch);
        });

        expect(mockContains).toHaveBeenCalledWith('placements', ['search']);
        expect(mockContains).toHaveBeenCalledTimes(2);
    });
});
