/** @jest-environment jsdom */
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { MomoPayModal } from './MomoPayModal';

// Mock global.fetch
global.fetch = jest.fn();

describe('MomoPayModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: jest.fn(),
        tier: 'premium',
        amount: 5000,
        onSuccess: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('renders nothing if isOpen is false', () => {
        const { container } = render(<MomoPayModal {...defaultProps} isOpen={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders initial input state correctly', () => {
        render(<MomoPayModal {...defaultProps} />);

        expect(screen.getByText('Mobile Money Payment')).toBeDefined();
        expect(screen.getByText('5,000 RWF for PREMIUM Tier')).toBeDefined();
        expect(screen.getByPlaceholderText('078...')).toBeDefined();
        expect(screen.getByRole('button', { name: 'Pay 5,000 RWF' })).toBeDefined();
    });

    it('displays error if phone number is invalid (length < 9)', async () => {
        render(<MomoPayModal {...defaultProps} />);

        const input = screen.getByPlaceholderText('078...');
        fireEvent.change(input, { target: { value: '12345678' } });

        const payButton = screen.getByRole('button', { name: 'Pay 5,000 RWF' });
        fireEvent.click(payButton);

        expect(screen.getByText('Payment Failed')).toBeDefined();
        expect(screen.getByText('Please enter a valid phone number')).toBeDefined();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('displays error when payment API fails to initiate', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Insufficient funds' }),
        });

        render(<MomoPayModal {...defaultProps} />);

        const input = screen.getByPlaceholderText('078...');
        fireEvent.change(input, { target: { value: '078123456' } });

        const payButton = screen.getByRole('button', { name: 'Pay 5,000 RWF' });
        fireEvent.click(payButton);

        expect(global.fetch).toHaveBeenCalledWith('/api/momo/pay', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ phone: '078123456', amount: 5000, tier: 'premium' }),
        }));

        await waitFor(() => {
            expect(screen.getByText('Payment Failed')).toBeDefined();
            expect(screen.getByText('Insufficient funds')).toBeDefined();
        });
    });

    it('successfully initiates payment, polls for status, and handles successful completion', async () => {
        // Mock /api/momo/pay response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ referenceId: 'ref-123' }),
        });

        render(<MomoPayModal {...defaultProps} />);

        const input = screen.getByPlaceholderText('078...');
        fireEvent.change(input, { target: { value: '078123456' } });

        const payButton = screen.getByRole('button', { name: 'Pay 5,000 RWF' });
        fireEvent.click(payButton);

        // Verify we reach 'waiting' state
        await waitFor(() => {
            expect(screen.getByText('Check your phone!')).toBeDefined();
        });

        // Mock first poll /api/momo/status response (pending)
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ status: 'pending' }),
        });

        await act(async () => {
            jest.advanceTimersByTime(3000);
        });

        // Still waiting
        expect(screen.getByText('Check your phone!')).toBeDefined();

        // Mock second poll /api/momo/status response (completed)
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ status: 'completed' }),
        });

        await act(async () => {
            jest.advanceTimersByTime(3000);
        });

        // Wait for state update after second poll
        await waitFor(() => {
            expect(screen.getByText('Payment Successful!')).toBeDefined();
        });

        // Advance timers for setTimeout delay (2000ms)
        await act(async () => {
            jest.advanceTimersByTime(2000);
        });

        expect(defaultProps.onSuccess).toHaveBeenCalled();
    });

    it('polls for status and handles payment failure', async () => {
        // Mock /api/momo/pay response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ referenceId: 'ref-123' }),
        });

        render(<MomoPayModal {...defaultProps} />);

        const input = screen.getByPlaceholderText('078...');
        fireEvent.change(input, { target: { value: '078123456' } });

        const payButton = screen.getByRole('button', { name: 'Pay 5,000 RWF' });
        fireEvent.click(payButton);

        await waitFor(() => {
            expect(screen.getByText('Check your phone!')).toBeDefined();
        });

        // Mock /api/momo/status response (failed)
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ status: 'failed' }),
        });

        await act(async () => {
            jest.advanceTimersByTime(3000);
        });

        await waitFor(() => {
            expect(screen.getByText('Payment Failed')).toBeDefined();
            expect(screen.getByText('Payment failed or was cancelled.')).toBeDefined();
        });
    });
});
