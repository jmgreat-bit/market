import React from 'react';
import { render, screen } from '@testing-library/react';
import { SponsoredPostCard } from './SponsoredPostCard';

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

import { AdWithDetails } from '@/hooks/useAds';

describe('SponsoredPostCard', () => {
    const defaultAd: AdWithDetails = {
        id: 'ad-1',
        business_id: 'biz-1',
        status: 'active',
        budget: 100,
        spent: 0,
        starts_at: '2023-01-01',
        ends_at: '2023-12-31',
        placements: ['feed'],
        post: {
            id: 'post-1',
            content: 'Check out our amazing products!',
            image_url: null,
            created_at: '2023-01-01T12:00:00Z',
            likes_count: 5,
            comments_count: 2,
        },
        business: {
            business_name: 'Test Business',
            category: 'Retail',
            profile_id: 'prof-1',
        },
    } as any;

    it('returns null when post is missing', () => {
        const adWithoutPost = { ...defaultAd, post: undefined } as any;
        const { container } = render(<SponsoredPostCard ad={adWithoutPost} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders the happy path correctly', () => {
        render(<SponsoredPostCard ad={defaultAd} />);

        // Check for sponsored badge
        expect(screen.getByText('Sponsored')).toBeInTheDocument();

        // Check for business name and fallback avatar initial
        expect(screen.getByText('Test Business')).toBeInTheDocument();
        expect(screen.getByText('T')).toBeInTheDocument();

        // Check for category
        expect(screen.getByText('Retail')).toBeInTheDocument();

        // Check for content
        expect(screen.getByText('Check out our amazing products!')).toBeInTheDocument();

        // Check for engagement stats
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();

        // Check for View Trader link
        const link = screen.getByRole('link', { name: /view trader/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/u/prof-1');
    });

    it('renders fallback values when optional business fields are missing', () => {
        const adWithMissingBusinessFields = {
            ...defaultAd,
            business: {
                // missing business_name and category
                profile_id: 'prof-2',
            },
        } as any;
        render(<SponsoredPostCard ad={adWithMissingBusinessFields} />);

        // Should fall back to 'Business' and 'B' for avatar
        expect(screen.getByText('Business')).toBeInTheDocument();
        expect(screen.getByText('B')).toBeInTheDocument();

        // Category should not be present
        expect(screen.queryByText('Retail')).not.toBeInTheDocument();

        // Ad label is still there
        expect(screen.getByText('Ad')).toBeInTheDocument();
    });

    it('renders the post image when provided', () => {
        const adWithImage = {
            ...defaultAd,
            post: {
                ...defaultAd.post,
                image_url: 'https://example.com/image.jpg',
            },
        } as any;
        render(<SponsoredPostCard ad={adWithImage} />);

        const image = screen.getByAltText('Sponsored content');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('hides View Trader link when business.profile_id is missing', () => {
        const adWithoutProfileId = {
            ...defaultAd,
            business: {
                ...defaultAd.business,
                profile_id: undefined,
            },
        } as any;
        render(<SponsoredPostCard ad={adWithoutProfileId} />);

        expect(screen.queryByRole('link', { name: /view trader/i })).not.toBeInTheDocument();
    });

    it('renders default engagement stats when missing', () => {
        const adWithNoStats = {
            ...defaultAd,
            post: {
                ...defaultAd.post,
                likes_count: undefined,
                comments_count: undefined,
            },
        } as any;
        render(<SponsoredPostCard ad={adWithNoStats} />);

        // Should default to 0 for both likes and comments
        const zeros = screen.getAllByText('0');
        expect(zeros.length).toBeGreaterThanOrEqual(2);
    });
});
