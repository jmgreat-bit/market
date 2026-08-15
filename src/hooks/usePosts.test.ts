import { renderHook, waitFor } from '@testing-library/react';
import { usePosts } from './usePosts';
import { getSupabaseClient } from '@/lib/supabase/client';

jest.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

describe('usePosts', () => {
  let mockSupabase: any;
  let mockQuery: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockQuery = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      then: jest.fn(),
    };

    mockSupabase = {
      from: jest.fn().mockReturnValue(mockQuery),
    };

    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should fetch posts and map likes/comments counts', async () => {
    const mockData = [
      {
        id: '1',
        title: 'Post 1',
        likes: [{ count: 10 }],
        comments: [{ count: 5 }],
      },
      {
        id: '2',
        title: 'Post 2',
        likes: [],
        comments: null,
      },
    ];

    mockQuery.then.mockImplementation((resolve) => resolve({ data: mockData, error: null }));

    const { result } = renderHook(() => usePosts());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.posts).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.posts).toEqual([
      {
        id: '1',
        title: 'Post 1',
        likes: [{ count: 10 }],
        comments: [{ count: 5 }],
        likes_count: 10,
        comments_count: 5,
      },
      {
        id: '2',
        title: 'Post 2',
        likes: [],
        comments: null,
        likes_count: 0,
        comments_count: 0,
      },
    ]);

    expect(mockSupabase.from).toHaveBeenCalledWith('posts');
    expect(mockQuery.select).toHaveBeenCalled();
    expect(mockQuery.order).toHaveBeenCalledWith('is_pinned', { ascending: false });
    expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should apply businessId filter if provided', async () => {
    mockQuery.then.mockImplementation((resolve) => resolve({ data: [], error: null }));

    const { result } = renderHook(() => usePosts({ businessId: 'bus-123' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockQuery.eq).toHaveBeenCalledWith('business_id', 'bus-123');
  });

  it('should apply bounds filter if provided', async () => {
    mockQuery.then.mockImplementation((resolve) => resolve({ data: [], error: null }));

    const bounds = { north: 10, south: 0, east: 20, west: 10 };
    const { result } = renderHook(() => usePosts({ bounds }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockQuery.gte).toHaveBeenCalledWith('latitude', 0);
    expect(mockQuery.lte).toHaveBeenCalledWith('latitude', 10);
    expect(mockQuery.gte).toHaveBeenCalledWith('longitude', 10);
    expect(mockQuery.lte).toHaveBeenCalledWith('longitude', 20);
  });

  it('should apply limit if provided', async () => {
    mockQuery.then.mockImplementation((resolve) => resolve({ data: [], error: null }));

    const { result } = renderHook(() => usePosts({ limit: 5 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockQuery.limit).toHaveBeenCalledWith(5);
  });

  it('should handle fetch errors', async () => {
    const mockError = new Error('Database error');
    mockQuery.then.mockImplementation((resolve) => resolve({ data: null, error: mockError }));

    const { result } = renderHook(() => usePosts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load posts');
    expect(result.current.posts).toEqual([]);
  });
});
