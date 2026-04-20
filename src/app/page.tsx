import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function HomePage() {
    // Send to login — middleware will redirect to /feed if already authenticated
    redirect(ROUTES.LOGIN);
}
