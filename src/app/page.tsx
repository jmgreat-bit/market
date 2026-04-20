import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function HomePage() {
  // Redirect to feed page as the main view
  redirect(ROUTES.FEED);
}
