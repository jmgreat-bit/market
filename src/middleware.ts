import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that require a logged-in user
const PROTECTED_ROUTES = [
    '/feed',
    '/map',
    '/explore',
    '/search',
    '/menu',
    '/alerts',
    '/analytics',
    '/vouchers',
    '/profile',
    '/compose',
    '/saved',
];

// Routes only accessible to guests (redirect to /feed if already logged in)
const GUEST_ONLY_ROUTES = ['/auth/login', '/auth/signup'];

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Always call getUser() here to refresh the session cookie.
    // Do NOT call any other supabase methods between createServerClient and getUser().
    const { data: { user } } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Check if the route requires authentication
    const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

    // If not logged in and trying to access a protected route → redirect to login
    // Pass ?next= so login can redirect back to the intended destination
    if (!user && isProtected) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/auth/login';
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If logged in and hitting a guest-only route → redirect to feed
    const isGuestOnly = GUEST_ONLY_ROUTES.some((route) => pathname.startsWith(route));
    if (user && isGuestOnly) {
        const feedUrl = request.nextUrl.clone();
        feedUrl.pathname = '/feed';
        return NextResponse.redirect(feedUrl);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
