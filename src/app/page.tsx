import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function HomePage() {
  // Redirect to map page as the main view
  redirect(ROUTES.MAP);
}
