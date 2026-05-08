import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as ssr from '@supabase/ssr';

// Mock the createBrowserClient function from @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    // Mock return value, since it only checks if client is null or not
    isMockClient: true,
  })),
}));

// We need to import after mocking to ensure the mock is in place, and we also need to be able to reset the module to test the singleton properly
describe('Supabase Client Singleton', () => {
  beforeEach(() => {
    // Clear mock calls between tests
    vi.clearAllMocks();

    // We need to reset the modules so the `client` variable inside client.ts is reset to null
    vi.resetModules();
  });

  it('should return the same client instance on multiple calls', async () => {
    // Dynamically import the module so that the singleton is initialized fresh for this test
    const { getSupabaseClient } = await import('../client');
    const { createBrowserClient } = await import('@supabase/ssr');

    // First call should create a new client
    const client1 = getSupabaseClient();
    expect(createBrowserClient).toHaveBeenCalledTimes(1);

    // Second call should return the exact same client without calling createBrowserClient again
    const client2 = getSupabaseClient();
    expect(createBrowserClient).toHaveBeenCalledTimes(1); // Still 1

    // Check if they are the exact same instance
    expect(client1).toBe(client2);
  });
});
