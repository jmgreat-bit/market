import { createClient } from './server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

jest.mock('next/headers', () => ({
    cookies: jest.fn(),
}));

jest.mock('@supabase/ssr', () => ({
    createServerClient: jest.fn(),
}));

describe('createClient', () => {
    let mockCookieStore;

    beforeEach(() => {
        jest.clearAllMocks();

        mockCookieStore = {
            getAll: jest.fn(),
            set: jest.fn(),
        };

        (cookies as jest.Mock).mockResolvedValue(mockCookieStore);

        process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    });

    it('should ignore errors when setting cookies from Server Component (error path)', async () => {
        let setAllCallback: any;

        (createServerClient as jest.Mock).mockImplementation((url, key, options) => {
            setAllCallback = options.cookies.setAll;
            return {}; // Mock client
        });

        await createClient();

        // Ensure createServerClient was called and we captured the setAll callback
        expect(createServerClient).toHaveBeenCalled();
        expect(setAllCallback).toBeDefined();

        // Setup the cookie store to throw an error
        mockCookieStore.set.mockImplementation(() => {
            throw new Error('Called from a Server Component');
        });

        const cookiesToSet = [
            { name: 'test-cookie', value: 'test-value', options: {} },
        ];

        // This should not throw because the try/catch swallows the error
        expect(() => {
            setAllCallback(cookiesToSet);
        }).not.toThrow();

        // Ensure set was actually called and thus threw the error internally
        expect(mockCookieStore.set).toHaveBeenCalledWith('test-cookie', 'test-value', {});
    });
});
