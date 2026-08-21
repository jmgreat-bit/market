import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ProfileReviews from './ProfileReviews';
import { useUser } from '@/hooks/useUser';
import { getSupabaseClient } from '@/lib/supabase/client';

jest.mock('@/hooks/useUser', () => ({
    useUser: jest.fn()
}));

jest.mock('@/lib/supabase/client', () => ({
    getSupabaseClient: jest.fn()
}));

jest.mock('date-fns', () => ({
    formatDistanceToNow: jest.fn(() => '5 minutes ago'),
}));

describe('ProfileReviews', () => {
    const mockUseUser = useUser as jest.Mock;
    const mockGetSupabaseClient = getSupabaseClient as jest.Mock;

    let mockProfilesIn: jest.Mock;
    let mockReviewsInsert: jest.Mock;
    let mockReviewsSelect: jest.Mock;
    let mockReviewsSingle: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockProfilesIn = jest.fn().mockResolvedValue({ data: [] });
        mockReviewsSingle = jest.fn().mockResolvedValue({ data: {}, error: null });
        mockReviewsSelect = jest.fn().mockReturnValue({ single: mockReviewsSingle });
        mockReviewsInsert = jest.fn().mockReturnValue({ select: mockReviewsSelect });

        const mockSupabase = {
            from: jest.fn((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: jest.fn().mockReturnValue({
                            in: mockProfilesIn
                        })
                    };
                }
                if (table === 'business_reviews') {
                    return {
                        insert: mockReviewsInsert
                    };
                }
                return {};
            })
        };

        mockGetSupabaseClient.mockReturnValue(mockSupabase);
    });

    it('renders empty state when there are no reviews', async () => {
        mockUseUser.mockReturnValue({ user: null, profile: null, isLoading: false });
        await act(async () => {
            render(<ProfileReviews businessId="biz-1" initialReviews={[]} averageRating={0} />);
        });
        expect(screen.getByText('No reviews yet.')).toBeInTheDocument();
    });

    it('renders initial reviews and fetches user details', async () => {
        mockUseUser.mockReturnValue({ user: null, profile: null, isLoading: false });

        mockProfilesIn.mockResolvedValue({
            data: [{ id: 'user-1', full_name: 'Alice Smith', avatar_url: 'avatar.jpg' }]
        });

        const initialReviews = [
            { id: 'rev-1', rating: 4, review: 'Great!', created_at: '2023-01-01T00:00:00Z', user_id: 'user-1' }
        ];

        await act(async () => {
            render(<ProfileReviews businessId="biz-1" initialReviews={initialReviews} averageRating={4.0} />);
        });

        expect(screen.getByText('4.0')).toBeInTheDocument();
        expect(screen.getByText('Great!')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });
    });

    it('shows "Write a Review" button when user is authenticated and hasn\'t reviewed', async () => {
        mockUseUser.mockReturnValue({ user: { id: 'user-2' }, profile: { full_name: 'Bob' }, isLoading: false });

        const initialReviews = [
            { id: 'rev-1', rating: 4, review: 'Great!', created_at: '2023-01-01T00:00:00Z', user_id: 'user-1' }
        ];

        await act(async () => {
            render(<ProfileReviews businessId="biz-1" initialReviews={initialReviews} averageRating={4} />);
        });

        expect(screen.getByText('Write a Review')).toBeInTheDocument();
    });

    it('does not show "Write a Review" button if user has already reviewed', async () => {
        mockUseUser.mockReturnValue({ user: { id: 'user-1' }, profile: { full_name: 'Alice' }, isLoading: false });

        const initialReviews = [
            { id: 'rev-1', rating: 4, review: 'Great!', created_at: '2023-01-01T00:00:00Z', user_id: 'user-1' }
        ];

        await act(async () => {
            render(<ProfileReviews businessId="biz-1" initialReviews={initialReviews} averageRating={4} />);
        });

        expect(screen.queryByText('Write a Review')).not.toBeInTheDocument();
    });

    it('allows user to write and submit a review', async () => {
        mockUseUser.mockReturnValue({
            user: { id: 'user-2' },
            profile: { full_name: 'Bob', username: 'bob123' },
            isLoading: false
        });

        mockReviewsSingle.mockResolvedValue({
            data: {
                id: 'rev-2',
                business_id: 'biz-1',
                user_id: 'user-2',
                rating: 5,
                review: 'Awesome place',
                created_at: '2023-01-02T00:00:00Z'
            },
            error: null
        });

        await act(async () => {
            render(<ProfileReviews businessId="biz-1" initialReviews={[]} averageRating={0} />);
        });

        // Click "Write a Review"
        fireEvent.click(screen.getByText('Write a Review'));

        // Text area and submit should be visible
        const textarea = screen.getByPlaceholderText(/What did you think/i);
        expect(textarea).toBeInTheDocument();

        // Type review
        fireEvent.change(textarea, { target: { value: 'Awesome place' } });

        // Submit
        fireEvent.click(screen.getByText('Submit Review'));

        await waitFor(() => {
            expect(mockReviewsInsert).toHaveBeenCalledWith({
                business_id: 'biz-1',
                user_id: 'user-2',
                rating: 5,
                review: 'Awesome place'
            });
        });

        // Optimistic update should show the new review
        await waitFor(() => {
            expect(screen.getByText('Awesome place')).toBeInTheDocument();
            expect(screen.getByText('Bob')).toBeInTheDocument();
        });

        // Form should be closed
        expect(screen.queryByPlaceholderText(/What did you think/i)).not.toBeInTheDocument();
    });

    it('shows error message if submitting review fails', async () => {
        mockUseUser.mockReturnValue({
            user: { id: 'user-2' },
            profile: { full_name: 'Bob' },
            isLoading: false
        });

        mockReviewsSingle.mockResolvedValue({
            data: null,
            error: { message: 'Failed to submit' }
        });

        await act(async () => {
            render(<ProfileReviews businessId="biz-1" initialReviews={[]} averageRating={0} />);
        });

        fireEvent.click(screen.getByText('Write a Review'));

        const textarea = screen.getByPlaceholderText(/What did you think/i);
        fireEvent.change(textarea, { target: { value: 'Awesome place' } });

        fireEvent.click(screen.getByText('Submit Review'));

        await waitFor(() => {
            expect(screen.getByText('Failed to submit')).toBeInTheDocument();
        });
    });
});
