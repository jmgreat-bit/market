import { POST } from './route';
import { momoClient } from '@/lib/momo';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

jest.mock('@/lib/momo', () => ({
    momoClient: {
        getTransactionStatus: jest.fn()
    }
}));

const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockUpdate = jest.fn();
const mockInsert = jest.fn();
const mockSelect = jest.fn();

const mockFrom = jest.fn((table) => {
    if (table === 'trader_subscriptions') {
        return {
            select: mockSelect.mockReturnValue({
                eq: mockEq.mockReturnValue({
                    single: mockSingle
                })
            }),
            update: mockUpdate.mockReturnValue({
                eq: mockEq
            })
        };
    } else if (table === 'ai_credits') {
        return {
            insert: mockInsert
        };
    } else if (table === 'profiles') {
        return {
            update: mockUpdate.mockReturnValue({
                eq: mockEq
            })
        };
    }
});

jest.mock('@/lib/supabase/admin', () => ({
    getSupabaseAdminClient: () => ({
        from: mockFrom
    })
}));

jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn((data, options) => ({ data, options }))
    }
}));

describe('POST /api/momo/callback', () => {
    let mockReq: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockReq = {
            json: jest.fn().mockResolvedValue({ externalId: 'test-ref' }),
            url: 'http://localhost/api/momo/callback/test-ref'
        };

        console.log = jest.fn();
        console.error = jest.fn();
    });

    it('handles standard tier upgrade when status is SUCCESSFUL', async () => {
        (momoClient.getTransactionStatus as jest.Mock).mockResolvedValue('SUCCESSFUL');
        mockSingle.mockResolvedValue({
            data: {
                id: 'test-ref',
                profile_id: 'test-user',
                tier: 'premium',
                payment_status: 'pending'
            }
        });

        const res = await POST(mockReq);

        expect(momoClient.getTransactionStatus).toHaveBeenCalledWith('test-ref');
        expect(mockUpdate).toHaveBeenCalledWith({ payment_status: 'completed' });
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ trader_tier: 'premium', is_premium: true }));
        expect(mockInsert).not.toHaveBeenCalled();

        expect(res).toEqual({ data: { success: true }, options: undefined });
    });

    it('handles ai_starter tier and grants 7 AI credits', async () => {
        (momoClient.getTransactionStatus as jest.Mock).mockResolvedValue('SUCCESSFUL');
        mockSingle.mockResolvedValue({
            data: {
                id: 'test-ref',
                profile_id: 'test-user',
                tier: 'ai_starter',
                payment_status: 'pending'
            }
        });

        const res = await POST(mockReq);

        expect(mockUpdate).toHaveBeenCalledWith({ payment_status: 'completed' });
        expect(mockInsert).toHaveBeenCalledWith({
            user_id: 'test-user',
            total_credits: 7,
            used_credits: 0,
            package: 'starter'
        });

        expect(res).toEqual({ data: { success: true }, options: undefined });
    });

    it('handles ai_standard tier and grants 20 AI credits', async () => {
        (momoClient.getTransactionStatus as jest.Mock).mockResolvedValue('SUCCESSFUL');
        mockSingle.mockResolvedValue({
            data: {
                id: 'test-ref',
                profile_id: 'test-user',
                tier: 'ai_standard',
                payment_status: 'pending'
            }
        });

        const res = await POST(mockReq);

        expect(mockUpdate).toHaveBeenCalledWith({ payment_status: 'completed' });
        expect(mockInsert).toHaveBeenCalledWith({
            user_id: 'test-user',
            total_credits: 20,
            used_credits: 0,
            package: 'standard'
        });

        expect(res).toEqual({ data: { success: true }, options: undefined });
    });

    it('handles ai_power tier and grants 100 AI credits', async () => {
        (momoClient.getTransactionStatus as jest.Mock).mockResolvedValue('SUCCESSFUL');
        mockSingle.mockResolvedValue({
            data: {
                id: 'test-ref',
                profile_id: 'test-user',
                tier: 'ai_power',
                payment_status: 'pending'
            }
        });

        const res = await POST(mockReq);

        expect(mockUpdate).toHaveBeenCalledWith({ payment_status: 'completed' });
        expect(mockInsert).toHaveBeenCalledWith({
            user_id: 'test-user',
            total_credits: 100,
            used_credits: 0,
            package: 'power'
        });

        expect(res).toEqual({ data: { success: true }, options: undefined });
    });

    it('uses URL path as referenceId if externalId is missing from payload', async () => {
        mockReq.json.mockResolvedValue({});
        mockReq.url = 'http://localhost/api/momo/callback/url-ref-123';
        (momoClient.getTransactionStatus as jest.Mock).mockResolvedValue('FAILED');

        await POST(mockReq);

        expect(momoClient.getTransactionStatus).toHaveBeenCalledWith('url-ref-123');
    });

    it('does not update database if status is FAILED', async () => {
        (momoClient.getTransactionStatus as jest.Mock).mockResolvedValue('FAILED');

        const res = await POST(mockReq);

        expect(momoClient.getTransactionStatus).toHaveBeenCalledWith('test-ref');
        expect(mockFrom).not.toHaveBeenCalled();
        expect(mockUpdate).not.toHaveBeenCalled();
        expect(mockInsert).not.toHaveBeenCalled();

        expect(res).toEqual({ data: { success: true }, options: undefined });
    });

    it('does not update database if momoClient throws an error', async () => {
        (momoClient.getTransactionStatus as jest.Mock).mockRejectedValue(new Error('Network error'));

        const res = await POST(mockReq);

        expect(console.error).toHaveBeenCalledWith(
            '[MOMO WEBHOOK] Failed to verify status for test-ref',
            expect.any(Error)
        );
        expect(mockFrom).not.toHaveBeenCalled();

        expect(res).toEqual({ data: { success: true }, options: undefined });
    });

    it('does not grant credits or upgrade if subscription payment_status is not pending', async () => {
        (momoClient.getTransactionStatus as jest.Mock).mockResolvedValue('SUCCESSFUL');
        mockSingle.mockResolvedValue({
            data: {
                id: 'test-ref',
                profile_id: 'test-user',
                tier: 'premium',
                payment_status: 'completed' // Already completed
            }
        });

        const res = await POST(mockReq);

        // It queries the subscription table
        expect(mockFrom).toHaveBeenCalledWith('trader_subscriptions');
        // But it does not proceed to update anything
        expect(mockUpdate).not.toHaveBeenCalled();
        expect(mockInsert).not.toHaveBeenCalled();

        expect(res).toEqual({ data: { success: true }, options: undefined });
    });

    it('does not grant credits or upgrade if subscription is not found', async () => {
        (momoClient.getTransactionStatus as jest.Mock).mockResolvedValue('SUCCESSFUL');
        mockSingle.mockResolvedValue({ data: null }); // No subscription found

        const res = await POST(mockReq);

        expect(mockUpdate).not.toHaveBeenCalled();

        expect(res).toEqual({ data: { success: true }, options: undefined });
    });

    it('returns 500 error if request parsing fails', async () => {
        mockReq.json.mockRejectedValue(new Error('Invalid JSON'));

        const res = await POST(mockReq);

        expect(console.error).toHaveBeenCalledWith('MoMo Callback Error:', expect.any(Error));
        expect(res).toEqual({
            data: { error: 'Invalid JSON' },
            options: { status: 500 }
        });
    });
});
