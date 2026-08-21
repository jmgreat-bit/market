/** @jest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react';
import { PostBody } from './PostBody';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

// Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/hooks/useUser', () => ({
    useUser: jest.fn(),
}));

// Mock Sub-components
jest.mock('./ImageCarousel', () => ({
    ImageCarousel: () => <div data-testid="mock-image-carousel" />
}));

jest.mock('./LinkPreview', () => ({
    LinkPreview: () => <div data-testid="mock-link-preview" />
}));

jest.mock('./PollDisplay', () => ({
    PollDisplay: () => <div data-testid="mock-poll-display" />
}));

jest.mock('./CounterControls', () => ({
    CounterControls: () => <div data-testid="mock-counter-controls" />
}));

describe('PostBody Component', () => {
    const mockRouterPush = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
        (useUser as jest.Mock).mockReturnValue({ profile: { id: 'user-123' } });
    });

    it('renders plain text content correctly', () => {
        const content = 'Hello world! #test @user';
        render(<PostBody content={content} />);

        expect(screen.getByText(content)).toBeInTheDocument();
    });

    it('renders legacy image when imageUrl is provided and images array is absent', () => {
        const imageUrl = 'https://example.com/image.jpg';
        render(<PostBody content="Test content" imageUrl={imageUrl} />);

        const imgElement = screen.getByAltText('Post image') as HTMLImageElement;
        expect(imgElement).toBeInTheDocument();
        expect(imgElement.src).toBe(imageUrl);
    });

    it('renders ImageCarousel when images array is provided', () => {
        const images = [{ url: 'https://example.com/img1.jpg', width: 100, height: 100 }];
        render(<PostBody content="Test content" images={images} />);

        expect(screen.getByTestId('mock-image-carousel')).toBeInTheDocument();
        // Legacy image shouldn't render
        expect(screen.queryByAltText('Post image')).not.toBeInTheDocument();
    });

    it('renders LinkPreview when link object is provided', () => {
        const link = { url: 'https://example.com', title: 'Example' };
        render(<PostBody content="Test content" link={link} />);

        expect(screen.getByTestId('mock-link-preview')).toBeInTheDocument();
    });

    it('renders "View on map" button and navigates correctly when coordinates are provided', () => {
        render(<PostBody content="Test content" latitude={40.7128} longitude={-74.0060} />);

        const mapButton = screen.getByText('View on map');
        expect(mapButton).toBeInTheDocument();

        fireEvent.click(mapButton);
        expect(mockRouterPush).toHaveBeenCalledWith("/map?lat=40.7128&lng=-74.006");
    });

    it('renders counter display for non-owner', () => {
        // User profile id is 'user-123', so businessProfileId='other-user' makes this non-owner
        render(
            <PostBody
                content="Counter post"
                postType="counter"
                counterValue={42}
                counterLabel="Pushups"
                businessProfileId="other-user"
                postId="post-1"
            />
        );

        expect(screen.getByText('Pushups')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('Live Counter')).toBeInTheDocument();
        expect(screen.queryByTestId('mock-counter-controls')).not.toBeInTheDocument();
    });

    it('renders CounterControls for owner', () => {
        // User profile id is 'user-123', matching businessProfileId
        render(
            <PostBody
                content="Counter post"
                postType="counter"
                counterValue={42}
                counterLabel="Pushups"
                businessProfileId="user-123"
                postId="post-1"
            />
        );

        expect(screen.getByTestId('mock-counter-controls')).toBeInTheDocument();
        // The owner view also renders the liveCounterValue text-6xl directly as per component code
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders PollDisplay for poll post type', () => {
        const pollOptions = [{ id: 'opt1', text: 'Option 1', votes: 0 }];
        render(
            <PostBody
                content="Poll post"
                postType="poll"
                pollOptions={pollOptions}
                postId="post-1"
            />
        );

        expect(screen.getByTestId('mock-poll-display')).toBeInTheDocument();
    });
});
