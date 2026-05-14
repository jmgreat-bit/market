import { test } from 'node:test';
import assert from 'node:assert';
import { getSupabaseClient } from './client.ts';

test('getSupabaseClient returns the same instance (singleton)', () => {
    // Set environment variables for createClient
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fake-anon-key';

    const client1 = getSupabaseClient();
    const client2 = getSupabaseClient();

    assert.strictEqual(client1, client2, 'The two client instances should be strictly equal');
    assert.ok(client1, 'Client instance should be truthy');
});
