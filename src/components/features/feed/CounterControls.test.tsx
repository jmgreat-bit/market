/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CounterControls } from './CounterControls';
import { getSupabaseClient } from '@/lib/supabase/client';
import { COUNTER_UPDATE_COOLDOWN_MS } from '@/lib/constants';

// Proper mock for Supabase chainable query builder API
jest.mock('@/lib/supabase/client', () => {
    const mockEq = jest.fn();
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = jest.fn().mockReturnValue({ update: mockUpdate });

    return {
        getSupabaseClient: jest.fn(() => ({
            from: mockFrom
        }))
    };
});

// Mock Lucide icons
jest.mock('lucide-react', () => ({
    Plus: () => <div data-testid="plus-icon" />,
    Minus: () => <div data-testid="minus-icon" />,
    Loader2: () => <div data-testid="loader-icon" />
}));

describe('CounterControls', () => {
    const mockOnUpdate = jest.fn();
    const defaultProps = {
        postId: 'post-123',
        currentValue: 5,
        label: 'Likes',
        onUpdate: mockOnUpdate
    };

    let originalAlert: typeof window.alert;
    let originalConsoleError: typeof console.error;
    let originalDateNow: typeof Date.now;

    beforeAll(() => {
        originalAlert = window.alert;
        originalConsoleError = console.error;
        originalDateNow = Date.now;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        window.alert = jest.fn();
        console.error = jest.fn();

        // Mock Date.now to return a stable time for cooldown logic
        Date.now = jest.fn(() => 100000000);
    });

    afterAll(() => {
        window.alert = originalAlert;
        console.error = originalConsoleError;
        Date.now = originalDateNow;
    });

    const getSupabaseMocks = () => {
        const supabase = getSupabaseClient();
        const mockFrom = supabase.from as jest.Mock;
        const mockUpdate = mockFrom().update as jest.Mock;
        const mockEq = mockUpdate().eq as jest.Mock;
        return { mockFrom, mockUpdate, mockEq };
    };

    it('renders the buttons correctly', () => {
        render(<CounterControls {...defaultProps} />);

        const minusBtn = screen.getByTestId('minus-icon').parentElement;
        const plusBtn = screen.getByTestId('plus-icon').parentElement;

        expect(minusBtn).toBeInTheDocument();
        expect(plusBtn).toBeInTheDocument();
        expect(minusBtn).not.toBeDisabled();
        expect(plusBtn).not.toBeDisabled();
    });

    it('disables the minus button when currentValue is 0', () => {
        render(<CounterControls {...defaultProps} currentValue={0} />);

        const minusBtn = screen.getByTestId('minus-icon').parentElement;
        expect(minusBtn).toBeDisabled();
    });

    it('updates counter correctly on plus button click (+1)', async () => {
        const { mockFrom, mockUpdate, mockEq } = getSupabaseMocks();
        mockEq.mockResolvedValueOnce({ error: null });

        render(<CounterControls {...defaultProps} />);
        const plusBtn = screen.getByTestId('plus-icon').parentElement!;

        fireEvent.click(plusBtn);

        await waitFor(() => {
            expect(mockFrom).toHaveBeenCalledWith('posts');
            expect(mockUpdate).toHaveBeenCalledWith({ counter_value: 6 });
            expect(mockEq).toHaveBeenCalledWith('id', 'post-123');
            expect(mockOnUpdate).toHaveBeenCalledWith(6);
        });
    });

    it('updates counter correctly on minus button click (-1)', async () => {
        const { mockFrom, mockUpdate, mockEq } = getSupabaseMocks();
        mockEq.mockResolvedValueOnce({ error: null });

        render(<CounterControls {...defaultProps} />);
        const minusBtn = screen.getByTestId('minus-icon').parentElement!;

        fireEvent.click(minusBtn);

        await waitFor(() => {
            expect(mockFrom).toHaveBeenCalledWith('posts');
            expect(mockUpdate).toHaveBeenCalledWith({ counter_value: 4 });
            expect(mockEq).toHaveBeenCalledWith('id', 'post-123');
            expect(mockOnUpdate).toHaveBeenCalledWith(4);
        });
    });

    it('prevents update and shows alert if clicked before cooldown finishes', async () => {
        const { mockEq } = getSupabaseMocks();
        mockEq.mockResolvedValue({ error: null });

        let currentTime = 100000000;
        Date.now = jest.fn(() => currentTime);

        render(<CounterControls {...defaultProps} />);
        const plusBtn = screen.getByTestId('plus-icon').parentElement!;

        // First click (should succeed)
        fireEvent.click(plusBtn);
        await waitFor(() => expect(mockOnUpdate).toHaveBeenCalledTimes(1));

        // Move time forward slightly, but not enough to pass cooldown
        currentTime += (COUNTER_UPDATE_COOLDOWN_MS / 2);

        // Second click (should be blocked by cooldown)
        fireEvent.click(plusBtn);

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalled();
            expect(mockOnUpdate).toHaveBeenCalledTimes(1); // Should still be 1
        });

        const expectedRemainingMinutes = Math.ceil((COUNTER_UPDATE_COOLDOWN_MS - (COUNTER_UPDATE_COOLDOWN_MS / 2)) / 60000);
        expect(window.alert).toHaveBeenCalledWith(
            `Please wait ${expectedRemainingMinutes} minute${expectedRemainingMinutes > 1 ? 's' : ''} before updating again.`
        );
    });

    it('allows update after cooldown finishes', async () => {
        const { mockEq } = getSupabaseMocks();
        mockEq.mockResolvedValue({ error: null });

        let currentTime = 100000000;
        Date.now = jest.fn(() => currentTime);

        const { rerender } = render(<CounterControls {...defaultProps} />);
        const plusBtn = screen.getByTestId('plus-icon').parentElement!;

        // First click
        fireEvent.click(plusBtn);
        await waitFor(() => expect(mockOnUpdate).toHaveBeenCalledWith(6));

        // Move time forward past cooldown
        currentTime += COUNTER_UPDATE_COOLDOWN_MS + 1000;

        // We need to pass the updated currentValue that would come back from the parent
        rerender(<CounterControls {...defaultProps} currentValue={6} />);

        // Second click (should succeed)
        fireEvent.click(plusBtn);

        await waitFor(() => {
            expect(mockOnUpdate).toHaveBeenCalledWith(7);
            expect(window.alert).not.toHaveBeenCalled();
        });
    });

    it('handles Supabase update error', async () => {
        const { mockEq } = getSupabaseMocks();
        const mockError = new Error('Supabase error');
        mockEq.mockResolvedValueOnce({ error: mockError });

        render(<CounterControls {...defaultProps} />);
        const plusBtn = screen.getByTestId('plus-icon').parentElement!;

        fireEvent.click(plusBtn);

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith('Counter update failed:', mockError);
            expect(window.alert).toHaveBeenCalledWith('Failed to update counter. Please try again.');
            expect(mockOnUpdate).not.toHaveBeenCalled(); // Ensure onUpdate is not called on error
        });
    });
});
