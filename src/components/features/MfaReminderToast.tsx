'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ShieldCheck, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';

const SESSION_KEY = 'mfa_reminder_dismissed';

export function MfaReminderToast() {
    const { user } = useUser();
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(true);
    const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const dismiss = useCallback(() => {
        setIsVisible(false);
        try {
            sessionStorage.setItem(SESSION_KEY, 'true');
        } catch {
            // sessionStorage may be unavailable in some contexts
        }
        // Wait for fade-out animation, then unmount
        setTimeout(() => setShouldRender(false), 500);
    }, []);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (showTimerRef.current) clearTimeout(showTimerRef.current);
            if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
        };
    }, []);

    useEffect(() => {
        if (!user) return;

        // Already dismissed this session?
        try {
            if (sessionStorage.getItem(SESSION_KEY) === 'true') {
                setShouldRender(false);
                return;
            }
        } catch {
            // sessionStorage unavailable
        }

        const checkMfa = async () => {
            try {
                const supabase = getSupabaseClient();

                // listFactors is the most reliable way to check MFA enrollment
                const { data, error } = await supabase.auth.mfa.listFactors();

                if (error) {
                    console.log('[MFA Toast] Error checking MFA factors:', error.message);
                    return;
                }

                // Check if any TOTP factor is verified
                const hasVerifiedFactor = data?.totp?.some(
                    (factor: { status: string }) => factor.status === 'verified'
                );

                if (hasVerifiedFactor) {
                    // User already has MFA — don't show
                    setShouldRender(false);
                    return;
                }

                // No MFA — show toast after 3s delay
                showTimerRef.current = setTimeout(() => {
                    setIsVisible(true);

                    // Auto-dismiss after 15s
                    autoDismissRef.current = setTimeout(() => {
                        dismiss();
                    }, 15000);
                }, 3000);

            } catch (err) {
                console.log('[MFA Toast] Exception:', err);
            }
        };

        checkMfa();
    }, [user, dismiss]);

    if (!shouldRender || !user) return null;

    return (
        <div
            className={`fixed bottom-24 right-4 z-50 max-w-sm w-[calc(100%-2rem)] sm:w-auto sm:min-w-[320px] transition-all duration-500 ease-out ${
                isVisible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-8 opacity-0 pointer-events-none'
            }`}
        >
            <div className="bg-card/80 backdrop-blur-xl border border-border/20 p-4 rounded-2xl shadow-xl flex gap-3.5 items-start relative">
                {/* Dismiss button */}
                <button
                    onClick={dismiss}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-white/5"
                    aria-label="Dismiss"
                >
                    <X className="w-3.5 h-3.5" />
                </button>

                {/* Shield icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <ShieldCheck className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="font-bold text-foreground text-sm mb-0.5 pr-6">
                        Protect your account
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2.5">
                        Enable two-factor authentication for extra security
                    </p>

                    <Link
                        href="/settings/security/mfa/enroll"
                        onClick={dismiss}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                        Enable Now
                        <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
