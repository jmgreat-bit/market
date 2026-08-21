import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactButtons from './ContactButtons';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useConversations } from '@/hooks/useConversations';

// Mock the hooks
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/hooks/useUser', () => ({
    useUser: jest.fn(),
}));

jest.mock('@/hooks/useConversations', () => ({
    useConversations: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

// Mock global alert
global.alert = jest.fn();

describe('ContactButtons', () => {
    const mockRouterPush = jest.fn();
    const mockGetOrCreateConversation = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        (useRouter as jest.Mock).mockReturnValue({
            push: mockRouterPush,
        });

        (useUser as jest.Mock).mockReturnValue({
            user: { id: 'viewer-123' },
            isAuthenticated: true,
        });

        (useConversations as jest.Mock).mockReturnValue({
            getOrCreateConversation: mockGetOrCreateConversation,
        });

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({}),
        });
    });

    const defaultProps = {
        businessId: 'biz-123',
        viewerId: 'viewer-123',
    };

    it('renders nothing when no optional props are provided', () => {
        const { container } = render(<ContactButtons {...defaultProps} />);
        expect(container.firstChild).toBeEmptyDOMElement();
    });

    it('renders Message button when targetProfileId is provided and not owner', () => {
        render(<ContactButtons {...defaultProps} targetProfileId="target-456" />);
        expect(screen.getByText('Message')).toBeInTheDocument();
    });

    it('does not render Message button when user is the owner', () => {
        (useUser as jest.Mock).mockReturnValue({
            user: { id: 'target-456' },
            isAuthenticated: true,
        });
        render(<ContactButtons {...defaultProps} targetProfileId="target-456" />);
        expect(screen.queryByText('Message')).not.toBeInTheDocument();
    });

    it('renders WhatsApp and Call buttons when phone is provided', () => {
        render(<ContactButtons {...defaultProps} phone="+1234567890" />);
        expect(screen.getByText('WhatsApp')).toBeInTheDocument();
        expect(screen.getByText('WhatsApp').closest('a')).toHaveAttribute('href', 'https://wa.me/1234567890');
        expect(screen.getByText('Call')).toBeInTheDocument();
        expect(screen.getByText('Call').closest('a')).toHaveAttribute('href', 'tel:+1234567890');
    });

    it('renders Website button when websiteUrl is provided', () => {
        render(<ContactButtons {...defaultProps} websiteUrl="https://example.com" />);
        expect(screen.getByText('Website')).toBeInTheDocument();
        expect(screen.getByText('Website').closest('a')).toHaveAttribute('href', 'https://example.com');
    });

    it('redirects to login when clicking Message and not authenticated', () => {
        (useUser as jest.Mock).mockReturnValue({
            user: null,
            isAuthenticated: false,
        });
        render(<ContactButtons {...defaultProps} targetProfileId="target-456" />);

        fireEvent.click(screen.getByText('Message'));
        expect(mockRouterPush).toHaveBeenCalledWith('/auth/login');
    });

    it('handles successful in-app message flow', async () => {
        mockGetOrCreateConversation.mockResolvedValue('conv-789');
        render(<ContactButtons {...defaultProps} targetProfileId="target-456" />);

        fireEvent.click(screen.getByText('Message'));

        // Should track click
        expect(global.fetch).toHaveBeenCalledWith('/api/analytics/track', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ businessId: 'biz-123', type: 'message', viewerId: 'viewer-123' })
        }));

        // Should call hook
        expect(mockGetOrCreateConversation).toHaveBeenCalledWith('target-456', 'biz-123');

        // Should redirect
        await waitFor(() => {
            expect(mockRouterPush).toHaveBeenCalledWith('/inbox/conv-789');
        });
    });

    it('handles failed in-app message flow with alert', async () => {
        mockGetOrCreateConversation.mockRejectedValue(new Error('Test error'));
        render(<ContactButtons {...defaultProps} targetProfileId="target-456" />);

        // Suppress console.error for this test to keep output clean
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        fireEvent.click(screen.getByText('Message'));

        await waitFor(() => {
            expect(global.alert).toHaveBeenCalledWith('Test error');
        });

        consoleSpy.mockRestore();
    });

    it('tracks clicks on WhatsApp, Phone, and Website links', () => {
        render(
            <ContactButtons
                {...defaultProps}
                phone="+1234567890"
                websiteUrl="https://example.com"
            />
        );

        fireEvent.click(screen.getByText('WhatsApp'));
        expect(global.fetch).toHaveBeenCalledWith('/api/analytics/track', expect.objectContaining({
            body: expect.stringContaining('"type":"whatsapp"')
        }));

        fireEvent.click(screen.getByText('Call'));
        expect(global.fetch).toHaveBeenCalledWith('/api/analytics/track', expect.objectContaining({
            body: expect.stringContaining('"type":"phone"')
        }));

        fireEvent.click(screen.getByText('Website'));
        expect(global.fetch).toHaveBeenCalledWith('/api/analytics/track', expect.objectContaining({
            body: expect.stringContaining('"type":"website"')
        }));
    });
});
