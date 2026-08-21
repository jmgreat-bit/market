import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PostActions } from './PostActions';
import { useUser } from '@/hooks/useUser';
import { useConversations } from '@/hooks/useConversations';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { act } from '@testing-library/react';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
    motion: {
        button: ({ children, className, onClick, disabled }: any) => (
            <button className={className} onClick={onClick} disabled={disabled} data-testid="motion-button">
                {children}
            </button>
        ),
        div: ({ children, className }: any) => (
            <div className={className} data-testid="motion-div">
                {children}
            </div>
        ),
    },
}));

jest.mock('@/hooks/useUser', () => ({
    useUser: jest.fn(),
}));

jest.mock('@/hooks/useConversations', () => ({
    useConversations: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
    getSupabaseClient: jest.fn(),
}));

describe('PostActions', () => {
    const mockOnLike = jest.fn();
    const mockOnToggleComments = jest.fn();
    const mockPush = jest.fn();
    const mockGetOrCreateConversation = jest.fn();

    const defaultProps = {
        likesCount: 10,
        isLiked: false,
        commentsCount: 5,
        showComments: false,
        onLike: mockOnLike,
        onToggleComments: mockOnToggleComments,
        postId: 'post-123',
    };

    beforeEach(() => {
        jest.clearAllMocks();

        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
        (useConversations as jest.Mock).mockReturnValue({ getOrCreateConversation: mockGetOrCreateConversation });
        (useUser as jest.Mock).mockReturnValue({
            profile: { id: 'user-123' },
            user: { id: 'user-123' },
            isAuthenticated: true,
        });

        // Mock default Supabase behavior (not bookmarked)
        (getSupabaseClient as jest.Mock).mockReturnValue({
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
            delete: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
        });
    });

    it('renders like and comment buttons with counts', async () => {
        await act(async () => {
            render(<PostActions {...defaultProps} />);
        });

        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('calls onLike when like button is clicked', async () => {
        await act(async () => {
            render(<PostActions {...defaultProps} />);
        });

        const buttons = screen.getAllByTestId('motion-button');
        // Like is the first button
        fireEvent.click(buttons[0]);

        expect(mockOnLike).toHaveBeenCalledTimes(1);
    });

    it('calls onToggleComments when comment button is clicked', async () => {
        await act(async () => {
            render(<PostActions {...defaultProps} />);
        });

        const buttons = screen.getAllByTestId('motion-button');
        // Comment is the second button
        fireEvent.click(buttons[1]);

        expect(mockOnToggleComments).toHaveBeenCalledTimes(1);
    });

    it('renders WhatsApp button if phone is provided', async () => {
        await act(async () => {
            render(<PostActions {...defaultProps} phone="+1234567890" />);
        });

        expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    });

    it('does not render In-App Message button if user is owner', async () => {
        await act(async () => {
            render(<PostActions {...defaultProps} businessProfileId="user-123" businessId="biz-123" />);
        });

        expect(screen.queryByText('Message')).not.toBeInTheDocument();
    });

    it('renders In-App Message button if user is not owner and clicks it', async () => {
        mockGetOrCreateConversation.mockResolvedValue('conv-123');

        await act(async () => {
            render(<PostActions {...defaultProps} businessProfileId="other-user" businessId="biz-123" />);
        });

        const messageBtn = screen.getByText('Message');
        expect(messageBtn).toBeInTheDocument();

        fireEvent.click(messageBtn);

        await waitFor(() => {
            expect(mockGetOrCreateConversation).toHaveBeenCalledWith('other-user', 'biz-123');
            expect(mockPush).toHaveBeenCalledWith('/inbox/conv-123?refPostId=post-123');
        });
    });

    it('toggles bookmark', async () => {
        const mockInsert = jest.fn().mockResolvedValue({ error: null });
        (getSupabaseClient as jest.Mock).mockReturnValue({
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
            delete: jest.fn().mockReturnThis(),
            insert: mockInsert,
        });

        await act(async () => {
            render(<PostActions {...defaultProps} />);
        });

        // Wait for bookmark check to finish
        await waitFor(() => {
            expect(getSupabaseClient).toHaveBeenCalled();
        });

        // Bookmark is the last button in default
        const buttons = screen.getAllByTestId('motion-button');
        const bookmarkBtn = buttons[buttons.length - 1];

        await act(async () => {
            fireEvent.click(bookmarkBtn);
        });

        await waitFor(() => {
            expect(mockInsert).toHaveBeenCalledWith({
                user_id: 'user-123',
                post_id: 'post-123',
            });
        });
    });
});
