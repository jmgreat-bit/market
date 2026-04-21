import { redirect } from 'next/navigation';

export default function HomePage() {
    // Middleware handles auth check:
    // - If logged in → /feed stays as /feed
    // - If not logged in → middleware catches /feed and sends to /auth/login
    redirect('/feed');
}
