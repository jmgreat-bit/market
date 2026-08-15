import { renderHook, waitFor } from '@testing-library/react';
import { useBusinesses } from './useBusinesses';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getMockBusinesses } from '@/lib/mockData';

jest.mock('@/lib/supabase/client', () => ({
    getSupabaseClient: jest.fn(),
}));

jest.mock('@/lib/mockData', () => ({
    getMockBusinesses: jest.fn(),
}));

describe('useBusinesses', () => {
    const mockBusinesses = [
        { id: '1', name: 'Business 1', latitude: 1, longitude: 1 },
        { id: '2', name: 'Business 2', latitude: 2, longitude: 2 },
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock console.error to avoid noise in test output
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns mock data when useMockData is true', async () => {
        (getMockBusinesses as jest.Mock).mockReturnValue(mockBusinesses);

        const { result } = renderHook(() => useBusinesses({ useMockData: true }));

        // Initially loading is true in the component, but it gets resolved immediately in the effect
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.businesses).toEqual(mockBusinesses);
        expect(result.current.error).toBeNull();
        expect(getMockBusinesses).toHaveBeenCalledTimes(1);
        expect(getSupabaseClient).not.toHaveBeenCalled();
    });

    it('fetches from Supabase successfully without bounds', async () => {
        const mockSelect = jest.fn().mockResolvedValue({ data: mockBusinesses, error: null });
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
        (getSupabaseClient as jest.Mock).mockReturnValue({ from: mockFrom });

        const { result } = renderHook(() => useBusinesses());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.businesses).toEqual(mockBusinesses);
        expect(result.current.error).toBeNull();
        expect(getSupabaseClient).toHaveBeenCalledTimes(1);
        expect(mockFrom).toHaveBeenCalledWith('business_details');
        expect(mockSelect).toHaveBeenCalledWith('*');
    });

    it('applies map bounds correctly to the Supabase query', async () => {
        const bounds = { north: 10, south: -10, east: 20, west: -20 };
        const finalQueryPromise = Promise.resolve({ data: mockBusinesses, error: null });

        // Setup the chainable query mock
        const mockGteLongitude = jest.fn().mockReturnValue({ lte: jest.fn().mockReturnValue(finalQueryPromise) });
        const mockLteLongitude = jest.fn().mockReturnValue({ gte: mockGteLongitude });
        const mockGteLatitude = jest.fn().mockReturnValue({ lte: mockLteLongitude });
        const mockLteLatitude = jest.fn().mockReturnValue({ gte: mockGteLatitude });

        // Actually the chain goes: .gte('latitude').lte('latitude').gte('longitude').lte('longitude')
        const mockChain4 = { lte: jest.fn().mockReturnValue(finalQueryPromise) };
        const mockChain3 = { gte: jest.fn().mockReturnValue(mockChain4) };
        const mockChain2 = { lte: jest.fn().mockReturnValue(mockChain3) };
        const mockChain1 = { gte: jest.fn().mockReturnValue(mockChain2) };
        const mockSelect = jest.fn().mockReturnValue(mockChain1);

        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
        (getSupabaseClient as jest.Mock).mockReturnValue({ from: mockFrom });

        const { result } = renderHook(() => useBusinesses({ bounds }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.businesses).toEqual(mockBusinesses);
        expect(mockChain1.gte).toHaveBeenCalledWith('latitude', bounds.south);
        expect(mockChain2.lte).toHaveBeenCalledWith('latitude', bounds.north);
        expect(mockChain3.gte).toHaveBeenCalledWith('longitude', bounds.west);
        expect(mockChain4.lte).toHaveBeenCalledWith('longitude', bounds.east);
    });

    it('handles Supabase fetch error correctly', async () => {
        const mockError = new Error('Database connection failed');
        const mockSelect = jest.fn().mockResolvedValue({ data: null, error: mockError });
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
        (getSupabaseClient as jest.Mock).mockReturnValue({ from: mockFrom });

        const { result } = renderHook(() => useBusinesses());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.businesses).toEqual([]);
        expect(result.current.error).toBe('Failed to load businesses');
        expect(console.error).toHaveBeenCalledWith('[useBusinesses] Database fetch error:', mockError);
    });
});
