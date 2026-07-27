import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { MomoClient } from './momo.ts';

describe('MomoClient.getToken', () => {
    let originalEnv: NodeJS.ProcessEnv;
    let originalFetch: typeof global.fetch;
    let fetchCalls: { url: RequestInfo | URL; options?: RequestInit }[] = [];

    beforeEach(() => {
        // Save original environment and fetch
        originalEnv = { ...process.env };
        originalFetch = global.fetch;

        // Set up test environment variables
        process.env.MOMO_CONSUMER_KEY = 'test-key';
        process.env.MOMO_CONSUMER_SECRET = 'test-secret';
        process.env.MOMO_SUBSCRIPTION_KEY = 'test-sub-key';

        // Mock fetch
        fetchCalls = [];
        global.fetch = async (url: RequestInfo | URL, options?: RequestInit) => {
            fetchCalls.push({ url, options });

            // By default, return a successful response with a fake token
            return {
                ok: true,
                status: 200,
                json: async () => ({ access_token: 'fake-jwt-token' }),
                text: async () => 'Success'
            } as Response;
        };
    });

    afterEach(() => {
        // Restore environment and fetch
        process.env = originalEnv;
        global.fetch = originalFetch;
    });

    it('fetches a new token on first call', async () => {
        const client = new MomoClient();
        const token = await client.getToken();

        assert.strictEqual(token, 'fake-jwt-token');
        assert.strictEqual(fetchCalls.length, 1);

        const fetchCall = fetchCalls[0];
        assert.ok(fetchCall.url.toString().endsWith('/collection/token/'), `Expected URL to end with /collection/token/, but got ${fetchCall.url}`);
        assert.strictEqual(fetchCall.options?.method, 'POST');

        // Assert Authorization header
        const headers = fetchCall.options?.headers as Record<string, string>;
        const expectedCredentials = Buffer.from('test-key:test-secret').toString('base64');
        assert.strictEqual(headers['Authorization'], `Basic ${expectedCredentials}`);
        assert.strictEqual(headers['Ocp-Apim-Subscription-Key'], 'test-sub-key');
    });

    it('returns the cached token on subsequent calls before expiry', async () => {
        const client = new MomoClient();

        const token1 = await client.getToken();
        const token2 = await client.getToken();

        assert.strictEqual(token1, 'fake-jwt-token');
        assert.strictEqual(token2, 'fake-jwt-token');

        // Fetch should only have been called once
        assert.strictEqual(fetchCalls.length, 1);
    });

    it('fetches a new token if the cached token is expired', async () => {
        const client = new MomoClient();

        await client.getToken();
        assert.strictEqual(fetchCalls.length, 1);

        // Manually manipulate the internal tokenExpiry by overriding Date.now()
        // But an easier way since tokenExpiry is private is to mock Date.now() for the getToken call
        const originalDateNow = Date.now;

        try {
            // Fast forward time by 4000 seconds (expiry is set to 3500 seconds)
            Date.now = () => originalDateNow() + (4000 * 1000);

            await client.getToken();

            // Should fetch again
            assert.strictEqual(fetchCalls.length, 2);
        } finally {
            Date.now = originalDateNow;
        }
    });

    it('throws an error if the token request fails', async () => {
        const client = new MomoClient();

        // Override mock fetch to fail
        global.fetch = async () => {
            return {
                ok: false,
                status: 401,
                text: async () => 'Unauthorized access'
            } as Response;
        };

        await assert.rejects(
            async () => {
                await client.getToken();
            },
            (err: Error) => {
                assert.strictEqual(err.message, 'Failed to get MoMo Token: Unauthorized access');
                return true;
            }
        );
    });
});
