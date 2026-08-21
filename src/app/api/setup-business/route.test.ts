/** @jest-environment node */
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock the modules using jest.mock
jest.mock('@/lib/supabase/server', () => {
    const mockSupabase = {
        auth: {
            getUser: jest.fn().mockResolvedValue({
                data: { user: { id: 'user-1' } },
                error: null,
            }),
        },
    };
    return {
        createClient: jest.fn().mockResolvedValue(mockSupabase),
    };
});

jest.mock('@/lib/supabase/admin', () => {
    const mockAdminClient = {
        from: jest.fn().mockReturnValue({
            upsert: jest.fn().mockResolvedValue({ error: null }),
        }),
    };
    return {
        getSupabaseAdminClient: jest.fn().mockReturnValue(mockAdminClient),
    };
});

describe('POST /api/setup-business', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 400 if coordinates are not provided', async () => {
        const req = new NextRequest('http://localhost/api/setup-business', {
            method: 'POST',
            body: JSON.stringify({
                business_name: 'Test Business',
                category: 'Retail',
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe('Location coordinates are required');
    });

    it('should return 400 if latitude is out of bounds (too high)', async () => {
        const req = new NextRequest('http://localhost/api/setup-business', {
            method: 'POST',
            body: JSON.stringify({
                business_name: 'Test Business',
                latitude: 91,
                longitude: 0,
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe('Invalid location coordinates');
    });

    it('should return 400 if latitude is out of bounds (too low)', async () => {
        const req = new NextRequest('http://localhost/api/setup-business', {
            method: 'POST',
            body: JSON.stringify({
                business_name: 'Test Business',
                latitude: -91,
                longitude: 0,
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe('Invalid location coordinates');
    });

    it('should return 400 if longitude is out of bounds (too high)', async () => {
        const req = new NextRequest('http://localhost/api/setup-business', {
            method: 'POST',
            body: JSON.stringify({
                business_name: 'Test Business',
                latitude: 0,
                longitude: 181,
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe('Invalid location coordinates');
    });

    it('should return 400 if longitude is out of bounds (too low)', async () => {
        const req = new NextRequest('http://localhost/api/setup-business', {
            method: 'POST',
            body: JSON.stringify({
                business_name: 'Test Business',
                latitude: 0,
                longitude: -181,
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe('Invalid location coordinates');
    });

    it('should return 400 if coordinates are non-numeric strings', async () => {
        const req = new NextRequest('http://localhost/api/setup-business', {
            method: 'POST',
            body: JSON.stringify({
                business_name: 'Test Business',
                latitude: 'invalid',
                longitude: 'invalid',
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toBe('Invalid location coordinates');
    });

    it('should succeed with valid coordinates', async () => {
        const req = new NextRequest('http://localhost/api/setup-business', {
            method: 'POST',
            body: JSON.stringify({
                business_name: 'Test Business',
                latitude: 45.5,
                longitude: -122.6,
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
    });
});