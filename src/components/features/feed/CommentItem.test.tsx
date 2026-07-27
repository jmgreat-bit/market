import React from 'react';
import { render, screen } from '@testing-library/react';
import { CommentItem } from './CommentItem';

// Mock formatDistanceToNow so we have deterministic output for valid dates
jest.mock('date-fns', () => ({
    formatDistanceToNow: jest.fn(() => '5 minutes ago'),
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, ...props }: any) => (
            <div className={className} data-testid="motion-div" {...props}>
                {children}
            </div>
        ),
    },
}));

describe('CommentItem', () => {
    const defaultComment = {
        id: '1',
        post_id: '100',
        user_id: 'user123',
        user_name: 'Test User',
        content: 'This is a test comment',
        created_at: '2023-01-01T12:00:00Z',
    };

    it('renders basic comment information correctly', () => {
        render(<CommentItem comment={defaultComment} index={0} />);

        // Avatar fallback check (first letter of user_name)
        expect(screen.getByText('T')).toBeInTheDocument();

        // User name check
        expect(screen.getByText('Test User')).toBeInTheDocument();

        // Content check
        expect(screen.getByText('This is a test comment')).toBeInTheDocument();

        // Date formatting check (mocked to always return '5 minutes ago' for valid dates)
        expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
    });

    it('renders "User" and "U" when user_name is missing', () => {
        const commentWithoutUser = { ...defaultComment, user_name: undefined as any };
        render(<CommentItem comment={commentWithoutUser} index={0} />);

        expect(screen.getByText('U')).toBeInTheDocument();
        expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('renders image when image_url is provided', () => {
        const commentWithImage = { ...defaultComment, image_url: 'https://example.com/image.jpg' };
        render(<CommentItem comment={commentWithImage} index={0} />);

        const image = screen.getByAltText('Comment attachment');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    describe('Date formatting edge cases', () => {
        it('renders "Just now" when created_at is missing', () => {
            const commentWithoutDate = { ...defaultComment, created_at: undefined as any };
            render(<CommentItem comment={commentWithoutDate} index={0} />);

            expect(screen.getByText('Just now')).toBeInTheDocument();
        });

        it('renders "Just now" when created_at is null', () => {
            const commentWithNullDate = { ...defaultComment, created_at: null as any };
            render(<CommentItem comment={commentWithNullDate} index={0} />);

            expect(screen.getByText('Just now')).toBeInTheDocument();
        });

        it('renders "Just now" when created_at is an empty string', () => {
            const commentWithEmptyDate = { ...defaultComment, created_at: '' };
            render(<CommentItem comment={commentWithEmptyDate} index={0} />);

            expect(screen.getByText('Just now')).toBeInTheDocument();
        });

        it('renders "Just now" when created_at is an invalid date string', () => {
            const commentWithInvalidDate = { ...defaultComment, created_at: 'not-a-valid-date' };
            render(<CommentItem comment={commentWithInvalidDate} index={0} />);

            expect(screen.getByText('Just now')).toBeInTheDocument();
        });
    });
});
