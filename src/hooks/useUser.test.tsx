import { renderHook, waitFor, act } from '@testing-library/react';
import { useUser } from './useUser';
import { UserProvider } from '@/contexts/UserContext';
import { getSupabaseClient } from '@/lib/supabase/client';

jest.mock('@/lib/supabase/client', () => ({
    getSupabaseClient: jest.fn()
}));

const mockSupabase = {
    auth: {
        getSession: jest.fn(),
        onAuthStateChange: jest.fn(),
        signOut: jest.fn()
    },
    from: jest.fn()
};

beforeEach(() => {
    jest.clearAllMocks();
    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
    });
});

describe('useUser', () => {
    it('should throw if used outside of provider', () => {
        // Prevent console.error from polluting the test output for the expected error
        const originalError = console.error;
        console.error = jest.fn();

        expect(() => renderHook(() => useUser())).toThrow('useUserContext must be used within a UserProvider');

        console.error = originalError;
    });

    it('should initialize with null user if no session exists', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: null },
            error: null
        });

        const { result } = renderHook(() => useUser(), { wrapper: UserProvider });

        expect(result.current.isLoading).toBe(true);
        expect(result.current.isAuthenticated).toBe(false);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.profile).toBeNull();
    });

    it('should handle getSession error', async () => {
        const error = new Error('Session error');
        mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: null },
            error
        });

        const { result } = renderHook(() => useUser(), { wrapper: UserProvider });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.profile).toBeNull();
    });

    it('should load user profile correctly', async () => {
        const user = { id: 'test-user-id' };
        const profile = { id: 'test-user-id', role: 'client' };

        mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: { user } },
            error: null
        });

        const mockSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: profile })
            })
        });
        mockSupabase.from.mockReturnValue({ select: mockSelect });

        const { result } = renderHook(() => useUser(), { wrapper: UserProvider });

        // Initial state
        expect(result.current.isLoading).toBe(true);
        expect(result.current.isAuthenticated).toBe(false);

        // Wait for state to settle
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(user);
        expect(result.current.profile).toEqual(profile);
    });

    it('should handle signOut', async () => {
        mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: null },
            error: null
        });
        mockSupabase.auth.signOut.mockResolvedValue({ error: null });

        const { result } = renderHook(() => useUser(), { wrapper: UserProvider });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
            await result.current.signOut();
        });

        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle auth state change - SIGNED_OUT', async () => {
        let authStateCallback: any = null;
        mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: { user: { id: 'user-id' } } },
            error: null
        });
        mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
            authStateCallback = callback;
            return { data: { subscription: { unsubscribe: jest.fn() } } };
        });

        const mockSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 'user-id' } })
            })
        });
        mockSupabase.from.mockReturnValue({ select: mockSelect });

        const { result } = renderHook(() => useUser(), { wrapper: UserProvider });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        // Trigger SIGNED_OUT
        await act(async () => {
            await authStateCallback('SIGNED_OUT', null);
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.profile).toBeNull();
    });

    it('should handle auth state change - SIGNED_IN', async () => {
        let authStateCallback: any = null;
        mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: null },
            error: null
        });
        mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
            authStateCallback = callback;
            return { data: { subscription: { unsubscribe: jest.fn() } } };
        });

        const { result } = renderHook(() => useUser(), { wrapper: UserProvider });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isAuthenticated).toBe(false);

        const mockSelect = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 'new-user-id', role: 'trader' } })
            })
        });
        mockSupabase.from.mockReturnValue({ select: mockSelect });

        // Trigger SIGNED_IN
        await act(async () => {
            await authStateCallback('SIGNED_IN', { user: { id: 'new-user-id' } });
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual({ id: 'new-user-id' });
        expect(result.current.profile).toEqual({ id: 'new-user-id', role: 'trader' });
    });

    it('should handle refreshProfile', async () => {
        const user = { id: 'test-user-id' };
        const initialProfile = { id: 'test-user-id', role: 'client' };
        const updatedProfile = { id: 'test-user-id', role: 'trader' };

        mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: { user } },
            error: null
        });

        const mockSelect = jest.fn()
            .mockReturnValueOnce({ // First call for init
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: initialProfile })
                })
            })
            .mockReturnValueOnce({ // Second call for refreshProfile
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: updatedProfile })
                })
            });
        mockSupabase.from.mockReturnValue({ select: mockSelect });

        const { result } = renderHook(() => useUser(), { wrapper: UserProvider });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.profile).toEqual(initialProfile);

        await act(async () => {
            await result.current.refreshProfile();
        });

        expect(result.current.profile).toEqual(updatedProfile);
    });
});
