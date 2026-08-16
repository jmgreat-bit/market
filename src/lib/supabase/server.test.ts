import { createClient } from './server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

jest.mock('next/headers', () => ({
    cookies: jest.fn(),
}));

jest.mock('@supabase/ssr', () => ({
    createServerClient: jest.fn(),
}));

describe('Supabase Server Client', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = {
            ...originalEnv,
            NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        };
        jest.clearAllMocks();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    test('createClient initializes with correct environment variables and handlers', async () => {
        (createServerClient as jest.Mock).mockImplementation((url, key, options) => {
            return { url, key, options };
        });

        const mockGetAll = jest.fn();
        const mockSet = jest.fn();
        (cookies as jest.Mock).mockResolvedValue({
            getAll: mockGetAll,
            set: mockSet,
        });

        const client = await createClient() as unknown as Record<string, unknown>;

        expect(client.url).toBe('https://test.supabase.co');
        expect(client.key).toBe('test-anon-key');
        expect((client.options as Record<string, Record<string, unknown>>).cookies.getAll).toBeDefined();
        expect((client.options as Record<string, Record<string, unknown>>).cookies.setAll).toBeDefined();
    });

    test('cookies.getAll calls cookieStore.getAll', async () => {
        const expectedCookies = [{ name: 'test', value: 'value' }];
        const mockGetAll = jest.fn().mockReturnValue(expectedCookies);
        const mockSet = jest.fn();

        (cookies as jest.Mock).mockResolvedValue({
            getAll: mockGetAll,
            set: mockSet,
        });

        (createServerClient as jest.Mock).mockImplementation((url, key, options) => options);
        const options = await createClient() as unknown as Record<string, Record<string, () => unknown>>;

        const result = options.cookies.getAll();

        expect(mockGetAll).toHaveBeenCalledTimes(1);
        expect(result).toEqual(expectedCookies);
    });

    test('cookies.setAll calls cookieStore.set for each cookie', async () => {
        const mockGetAll = jest.fn();
        const mockSet = jest.fn();

        (cookies as jest.Mock).mockResolvedValue({
            getAll: mockGetAll,
            set: mockSet,
        });

        (createServerClient as jest.Mock).mockImplementation((url, key, options) => options);
        const options = await createClient() as unknown as Record<string, Record<string, (cookies: unknown[]) => void>>;

        const cookiesToSet = [
            { name: 'test1', value: 'value1', options: { path: '/' } },
            { name: 'test2', value: 'value2', options: { path: '/api' } },
        ];

        options.cookies.setAll(cookiesToSet);

        expect(mockSet).toHaveBeenCalledTimes(2);
        expect(mockSet).toHaveBeenNthCalledWith(1, 'test1', 'value1', { path: '/' });
        expect(mockSet).toHaveBeenNthCalledWith(2, 'test2', 'value2', { path: '/api' });
    });

    test('cookies.setAll ignores errors thrown by cookieStore.set', async () => {
        const mockGetAll = jest.fn();
        const mockSet = jest.fn().mockImplementation(() => {
            throw new Error('Cookies can only be modified in a Server Action or Route Handler.');
        });

        (cookies as jest.Mock).mockResolvedValue({
            getAll: mockGetAll,
            set: mockSet,
        });

        (createServerClient as jest.Mock).mockImplementation((url, key, options) => options);
        const options = await createClient() as unknown as Record<string, Record<string, (cookies: unknown[]) => void>>;

        const cookiesToSet = [
            { name: 'test1', value: 'value1', options: { path: '/' } },
        ];

        // This should not throw because of the try/catch in setAll
        expect(() => {
            options.cookies.setAll(cookiesToSet);
        }).not.toThrow();

        // Ensure set was actually called and threw
        expect(mockSet).toHaveBeenCalledTimes(1);
    });
});
