/**
 * @jest-environment node
 */
import { POST } from './route';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { momoClient } from '@/lib/momo';

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn()
}));

jest.mock('@/lib/supabase/admin', () => ({
    getSupabaseAdminClient: jest.fn()
}));

jest.mock('@/lib/momo', () => ({
    momoClient: {
        requestToPay: jest.fn()
    }
}));

// Mock crypto
const mockUUID = '1234-5678-9012-3456';
jest.mock('crypto', () => ({
    randomUUID: jest.fn(() => mockUUID)
}));

describe('POST /api/momo/pay', () => {
    let mockSupabase: any;
    let mockAdminClient: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockSupabase = {
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user123' } } })
            },
            from: jest.fn().mockReturnThis(),
            insert: jest.fn().mockResolvedValue({ error: null })
        };

        (createClient as jest.Mock).mockResolvedValue(mockSupabase);

        mockAdminClient = {
            from: jest.fn().mockReturnThis(),
            insert: jest.fn().mockResolvedValue({ error: null }),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
        };

        (getSupabaseAdminClient as jest.Mock).mockReturnValue(mockAdminClient);

        (momoClient.requestToPay as jest.Mock).mockResolvedValue(undefined);
    });

    it('returns 400 if required fields are missing', async () => {
        const req = new NextRequest('http://localhost:3000/api/momo/pay', {
            method: 'POST',
            body: JSON.stringify({ phone: '250781234567', amount: 1000 }), // missing tier
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data).toEqual({ error: 'Missing required fields' });
    });

    it('returns 401 if user is not authenticated', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

        const req = new NextRequest('http://localhost:3000/api/momo/pay', {
            method: 'POST',
            body: JSON.stringify({ phone: '250781234567', amount: 1000, tier: 'premium' }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(401);
        expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('returns 500 if database insert fails', async () => {
        mockSupabase.insert.mockResolvedValue({ error: new Error('DB error') });

        const req = new NextRequest('http://localhost:3000/api/momo/pay', {
            method: 'POST',
            body: JSON.stringify({ phone: '250781234567', amount: 1000, tier: 'premium' }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(500);
        expect(data).toEqual({ error: 'DB error' });
    });

    it('processes payment successfully and returns referenceId', async () => {
        const req = new NextRequest('http://localhost:3000/api/momo/pay', {
            method: 'POST',
            body: JSON.stringify({ phone: '250781234567', amount: 1000, tier: 'premium' }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data).toEqual({ success: true, referenceId: mockUUID });

        // Verify supabase client insertion
        expect(mockSupabase.from).toHaveBeenCalledWith('trader_subscriptions');
        expect(mockSupabase.insert).toHaveBeenCalledTimes(1);
        const insertArgs = mockSupabase.insert.mock.calls[0][0];
        expect(insertArgs).toMatchObject({
            id: mockUUID,
            profile_id: 'user123',
            tier: 'premium',
            amount_rwf: 1000,
            payment_method: 'momo',
            payment_status: 'pending',
        });

        // Verify MoMo requestToPay call
        expect(momoClient.requestToPay).toHaveBeenCalledTimes(1);
        expect(momoClient.requestToPay).toHaveBeenCalledWith(1000, '250781234567', mockUUID);
    });

    it('returns 500 if MoMo requestToPay throws an error', async () => {
        (momoClient.requestToPay as jest.Mock).mockRejectedValue(new Error('MoMo failed'));

        const req = new NextRequest('http://localhost:3000/api/momo/pay', {
            method: 'POST',
            body: JSON.stringify({ phone: '250781234567', amount: 1000, tier: 'premium' }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(500);
        expect(data).toEqual({ error: 'MoMo failed' });
    });
});
