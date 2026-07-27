import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { getSupabaseAdminClient } from './admin.ts';

describe('getSupabaseAdminClient', () => {
    let originalUrl: string | undefined;
    let originalKey: string | undefined;

    beforeEach(() => {
        originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    });

    afterEach(() => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
        process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    });

    test('throws error if NEXT_PUBLIC_SUPABASE_URL is missing', () => {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-key';

        assert.throws(
            () => getSupabaseAdminClient(),
            { message: 'Missing Supabase URL or Service Role Key in environment variables.' }
        );
    });

    test('throws error if SUPABASE_SERVICE_ROLE_KEY is missing', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;

        assert.throws(
            () => getSupabaseAdminClient(),
            { message: 'Missing Supabase URL or Service Role Key in environment variables.' }
        );
    });

    test('returns client when both environment variables are set', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-key';

        const client = getSupabaseAdminClient();
        assert.ok(client, 'Client should be returned');
    });
});
