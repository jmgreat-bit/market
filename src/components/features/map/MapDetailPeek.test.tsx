import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MapDetailPeek } from './MapDetailPeek';
import { useUser } from '@/hooks/useUser';
import { getSupabaseClient } from '@/lib/supabase/client';

// Mock Framer Motion
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, ...props }: any) => (
            <div className={className} data-testid="motion-div" {...props}>
                {children}
            </div>
        ),
    },
}));

// Mock hooks
jest.mock('@/hooks/useUser', () => ({
    useUser: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
    getSupabaseClient: jest.fn(),
}));

// Mock Lucide Icons to prevent missing SVGs
jest.mock('lucide-react', () => ({
    Navigation: () => <div data-testid="icon-navigation" />,
    Bookmark: () => <div data-testid="icon-bookmark" />,
    X: () => <div data-testid="icon-x" />,
}));

describe('MapDetailPeek', () => {
    const mockOnClose = jest.fn();
    const mockOnShowRoute = jest.fn();
    const mockInsert = jest.fn();
    const mockFrom = jest.fn();

    const defaultBusiness = {
        id: 'bus-123',
        business_name: 'Test Business',
        category: 'Coffee Shop',
        address: '123 Main St',
        latitude: 0,
        longitude: 0,
        user_id: 'owner-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Default useUser mock to unauthenticated
        (useUser as jest.Mock).mockReturnValue({ profile: null });

        // Default Supabase mock
        mockFrom.mockReturnValue({ insert: mockInsert });
        (getSupabaseClient as jest.Mock).mockReturnValue({
            from: mockFrom
        });

        // Mock console.error to keep tests clean
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        (console.error as jest.Mock).mockRestore();
    });

    it('returns null if business is null', () => {
        const { container } = render(
            <MapDetailPeek business={null} onClose={mockOnClose} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders business details correctly', () => {
        render(
            <MapDetailPeek business={defaultBusiness} onClose={mockOnClose} />
        );

        expect(screen.getByText('Test Business')).toBeInTheDocument();
        expect(screen.getByText('Coffee Shop')).toBeInTheDocument();
        expect(screen.getByText('123 Main St')).toBeInTheDocument();
    });

    it('renders "Active Pulse" if business category is missing', () => {
        const businessWithoutCategory = { ...defaultBusiness, category: '' };
        render(
            <MapDetailPeek business={businessWithoutCategory} onClose={mockOnClose} />
        );

        expect(screen.getByText('Active Pulse')).toBeInTheDocument();
    });

    it('calls onClose when the close button is clicked', () => {
        render(
            <MapDetailPeek business={defaultBusiness} onClose={mockOnClose} />
        );

        const closeButton = screen.getByTestId('icon-x').closest('button');
        fireEvent.click(closeButton!);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not render "Show Route" button if onShowRoute prop is not provided', () => {
        render(
            <MapDetailPeek business={defaultBusiness} onClose={mockOnClose} />
        );

        expect(screen.queryByText('Show Route')).not.toBeInTheDocument();
    });

    it('renders "Show Route" button and handles click correctly (without profile)', async () => {
        render(
            <MapDetailPeek business={defaultBusiness} onClose={mockOnClose} onShowRoute={mockOnShowRoute} />
        );

        const routeButton = screen.getByText('Show Route');
        fireEvent.click(routeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnShowRoute).toHaveBeenCalledTimes(1);
        expect(mockFrom).not.toHaveBeenCalled();
    });

    it('logs navigation event to Supabase if user profile exists when "Show Route" is clicked', async () => {
        // Setup authenticated user
        (useUser as jest.Mock).mockReturnValue({ profile: { id: 'user-123' } });
        mockInsert.mockResolvedValue({}); // Simulate successful insert

        render(
            <MapDetailPeek business={defaultBusiness} onClose={mockOnClose} onShowRoute={mockOnShowRoute} />
        );

        const routeButton = screen.getByText('Show Route');
        fireEvent.click(routeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnShowRoute).toHaveBeenCalledTimes(1);

        await waitFor(() => {
            expect(mockFrom).toHaveBeenCalledWith('store_navigations');
            expect(mockInsert).toHaveBeenCalledWith({
                business_id: 'bus-123',
                user_id: 'user-123',
            });
        });
    });

    it('fails silently if Supabase logging fails', async () => {
        // Setup authenticated user and failing insert
        (useUser as jest.Mock).mockReturnValue({ profile: { id: 'user-123' } });
        const testError = new Error('Database connection failed');
        mockInsert.mockRejectedValue(testError);

        render(
            <MapDetailPeek business={defaultBusiness} onClose={mockOnClose} onShowRoute={mockOnShowRoute} />
        );

        const routeButton = screen.getByText('Show Route');
        fireEvent.click(routeButton);

        // Verify that onClose and onShowRoute were still called despite the error
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnShowRoute).toHaveBeenCalledTimes(1);

        await waitFor(() => {
            expect(mockFrom).toHaveBeenCalledWith('store_navigations');
            expect(console.error).toHaveBeenCalledWith('Failed to log navigation:', testError);
        });
    });
});
