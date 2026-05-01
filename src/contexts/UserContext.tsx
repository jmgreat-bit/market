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

    const fetchProfile = useCallback(async (userId: string) => {
        const supabase = getSupabaseClient();
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        return data as Profile | null;
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

        return () => {
            mounted = false;
            authSubscription?.unsubscribe();
        };
    }, [fetchProfile]);

    const signOut = useCallback(async () => {
        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
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
