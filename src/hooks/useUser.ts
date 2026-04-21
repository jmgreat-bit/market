'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    profile: Profile | null;
    // undefined means "we don't know yet" (prevents flicker before first check)
    isLoading: boolean;
    isAuthenticated: boolean;
}

export function useUser() {
    const [state, setState] = useState<AuthState>({
        user: null,
        profile: null,
        isLoading: true,
        isAuthenticated: false,
    });

    const fetchProfile = useCallback(async (userId: string) => {
        const supabase = getSupabaseClient();
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        return data as Profile | null;
    }, []);

    useEffect(() => {
        const supabase = getSupabaseClient();

        // Use getUser() (server-verified) not getSession() (client-only, unverified)
        supabase.auth.getUser().then(async ({ data }: { data: { user: User | null } }) => {
            const user = data.user;
            if (user) {
                const profile = await fetchProfile(user.id);
                setState({
                    user,
                    profile,
                    isLoading: false,
                    isAuthenticated: true,
                });
            } else {
                setState({
                    user: null,
                    profile: null,
                    isLoading: false,
                    isAuthenticated: false,
                });
            }
        }).catch(() => {
            setState({
                user: null,
                profile: null,
                isLoading: false,
                isAuthenticated: false,
            });
        });

        // Keep session fresh — listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                if (session?.user) {
                    // Only re-fetch profile on actual sign-in / token refresh events
                    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                        const profile = await fetchProfile(session.user.id);
                        setState({
                            user: session.user,
                            profile,
                            isLoading: false,
                            isAuthenticated: true,
                        });
                    }
                } else if (event === 'SIGNED_OUT') {
                    setState({
                        user: null,
                        profile: null,
                        isLoading: false,
                        isAuthenticated: false,
                    });
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    const signOut = useCallback(async () => {
        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
    }, []);

    return {
        ...state,
        signOut,
    };
}
