'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    profile: Profile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const UserContext = createContext<AuthState | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<{
        user: User | null;
        profile: Profile | null;
        isLoading: boolean;
        isAuthenticated: boolean;
    }>({
        user: null,
        profile: null,
        isLoading: true,
        isAuthenticated: false,
    });

    const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
        try {
            const supabase = getSupabaseClient();
            const profilePromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            // Race against 8s timeout — never hang forever on a stalled query
            const result = await Promise.race([
                profilePromise,
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('fetchProfile timeout (8s)')), 8000)
                )
            ]);

            return (result as any).data as Profile | null;
        } catch (err) {
            console.warn('[UserProvider] fetchProfile failed:', err);
            return null;
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            setState(prev => ({
                ...prev,
                user: session.user,
                profile,
                isAuthenticated: true,
                isLoading: false
            }));
        }
    }, [fetchProfile]);

    useEffect(() => {
        let mounted = true;
        let supabase: any;
        let authSubscription: any = null;

        try {
            supabase = getSupabaseClient();
        } catch (err) {
            console.error('[UserProvider] Failed to initialize Supabase client:', err);
            if (mounted) setState(prev => ({ ...prev, isLoading: false }));
            return;
        }

        const initSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error || !session?.user) {
                    if (mounted) setState({ user: null, profile: null, isLoading: false, isAuthenticated: false });
                } else {
                    const profile = await fetchProfile(session.user.id);
                    if (mounted) {
                        setState({
                            user: session.user,
                            profile,
                            isLoading: false,
                            isAuthenticated: true,
                        });
                    }
                }

                const { data: { subscription } } = supabase.auth.onAuthStateChange(
                    async (event: AuthChangeEvent, currentSession: Session | null) => {
                        if (event === 'INITIAL_SESSION') return;

                        if (currentSession?.user) {
                            if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
                                const profile = await fetchProfile(currentSession.user.id);
                                if (mounted) {
                                    setState({
                                        user: currentSession.user,
                                        profile,
                                        isLoading: false,
                                        isAuthenticated: true,
                                    });
                                }
                            }
                        } else if (event === 'SIGNED_OUT') {
                            if (mounted) {
                                setState({
                                    user: null,
                                    profile: null,
                                    isLoading: false,
                                    isAuthenticated: false,
                                });
                            }
                        }
                    }
                );
                authSubscription = subscription;

            } catch (err) {
                console.error('[UserProvider] Fatal error initializing auth:', err);
                if (mounted) setState(prev => ({ ...prev, isLoading: false }));
            }
        };

        initSession();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // getUser() forces a real server round-trip to refresh expired tokens
                // (getSession() only reads cached tokens and misses expiry)
                supabase.auth.getUser().catch(console.error);
                // Restart background auto-refresh timer (browsers throttle timers in hidden tabs)
                supabase.auth.startAutoRefresh();
            } else {
                supabase.auth.stopAutoRefresh();
            }
        };

        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        return () => {
            mounted = false;
            authSubscription?.unsubscribe();
            if (typeof document !== 'undefined') {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            }
        };
    }, [fetchProfile]);

    const signOut = useCallback(async () => {
        // Clear local state IMMEDIATELY so UI doesn't hang
        setState({ user: null, profile: null, isLoading: false, isAuthenticated: false });

        try {
            const supabase = getSupabaseClient();
            // Race signOut against a 3s timeout — expired tokens can hang forever
            await Promise.race([
                supabase.auth.signOut(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('signOut timeout')), 3000))
            ]);
        } catch (err) {
            console.warn('[UserProvider] signOut failed or timed out, forcing redirect:', err);
        }

        // Always redirect, even if signOut failed
        window.location.href = '/feed';
    }, []);

    const value = {
        ...state,
        signOut,
        refreshProfile
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export function useUserContext() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
}
