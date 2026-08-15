import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { GET } from './route';

describe('Map Preview API Route', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        originalEnv = process.env;
        process.env = { ...originalEnv, NEXT_PUBLIC_MAPBOX_TOKEN: 'fake-token' };

        // Mock fetch globally
        mock.method(global, 'fetch', async () => ({
            ok: true,
            status: 200,
            arrayBuffer: async () => new ArrayBuffer(8),
            headers: new Headers({ 'Content-Type': 'image/png' })
        }));
    });

    afterEach(() => {
        process.env = originalEnv;
        mock.restoreAll();
    });

    it('should return 400 if lat or lng is missing', async () => {
        const reqLat = new NextRequest('http://localhost/api/map-preview?lat=45');
        const resLat = await GET(reqLat);
        assert.strictEqual(resLat.status, 400);

        const reqLng = new NextRequest('http://localhost/api/map-preview?lng=90');
        const resLng = await GET(reqLng);
        assert.strictEqual(resLng.status, 400);

        const reqNone = new NextRequest('http://localhost/api/map-preview');
        const resNone = await GET(reqNone);
        assert.strictEqual(resNone.status, 400);
    });

    it('should return 400 for invalid coordinate ranges', async () => {
        const reqLatHigh = new NextRequest('http://localhost/api/map-preview?lat=91&lng=90');
        const resLatHigh = await GET(reqLatHigh);
        assert.strictEqual(resLatHigh.status, 400);

        const reqLatLow = new NextRequest('http://localhost/api/map-preview?lat=-91&lng=90');
        const resLatLow = await GET(reqLatLow);
        assert.strictEqual(resLatLow.status, 400);

        const reqLngHigh = new NextRequest('http://localhost/api/map-preview?lat=45&lng=181');
        const resLngHigh = await GET(reqLngHigh);
        assert.strictEqual(resLngHigh.status, 400);

        const reqLngLow = new NextRequest('http://localhost/api/map-preview?lat=45&lng=-181');
        const resLngLow = await GET(reqLngLow);
        assert.strictEqual(resLngLow.status, 400);
    });

    it('should return 400 for non-numeric coordinates (SSRF prevention)', async () => {
        const reqInjection = new NextRequest('http://localhost/api/map-preview?lat=45&lng=90/../malicious');
        const resInjection = await GET(reqInjection);
        assert.strictEqual(resInjection.status, 400);

        const reqChars = new NextRequest('http://localhost/api/map-preview?lat=abc&lng=def');
        const resChars = await GET(reqChars);
        assert.strictEqual(resChars.status, 400);
    });

    it('should succeed for valid coordinates', async () => {
        const reqValid = new NextRequest('http://localhost/api/map-preview?lat=45.5&lng=-90.5');
        const resValid = await GET(reqValid);
        assert.strictEqual(resValid.status, 200);
    });

    it('should return 500 if mapbox token is not configured', async () => {
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN = '';
        const reqValid = new NextRequest('http://localhost/api/map-preview?lat=45.5&lng=-90.5');
        const resValid = await GET(reqValid);
        assert.strictEqual(resValid.status, 500);
    });
});
