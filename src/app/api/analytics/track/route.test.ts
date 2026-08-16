import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock NextRequest and NextResponse
jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn((body, init) => ({
            status: init?.status || 200,
            json: async () => body
        }))
    }
}));

const mockInsert = jest.fn(() => Promise.resolve({ error: null }));
const mockFrom = jest.fn(() => ({ insert: mockInsert }));

jest.mock('@supabase/supabase-js', () => {
    return {
        createClient: jest.fn(() => ({
            from: mockFrom
        }))
    };
});

describe('Analytics Track POST Route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockInsert.mockImplementation(() => Promise.resolve({ error: null }));

        // Setup initial environment vars
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'dummy_key';
    });

    it('returns 400 for missing fields', async () => {
        const req = {
            json: async () => ({})
        } as unknown as NextRequest;

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe('Missing required fields: businessId and type are required.');
    });

    it('returns 400 for invalid type', async () => {
        const req = {
            json: async () => ({ businessId: 'b-123', type: 'invalid_type' })
        } as unknown as NextRequest;

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toMatch(/^Invalid type\. Must be one of:/);
    });

    it('successfully tracks profile view', async () => {
        const req = {
            json: async () => ({ businessId: 'b-123', type: 'view', viewerId: 'v-456' })
        } as unknown as NextRequest;

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);

        expect(mockFrom).toHaveBeenCalledWith('profile_views');
        expect(mockInsert).toHaveBeenCalledWith({
            business_id: 'b-123',
            viewer_id: 'v-456'
        });
    });

    it('successfully tracks contact clicks (whatsapp)', async () => {
        const req = {
            json: async () => ({ businessId: 'b-123', type: 'whatsapp', viewerId: 'v-456' })
        } as unknown as NextRequest;

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);

        expect(mockFrom).toHaveBeenCalledWith('contact_clicks');
        expect(mockInsert).toHaveBeenCalledWith({
            business_id: 'b-123',
            click_type: 'whatsapp',
            viewer_id: 'v-456'
        });
    });

    it('successfully tracks contact clicks with null viewerId', async () => {
        const req = {
            json: async () => ({ businessId: 'b-123', type: 'website' })
        } as unknown as NextRequest;

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);

        expect(mockInsert).toHaveBeenCalledWith({
            business_id: 'b-123',
            click_type: 'website',
            viewer_id: null
        });
    });

    it('returns 500 when profile_views insert fails', async () => {
        mockInsert.mockImplementationOnce(() => Promise.resolve({ error: { message: 'Database error' } }));

        const req = {
            json: async () => ({ businessId: 'b-123', type: 'view' })
        } as unknown as NextRequest;

        // Intercept console.error to avoid noise in test output
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe('Database error');

        consoleSpy.mockRestore();
    });

    it('returns 500 when contact_clicks insert fails', async () => {
        mockInsert.mockImplementationOnce(() => Promise.resolve({ error: { message: 'Database error' } }));

        const req = {
            json: async () => ({ businessId: 'b-123', type: 'phone' })
        } as unknown as NextRequest;

        // Intercept console.error to avoid noise in test output
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe('Database error');

        consoleSpy.mockRestore();
    });

    it('returns 500 on unexpected errors (e.g. invalid JSON)', async () => {
        const req = {
            json: async () => { throw new Error('Invalid JSON'); }
        } as unknown as NextRequest;

        // Intercept console.error to avoid noise in test output
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe('Internal server error');

        consoleSpy.mockRestore();
    });
});
