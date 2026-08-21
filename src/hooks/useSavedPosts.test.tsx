import { renderHook, waitFor, act } from '@testing-library/react';
import { useSavedPosts } from './useSavedPosts';
import { useUser } from '@/hooks/useUser';
import { getSupabaseClient } from '@/lib/supabase/client';

// Mock dependencies
jest.mock('@/hooks/useUser', () => ({
    useUser: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
    getSupabaseClient: jest.fn(),
}));

describe('useSavedPosts', () => {
    let mockSupabase: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
        };

        (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
    });

    it('returns empty posts and does not fetch when no profile exists', async () => {
        (useUser as jest.Mock).mockReturnValue({ profile: null });

        const { result } = renderHook(() => useSavedPosts());

        expect(result.current.isLoading).toBe(false);
        expect(result.current.posts).toEqual([]);
        expect(result.current.error).toBeNull();
        expect(getSupabaseClient).not.toHaveBeenCalled();
    });

    it('fetches and formats saved posts successfully when user profile exists', async () => {
        (useUser as jest.Mock).mockReturnValue({ profile: { id: 'user-123' } });

        const mockData = [
            {
                post_id: 'post-1',
                posts: {
                    id: 'post-1',
                    content: 'Test post',
                    likes: [{ count: 5 }],
                    comments: [{ count: 2 }],
                    business: {
                        name: 'Test Business',
                        profile: { avatar_url: 'avatar.jpg', full_name: 'Test Name', username: 'testuser', trader_tier: 'premium' }
                    }
                }
            }
        ];

        mockSupabase.order.mockResolvedValueOnce({ data: mockData, error: null });

        const { result } = renderHook(() => useSavedPosts());

        // Wait for fetch to complete and state to update
        await waitFor(() => {
            expect(result.current.posts).toHaveLength(1);
        });

        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.posts[0]).toEqual({
            id: 'post-1',
            content: 'Test post',
            likes: [{ count: 5 }],
            comments: [{ count: 2 }],
            business: {
                name: 'Test Business',
                profile: { avatar_url: 'avatar.jpg', full_name: 'Test Name', username: 'testuser', trader_tier: 'premium' }
            },
            likes_count: 5,
            comments_count: 2
        });

        // Ensure Supabase was called with correct parameters
        expect(mockSupabase.from).toHaveBeenCalledWith('bookmarks');
        expect(mockSupabase.select).toHaveBeenCalled();
        expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
        expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('handles null posts relations properly and filters them out', async () => {
        (useUser as jest.Mock).mockReturnValue({ profile: { id: 'user-123' } });

        const mockData = [
            {
                post_id: 'post-1',
                posts: null // Missing post data
            },
            {
                post_id: 'post-2',
                posts: {
                    id: 'post-2',
                    content: 'Valid post'
                }
            }
        ];

        mockSupabase.order.mockResolvedValueOnce({ data: mockData, error: null });

        const { result } = renderHook(() => useSavedPosts());

        await waitFor(() => {
            expect(result.current.posts).toHaveLength(1);
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.posts[0].id).toBe('post-2');
    });

    it('sets error state when the fetch fails', async () => {
        (useUser as jest.Mock).mockReturnValue({ profile: { id: 'user-123' } });

        const mockError = new Error('Database error');
        mockSupabase.order.mockResolvedValueOnce({ data: null, error: mockError });

        // Spy on console.error to avoid test output noise
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useSavedPosts());

        // Wait for fetch to complete and state to update
        await waitFor(() => {
            expect(result.current.error).toBe('Failed to fetch saved posts');
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.posts).toEqual([]);

        consoleSpy.mockRestore();
    });

    it('handles unexpected exceptions during fetch', async () => {
        (useUser as jest.Mock).mockReturnValue({ profile: { id: 'user-123' } });

        mockSupabase.order.mockRejectedValueOnce(new Error('Network failure'));

        // Spy on console.error to avoid test output noise
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useSavedPosts());

        // Wait for fetch to complete and state to update
        await waitFor(() => {
            expect(result.current.error).toBe('Failed to fetch saved posts');
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.posts).toEqual([]);

        consoleSpy.mockRestore();
    });

    it('allows manual refetching of posts', async () => {
        (useUser as jest.Mock).mockReturnValue({ profile: { id: 'user-123' } });

        const mockData1 = [{ post_id: 'post-1', posts: { id: 'post-1' } }];
        const mockData2 = [{ post_id: 'post-2', posts: { id: 'post-2' } }];

        // First call from useEffect
        mockSupabase.order.mockResolvedValueOnce({ data: mockData1, error: null });

        const { result } = renderHook(() => useSavedPosts());

        await waitFor(() => {
            expect(result.current.posts).toHaveLength(1);
        });

        expect(result.current.posts[0].id).toBe('post-1');

        // Setup second response for refetch
        mockSupabase.order.mockResolvedValueOnce({ data: mockData2, error: null });

        // Trigger refetch
        await act(async () => {
            await result.current.refetch();
        });

        expect(result.current.posts[0].id).toBe('post-2');
    });
});
