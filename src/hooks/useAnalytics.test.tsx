import { renderHook, act, waitFor } from '@testing-library/react';
import { useAnalytics } from './useAnalytics';
import { useUser } from './useUser';
import { getSupabaseClient } from '../lib/supabase/client';

jest.mock('./useUser');
jest.mock('../lib/supabase/client');

describe('useAnalytics', () => {
    const mockSupabase = {
        rpc: jest.fn(),
        from: jest.fn(),
    };

    const mockInsert = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
        mockSupabase.from.mockReturnValue({ insert: mockInsert });
    });

    it('returns initial state for non-trader', () => {
        (useUser as jest.Mock).mockReturnValue({ profile: { id: 'user1', role: 'client' } });

        const { result } = renderHook(() => useAnalytics());

        expect(result.current.metrics).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.timeFilter).toBe('week');
        expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it('fetches trader metrics on mount for trader role', async () => {
        (useUser as jest.Mock).mockReturnValue({ profile: { id: 'trader1', role: 'trader' } });

        const mockMetrics = {
            total_views: 100,
            total_engagements: 50,
            total_likes: 20,
            total_comments: 30,
            engagement_rate: 0.5,
            total_navigations: 10,
            time_filter: 'week'
        };

        mockSupabase.rpc.mockResolvedValueOnce({ data: mockMetrics, error: null });

        const { result } = renderHook(() => useAnalytics());

        // Initially loading
        expect(result.current.isLoading).toBe(true);

        // Wait for metrics to load
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(mockSupabase.rpc).toHaveBeenCalledWith('get_trader_metrics', {
            trader_user_id: 'trader1',
            time_filter: 'week'
        });

        expect(result.current.metrics).toEqual(mockMetrics);
        expect(result.current.error).toBeNull();
    });

    it('handles errors when fetching trader metrics', async () => {
        (useUser as jest.Mock).mockReturnValue({ profile: { id: 'trader1', role: 'trader' } });

        const mockError = new Error('Database error');
        mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: mockError });

        const { result } = renderHook(() => useAnalytics());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.metrics).toBeNull();
        expect(result.current.error).toEqual(mockError);
    });

    it('logs post view and deduplicates within the same session', async () => {
        (useUser as jest.Mock).mockReturnValue({ profile: { id: 'user1', role: 'client' } });

        const { result } = renderHook(() => useAnalytics());

        // First view
        await act(async () => {
            await result.current.logPostView('post1');
        });

        expect(mockSupabase.from).toHaveBeenCalledWith('post_views');
        expect(mockInsert).toHaveBeenCalledWith({ post_id: 'post1', viewer_id: 'user1' });
        expect(mockInsert).toHaveBeenCalledTimes(1);

        // Second view of same post (should deduplicate)
        await act(async () => {
            await result.current.logPostView('post1');
        });

        expect(mockInsert).toHaveBeenCalledTimes(1);

        // View of different post (should log)
        await act(async () => {
            await result.current.logPostView('post2');
        });

        expect(mockInsert).toHaveBeenCalledWith({ post_id: 'post2', viewer_id: 'user1' });
        expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    it('logs store navigation', async () => {
        (useUser as jest.Mock).mockReturnValue({ profile: { id: 'user1', role: 'client' } });

        const { result } = renderHook(() => useAnalytics());

        await act(async () => {
            await result.current.logNavigation('store1');
        });

        expect(mockSupabase.from).toHaveBeenCalledWith('store_navigations');
        expect(mockInsert).toHaveBeenCalledWith({ business_id: 'store1', navigator_id: 'user1' });
        expect(mockInsert).toHaveBeenCalledTimes(1);
    });

    it('updates time filter and triggers fetch', async () => {
        (useUser as jest.Mock).mockReturnValue({ profile: { id: 'trader1', role: 'trader' } });

        mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

        const { result } = renderHook(() => useAnalytics());

        // Wait for initial fetch
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Clear mock to check subsequent calls
        mockSupabase.rpc.mockClear();

        await act(async () => {
            result.current.setTimeFilter('month');
        });

        expect(result.current.timeFilter).toBe('month');

        // wait for fetch after time filter change
        await waitFor(() => {
            expect(mockSupabase.rpc).toHaveBeenCalledWith('get_trader_metrics', {
                trader_user_id: 'trader1',
                time_filter: 'month'
            });
        });
    });

    it('manually refreshes metrics', async () => {
        (useUser as jest.Mock).mockReturnValue({ profile: { id: 'trader1', role: 'trader' } });

        mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

        const { result } = renderHook(() => useAnalytics());

        // Wait for initial fetch
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Clear mock to check subsequent calls
        mockSupabase.rpc.mockClear();

        await act(async () => {
            await result.current.refreshMetrics();
        });

        expect(mockSupabase.rpc).toHaveBeenCalledWith('get_trader_metrics', {
            trader_user_id: 'trader1',
            time_filter: 'week' // The default
        });
        expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
    });
});
