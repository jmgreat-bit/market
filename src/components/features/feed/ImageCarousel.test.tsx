import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageCarousel } from './ImageCarousel';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

// Mock framer-motion to avoid animation issues and make testing easier
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, onClick, 'data-testid': dataTestId }: any) => (
            <div data-testid={dataTestId || 'motion-div'} onClick={onClick}>
                {children}
            </div>
        ),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons for easier querying
jest.mock('lucide-react', () => ({
    ChevronLeft: () => <svg data-testid="chevron-left" />,
    ChevronRight: () => <svg data-testid="chevron-right" />,
}));

describe('ImageCarousel', () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    });

    const singleImage = [{ url: 'https://example.com/img1.jpg', alt: 'Image 1' }];
    const multipleImages = [
        { url: 'https://example.com/img1.jpg', alt: 'Image 1' },
        { url: 'https://example.com/img2.jpg', alt: 'Image 2' },
        { url: 'https://example.com/img3.jpg', alt: 'Image 3' },
    ];

    it('returns null when images array is empty', () => {
        const { container } = render(<ImageCarousel images={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders a single image without navigation arrows, dots, or counter', () => {
        render(<ImageCarousel images={singleImage} />);

        // Image should be rendered
        const img = screen.getByAltText('Image 1');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/img1.jpg');

        // Navigation elements should not be present
        expect(screen.queryByTestId('chevron-left')).not.toBeInTheDocument();
        expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument();
        expect(screen.queryByText(/1 \/ 1/)).not.toBeInTheDocument();

        // Buttons for navigation shouldn't be rendered (since there is only 1 image)
        const buttons = screen.queryAllByRole('button');
        expect(buttons).toHaveLength(0);
    });

    it('renders multiple images with navigation arrows, dots, and counter', () => {
        render(<ImageCarousel images={multipleImages} />);

        // First image should be rendered
        const img = screen.getByAltText('Image 1');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/img1.jpg');

        // Navigation elements should be present
        expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
        expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
        expect(screen.getByText('1 / 3')).toBeInTheDocument();

        // There should be 2 arrow buttons + 3 dot buttons = 5 buttons total
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(5);
    });

    describe('Navigation', () => {
        it('advances to next image and wraps around', () => {
            render(<ImageCarousel images={multipleImages} />);

            const nextButton = screen.getByTestId('chevron-right').closest('button');

            // Initial state (Image 1)
            expect(screen.getByAltText('Image 1')).toBeInTheDocument();
            expect(screen.getByText('1 / 3')).toBeInTheDocument();

            // Click Next (Image 2)
            fireEvent.click(nextButton!);
            expect(screen.getByAltText('Image 2')).toBeInTheDocument();
            expect(screen.getByText('2 / 3')).toBeInTheDocument();

            // Click Next (Image 3)
            fireEvent.click(nextButton!);
            expect(screen.getByAltText('Image 3')).toBeInTheDocument();
            expect(screen.getByText('3 / 3')).toBeInTheDocument();

            // Click Next (wraps to Image 1)
            fireEvent.click(nextButton!);
            expect(screen.getByAltText('Image 1')).toBeInTheDocument();
            expect(screen.getByText('1 / 3')).toBeInTheDocument();
        });

        it('goes to previous image and wraps around', () => {
            render(<ImageCarousel images={multipleImages} />);

            const prevButton = screen.getByTestId('chevron-left').closest('button');

            // Initial state (Image 1)
            expect(screen.getByAltText('Image 1')).toBeInTheDocument();
            expect(screen.getByText('1 / 3')).toBeInTheDocument();

            // Click Prev (wraps to Image 3)
            fireEvent.click(prevButton!);
            expect(screen.getByAltText('Image 3')).toBeInTheDocument();
            expect(screen.getByText('3 / 3')).toBeInTheDocument();

            // Click Prev (Image 2)
            fireEvent.click(prevButton!);
            expect(screen.getByAltText('Image 2')).toBeInTheDocument();
            expect(screen.getByText('2 / 3')).toBeInTheDocument();
        });

        it('navigates directly to image when clicking pagination dot', () => {
            render(<ImageCarousel images={multipleImages} />);

            // The dots are rendered after the arrows. So indices 2, 3, 4 of buttons are the dots.
            // Alternatively, we can find them by checking if they are not the arrows.
            const buttons = screen.getAllByRole('button');
            const dotButtons = buttons.filter(b => !b.contains(screen.queryByTestId('chevron-left')) && !b.contains(screen.queryByTestId('chevron-right')));

            expect(dotButtons).toHaveLength(3);

            // Click the third dot (index 2)
            fireEvent.click(dotButtons[2]);

            expect(screen.getByAltText('Image 3')).toBeInTheDocument();
            expect(screen.getByText('3 / 3')).toBeInTheDocument();
        });
    });

    describe('Interaction', () => {
        it('pushes to post route when clicked and postId is provided', () => {
            render(<ImageCarousel images={singleImage} postId="post-123" />);

            const motionDiv = screen.getByTestId('motion-div');
            fireEvent.click(motionDiv);

            expect(mockPush).toHaveBeenCalledWith('/post/post-123');
            expect(mockPush).toHaveBeenCalledTimes(1);
        });

        it('does not call router.push when clicked and postId is absent', () => {
            render(<ImageCarousel images={singleImage} />);

            const motionDiv = screen.getByTestId('motion-div');
            fireEvent.click(motionDiv);

            expect(mockPush).not.toHaveBeenCalled();
        });
    });
});
