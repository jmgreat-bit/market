'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { StandalonePageLayout } from '@/components/layout/StandalonePageLayout';
import {
    Shield,
    ShieldCheck,
    ShieldOff,
    Loader2,
    Smartphone,
    AlertTriangle,
    CheckCircle2,
    Trash2,
} from 'lucide-react';

interface MfaFactor {
    id: string;
    friendly_name?: string;
    factor_type: string;
    status: string;
    created_at: string;
}

export default function SecuritySettingsPage() {
    const router = useRouter();
    const [factors, setFactors] = useState<MfaFactor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDisabling, setIsDisabling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const mfaEnabled = factors.some((f) => f.status === 'verified');

    const loadFactors = useCallback(async () => {
        try {
            setIsLoading(true);
            const supabase = getSupabaseClient();
            const { data, error } = await supabase.auth.mfa.listFactors();
            if (error) throw error;
            setFactors((data?.totp as MfaFactor[]) ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load MFA status');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFactors();
    }, [loadFactors]);

    const handleDisableMfa = async (factorId: string) => {
        const confirmed = window.confirm(
            'Are you sure you want to disable two-factor authentication? This will make your account less secure.'
        );
        if (!confirmed) return;

        try {
            setIsDisabling(true);
            setError(null);
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.mfa.unenroll({ factorId });
            if (error) throw error;
            setSuccessMessage('Two-factor authentication has been disabled.');
            await loadFactors();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to disable MFA');
        } finally {
            setIsDisabling(false);
        }
    };

    return (
        <StandalonePageLayout title="Security">
            <div className="bg-surface text-foreground min-h-screen flex flex-col pb-32 pt-6">
                <main className="flex-grow max-w-2xl mx-auto w-full px-4 md:px-8 space-y-8">
                    {/* Header */}
                    <section className="mt-4 mb-2">
                        <p className="font-sans text-muted-foreground text-lg max-w-2xl">
                            Protect your account with an extra layer of security.
                        </p>
                    </section>

                    {/* Success message */}
                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                        >
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            <p className="text-sm text-emerald-300">{successMessage}</p>
                        </motion.div>
                    )}

                    {/* Error message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
                        >
                            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                            <p className="text-sm text-destructive">{error}</p>
                        </motion.div>
                    )}

                    {/* Loading */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {/* MFA Status Card */}
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="bg-[#1a191b]/50 backdrop-blur-[30px] rounded-xl p-6 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                <div className="flex items-start gap-4 relative z-10">
                                    <div
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                                            mfaEnabled
                                                ? 'bg-emerald-500/15 border border-emerald-500/30'
                                                : 'bg-[#262627] border border-[rgba(72,72,73,0.2)]'
                                        }`}
                                    >
                                        {mfaEnabled ? (
                                            <ShieldCheck className="w-7 h-7 text-emerald-400" />
                                        ) : (
                                            <ShieldOff className="w-7 h-7 text-muted-foreground" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-display text-xl font-semibold text-foreground">
                                                Two-Factor Authentication
                                            </h3>
                                            {mfaEnabled ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#262627] text-muted-foreground border border-[rgba(72,72,73,0.2)]">
                                                    Disabled
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {mfaEnabled
                                                ? 'Your account is secured with a time-based one-time password (TOTP). You&apos;ll need your authenticator app each time you sign in.'
                                                : 'Add an extra layer of protection by requiring a verification code from an authenticator app when signing in.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Action area */}
                                <div className="relative z-10 mt-6 pt-5 border-t border-[rgba(72,72,73,0.15)]">
                                    {mfaEnabled ? (
                                        <div className="space-y-4">
                                            {/* List verified factors */}
                                            {factors
                                                .filter((f) => f.status === 'verified')
                                                .map((factor) => (
                                                    <div
                                                        key={factor.id}
                                                        className="flex items-center justify-between p-4 rounded-lg bg-[#262627]/50 border border-[rgba(72,72,73,0.15)]"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Smartphone className="w-5 h-5 text-primary" />
                                                            <div>
                                                                <p className="text-sm font-medium text-foreground font-display">
                                                                    Authenticator App
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Added{' '}
                                                                    {new Date(
                                                                        factor.created_at
                                                                    ).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleDisableMfa(factor.id)
                                                            }
                                                            disabled={isDisabling}
                                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                        >
                                                            {isDisabling ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <Trash2 className="w-4 h-4 mr-1.5" />
                                                                    Remove
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Benefits */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {[
                                                    {
                                                        icon: Shield,
                                                        text: 'Prevents unauthorized access',
                                                    },
                                                    {
                                                        icon: Smartphone,
                                                        text: 'Works with Google Authenticator',
                                                    },
                                                ].map(({ icon: Icon, text }) => (
                                                    <div
                                                        key={text}
                                                        className="flex items-center gap-2.5 text-sm text-muted-foreground"
                                                    >
                                                        <Icon className="w-4 h-4 text-primary shrink-0" />
                                                        <span>{text}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <Button
                                                onClick={() =>
                                                    router.push(
                                                        '/settings/security/mfa/enroll'
                                                    )
                                                }
                                                className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent text-[#003f43] font-display font-bold shadow-[0_0_25px_rgba(143,245,255,0.2)] hover:shadow-[0_0_35px_rgba(143,245,255,0.35)] transition-shadow"
                                            >
                                                <Shield className="w-4 h-4 mr-2" />
                                                Enable Two-Factor Authentication
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </motion.section>

                            {/* Info Card */}
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                                className="bg-[#131314] rounded-xl p-1"
                            >
                                <div className="bg-[#1a191b]/40 backdrop-blur-xl rounded-lg p-6">
                                    <h3 className="font-display text-base font-semibold text-foreground mb-3">
                                        How does it work?
                                    </h3>
                                    <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                                        <li>
                                            Download an authenticator app like{' '}
                                            <span className="text-foreground font-medium">
                                                Google Authenticator
                                            </span>{' '}
                                            or{' '}
                                            <span className="text-foreground font-medium">
                                                Authy
                                            </span>
                                        </li>
                                        <li>Scan the QR code we provide during setup</li>
                                        <li>
                                            Enter the 6-digit code from the app to complete
                                            enrollment
                                        </li>
                                        <li>
                                            Each time you sign in, you&apos;ll enter your password{' '}
                                            <span className="text-foreground font-medium">
                                                plus
                                            </span>{' '}
                                            a code from the app
                                        </li>
                                    </ol>
                                </div>
                            </motion.section>
                        </>
                    )}
                </main>
            </div>
        </StandalonePageLayout>
    );
}
