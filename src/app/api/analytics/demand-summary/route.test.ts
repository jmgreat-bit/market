import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Define fetch globally before ANY imports that might trigger supabase client code.
global.fetch = jest.fn() as any;

const mockJson = jest.fn((body: any, init?: any) => {
    return {
        body,
        status: init?.status ?? 200,
        ...init
    };
});

jest.mock('next/server', () => {
  return {
    NextRequest: class NextRequest {
      url: string;
      constructor(url: string) {
        this.url = url;
      }
    },
    NextResponse: {
      json: mockJson
    }
  };
});

let rpcMock = jest.fn();
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      rpc: rpcMock
    })
  };
});

describe('GET demand-summary', () => {
    const originalEnv = process.env;
    let GET: any;

    beforeEach(async () => {
        jest.resetModules();
        jest.clearAllMocks();
        rpcMock.mockReset();
        process.env = { ...originalEnv };
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'secret';

        // Dynamically import GET so that the route module is re-evaluated
        // with the fresh mock functions after jest.resetModules()
        GET = (await import('./route')).GET;
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('returns 400 when missing userId', async () => {
        const { NextRequest } = require('next/server');
        const req = new NextRequest('http://localhost/api?other=123');
        const res = await GET(req as any);
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Missing required query parameter: userId' });
    });

    it('returns 200 and data when userId is provided and rpc is successful', async () => {
        const { NextRequest } = require('next/server');
        const req = new NextRequest('http://localhost/api?userId=user-123');

        const mockData = { demand: 'high' };
        rpcMock.mockResolvedValueOnce({ data: mockData, error: null });

        const res = await GET(req as any);
        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockData);
        expect(rpcMock).toHaveBeenCalledWith('get_demand_summary', { trader_user_id: 'user-123' });
    });

    it('returns 500 when rpc returns an error', async () => {
        const { NextRequest } = require('next/server');
        const req = new NextRequest('http://localhost/api?userId=user-123');

        rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });

        // Suppress console.error for this test
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const res = await GET(req as any);
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'Database error' });

        consoleSpy.mockRestore();
    });

    it('returns 500 when an unexpected error occurs', async () => {
        const { NextRequest } = require('next/server');
        const req = new NextRequest('http://localhost/api?userId=user-123');

        rpcMock.mockRejectedValueOnce(new Error('Network error'));

        // Suppress console.error for this test
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const res = await GET(req as any);
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'Internal server error' });

        consoleSpy.mockRestore();
    });
});
