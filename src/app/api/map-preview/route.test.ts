/**
 * @jest-environment node
 */
import { GET } from './route';
import { NextRequest } from 'next/server';

describe('GET map-preview', () => {
    let originalEnv: NodeJS.ProcessEnv;
    let globalFetch: typeof global.fetch;

    beforeEach(() => {
        originalEnv = { ...process.env };
        globalFetch = global.fetch;
    });

    afterEach(() => {
        process.env = originalEnv;
        global.fetch = globalFetch;
    });

    it('returns 400 if coordinates are missing', async () => {
        const req = new NextRequest('http://localhost/api/map-preview');
        const res = await GET(req);
        expect(res.status).toBe(400);
        expect(await res.text()).toBe('Missing coordinates');
    });

    it('returns 400 if only lat is provided', async () => {
        const req = new NextRequest('http://localhost/api/map-preview?lat=123');
        const res = await GET(req);
        expect(res.status).toBe(400);
    });

    it('returns 400 if only lng is provided', async () => {
        const req = new NextRequest('http://localhost/api/map-preview?lng=456');
        const res = await GET(req);
        expect(res.status).toBe(400);
    });

    it('returns 500 if mapbox token is not configured', async () => {
        delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        const req = new NextRequest('http://localhost/api/map-preview?lat=123&lng=456');
        const res = await GET(req);
        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Mapbox token not configured');
    });

    it('returns 500 if fetch to mapbox fails', async () => {
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'test-token';
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 403,
            headers: new Headers()
        });

        const req = new NextRequest('http://localhost/api/map-preview?lat=123&lng=456');
        const res = await GET(req);
        expect(res.status).toBe(403);
        expect(await res.text()).toBe('Failed to fetch map image');
    });

    it('returns 200 and image buffer on success', async () => {
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'test-token';
        const mockBuffer = new ArrayBuffer(8);
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers({
                'Content-Type': 'image/jpeg'
            }),
            arrayBuffer: jest.fn().mockResolvedValue(mockBuffer)
        });

        const req = new NextRequest('http://localhost/api/map-preview?lat=123&lng=456');
        const res = await GET(req);

        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toBe('image/jpeg');
        expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400, stale-while-revalidate=43200');
        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+8ff5ff(456,123)/456,123,14,0/400x160@2x?access_token=test-token'
        );
    });

    it('returns 500 on fetch throw', async () => {
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'test-token';
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

        const req = new NextRequest('http://localhost/api/map-preview?lat=123&lng=456');
        const res = await GET(req);

        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Internal Server Error');
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
