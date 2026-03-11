'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    profile: Profile | null;
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

        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: Session | null } }) => {
            if (session?.user) {
                const profile = await fetchProfile(session.user.id);
                setState({
                    user: session.user,
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
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event: AuthChangeEvent, session: Session | null) => {
                if (session?.user) {
                    const profile = await fetchProfile(session.user.id);
                    setState({
                        user: session.user,
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
