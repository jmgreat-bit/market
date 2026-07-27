import { test, describe, mock, afterEach } from 'node:test';
import assert from 'node:assert';
import { momoClient } from './momo.ts';

describe('MomoClient', () => {
    afterEach(() => {
        mock.restoreAll();
    });

    test('requestToPay throws when API returns non-ok status', async () => {
        // Mock global fetch
        mock.method(global, 'fetch', async (url: string | URL | globalThis.Request) => {
            const urlString = url.toString();
            if (urlString.includes('/collection/token/')) {
                return new Response(JSON.stringify({ access_token: 'fake-token' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (urlString.includes('/collection/v1_0/requesttopay')) {
                return new Response('Internal Server Error', {
                    status: 500,
                });
            }

            return new Response('Not Found', { status: 404 });
        });

        // Ensure env variables are set so getToken won't warn, though it's handled
        process.env.MOMO_CONSUMER_KEY = 'test-key';
        process.env.MOMO_CONSUMER_SECRET = 'test-secret';

        // Call requestToPay and expect it to reject with our specific error message
        await assert.rejects(
            async () => {
                await momoClient.requestToPay(100, '0781234567', 'ref-123');
            },
            (err: Error) => {
                assert.strictEqual(err.message, 'MTN API Error: 500 - Internal Server Error');
                return true;
            }
        );
    });
});
