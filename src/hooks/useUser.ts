'use client';

import { useUserContext } from '@/contexts/UserContext';

// Proxy the context so existing components importing useUser don't need to change imports
export function useUser() {
    return useUserContext();
}
