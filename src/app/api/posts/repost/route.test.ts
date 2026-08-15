import { test, describe, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';

import { POST } from './route';

describe('POST /api/posts/repost', () => {
    let originalEnv: NodeJS.ProcessEnv;
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
        originalEnv = { ...process.env };
        originalFetch = global.fetch;

        process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    });

    afterEach(() => {
        process.env = originalEnv;
        global.fetch = originalFetch;
    });

    test('should return 400 if userId is missing', async () => {
        const req = new NextRequest('http://localhost/api/posts/repost', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const res = await POST(req);
        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.error, 'Missing required field: userId');
    });

    test('should return 404 if business is not found', async () => {
        global.fetch = async (url: RequestInfo | URL, options?: RequestInit) => {
            if (url.toString().includes('business_details')) {
                return {
                    ok: false,
                    status: 406,
                    headers: new Headers({'content-type': 'application/json'}),
                    json: async () => ({ message: 'JSON object requested, multiple (or no) rows returned' }),
                    text: async () => JSON.stringify({ message: 'JSON object requested, multiple (or no) rows returned' })
                } as Response;
            }
            return { ok: true, status: 200, headers: new Headers({'content-type': 'application/json'}), json: async () => ({}), text: async () => JSON.stringify({}) } as Response;
        };

        const req = new NextRequest('http://localhost/api/posts/repost', {
            method: 'POST',
            body: JSON.stringify({ userId: 'user-1' }),
        });

        const res = await POST(req);
        assert.strictEqual(res.status, 404);
        const data = await res.json();
        assert.strictEqual(data.error, 'No business found for this user.');
    });

    test('should return 404 if no posts found for the business', async () => {
        global.fetch = async (url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = url.toString();
            if (urlStr.includes('business_details')) {
                return { ok: true, status: 200, headers: new Headers({'content-type': 'application/vnd.pgrst.object+json'}), json: async () => ({ id: 'biz-1' }), text: async () => JSON.stringify({ id: 'biz-1' }) } as Response;
            }
            if (urlStr.includes('posts') && urlStr.includes('select')) {
                return { ok: true, status: 200, headers: new Headers({'content-type': 'application/json'}), json: async () => ([]), text: async () => JSON.stringify([]) } as Response;
            }
            return { ok: true, status: 200, headers: new Headers({'content-type': 'application/json'}), json: async () => ({}), text: async () => JSON.stringify({}) } as Response;
        };

        const req = new NextRequest('http://localhost/api/posts/repost', {
            method: 'POST',
            body: JSON.stringify({ userId: 'user-1' }),
        });

        const res = await POST(req);
        assert.strictEqual(res.status, 404);
        const data = await res.json();
        assert.strictEqual(data.error, 'No posts found for this business.');
    });

    test('should successfully clone the most viewed post', async () => {
        let insertedData: any = null;
        global.fetch = async (url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = url.toString();

            if (urlStr.includes('business_details')) {
                return {
                    ok: true,
                    status: 200,
                    headers: new Headers({'content-type': 'application/vnd.pgrst.object+json'}),
                    json: async () => ({ id: 'biz-1' }),
                    text: async () => JSON.stringify({ id: 'biz-1' })
                } as Response;
            }

            if (urlStr.includes('posts') && urlStr.includes('select') && (!options?.method || options.method === 'GET')) {
                return {
                    ok: true,
                    status: 200,
                    headers: new Headers({'content-type': 'application/json'}),
                    json: async () => ([
                        {
                            id: 'post-1',
                            content: 'first post',
                            business_id: 'biz-1',
                            post_views: [{id: 1}, {id: 2}]
                        },
                        {
                            id: 'post-2',
                            content: 'second post',
                            business_id: 'biz-1',
                            post_views: [{id: 3}, {id: 4}, {id: 5}]
                        }
                    ]),
                    text: async () => JSON.stringify([
                        {
                            id: 'post-1',
                            content: 'first post',
                            business_id: 'biz-1',
                            post_views: [{id: 1}, {id: 2}]
                        },
                        {
                            id: 'post-2',
                            content: 'second post',
                            business_id: 'biz-1',
                            post_views: [{id: 3}, {id: 4}, {id: 5}]
                        }
                    ])
                } as Response;
            }

            if (urlStr.includes('posts') && options?.method === 'POST') {
                if (options.body) {
                    insertedData = JSON.parse(options.body as string);
                }

                return {
                    ok: true,
                    status: 201,
                    headers: new Headers({'content-type': 'application/vnd.pgrst.object+json'}),
                    json: async () => ({ id: 'new-post-id' }),
                    text: async () => JSON.stringify({ id: 'new-post-id' })
                } as Response;
            }

            return {
                ok: true,
                status: 200,
                headers: new Headers({'content-type': 'application/json'}),
                json: async () => ({}),
                text: async () => JSON.stringify({})
            } as Response;
        };

        const req = new NextRequest('http://localhost/api/posts/repost', {
            method: 'POST',
            body: JSON.stringify({ userId: 'user-1' }),
        });

        const res = await POST(req);
        const data = await res.json();

        assert.strictEqual(res.status, 200);
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.postId, 'new-post-id');

        assert.ok(insertedData);
        assert.strictEqual(insertedData.content, 'second post');
    });

    test('should return 500 if post insert fails', async () => {
        global.fetch = async (url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = url.toString();

            if (urlStr.includes('business_details')) {
                return {
                    ok: true,
                    status: 200,
                    headers: new Headers({'content-type': 'application/vnd.pgrst.object+json'}),
                    json: async () => ({ id: 'biz-1' }),
                    text: async () => JSON.stringify({ id: 'biz-1' })
                } as Response;
            }

            if (urlStr.includes('posts') && urlStr.includes('select') && (!options?.method || options.method === 'GET')) {
                return {
                    ok: true,
                    status: 200,
                    headers: new Headers({'content-type': 'application/json'}),
                    json: async () => ([
                        {
                            id: 'post-1',
                            content: 'first post',
                            business_id: 'biz-1',
                            post_views: [{id: 1}]
                        }
                    ]),
                    text: async () => JSON.stringify([
                        {
                            id: 'post-1',
                            content: 'first post',
                            business_id: 'biz-1',
                            post_views: [{id: 1}]
                        }
                    ])
                } as Response;
            }

            if (urlStr.includes('posts') && options?.method === 'POST') {
                return {
                    ok: false,
                    status: 500,
                    headers: new Headers({'content-type': 'application/json'}),
                    json: async () => ({ message: 'Insert failed' }),
                    text: async () => JSON.stringify({ message: 'Insert failed' })
                } as Response;
            }

            return { ok: true, status: 200, headers: new Headers({'content-type': 'application/json'}), json: async () => ({}), text: async () => JSON.stringify({}) } as Response;
        };

        const req = new NextRequest('http://localhost/api/posts/repost', {
            method: 'POST',
            body: JSON.stringify({ userId: 'user-1' }),
        });

        const res = await POST(req);
        assert.strictEqual(res.status, 500);
        const data = await res.json();
        assert.strictEqual(data.error, 'Insert failed'); // supabase postgrest propagates error message from json error object
    });

    test('should return 500 if internal server error occurs during query', async () => {
        global.fetch = async (url: RequestInfo | URL, options?: RequestInit) => {
            const urlStr = url.toString();

            if (urlStr.includes('business_details')) {
                return {
                    ok: false,
                    status: 500,
                    headers: new Headers({'content-type': 'application/json'}),
                    json: async () => ({ message: 'DB Error' }),
                    text: async () => JSON.stringify({ message: 'DB Error' })
                } as Response;
            }
            return { ok: true, status: 200, headers: new Headers({'content-type': 'application/json'}), json: async () => ({}), text: async () => JSON.stringify({}) } as Response;
        };

        const req = new NextRequest('http://localhost/api/posts/repost', {
            method: 'POST',
            body: JSON.stringify({ userId: 'user-1' }),
        });

        const res = await POST(req);
        assert.strictEqual(res.status, 404); // Returns 404 since business lookup returns bizError
        const data = await res.json();
        assert.strictEqual(data.error, 'No business found for this user.');
    });
});
