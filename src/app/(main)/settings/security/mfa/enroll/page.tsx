'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { StandalonePageLayout } from '@/components/layout/StandalonePageLayout';
import {
    Loader2,
    ShieldCheck,
    Copy,
    Check,
    QrCode,
    KeyRound,
    AlertTriangle,
} from 'lucide-react';

interface EnrollmentData {
    factorId: string;
    qrCode: string;
    secret: string;
}

function OtpInput({
    value,
    onChange,
    disabled,
}: {
    value: string;
    onChange: (code: string) => void;
    disabled: boolean;
}) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const digits = value.padEnd(6, '').split('').slice(0, 6);

    const focusInput = (index: number) => {
        if (index >= 0 && index < 6) {
            inputRefs.current[index]?.focus();
        }
    };

    const handleChange = (index: number, char: string) => {
        if (!/^\d?$/.test(char)) return;

        const newDigits = [...digits];
        newDigits[index] = char;
        const newCode = newDigits.join('');
        onChange(newCode.replace(/\s/g, ''));

        if (char && index < 5) {
            focusInput(index + 1);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!digits[index] && index > 0) {
                focusInput(index - 1);
                const newDigits = [...digits];
                newDigits[index - 1] = '';
                onChange(newDigits.join('').replace(/\s/g, ''));
            } else {
                const newDigits = [...digits];
                newDigits[index] = '';
                onChange(newDigits.join('').replace(/\s/g, ''));
            }
            e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
            focusInput(index - 1);
        } else if (e.key === 'ArrowRight') {
            focusInput(index + 1);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        onChange(pasted);
        focusInput(Math.min(pasted.length, 5));
    };

    return (
        <div className="flex items-center gap-2 sm:gap-3 justify-center">
            {digits.map((digit, index) => (
                <div key={index} className="relative">
                    {index === 3 && (
                        <div className="absolute -left-1.5 sm:-left-2 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-muted-foreground/40" />
                    )}
                    <input
                        ref={(el) => {
                            inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit.trim()}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        disabled={disabled}
                        className={`
                            w-11 h-14 sm:w-13 sm:h-16
                            text-center text-2xl font-display font-bold
                            bg-[#262627] border-2 rounded-xl
                            text-foreground
                            outline-none
                            transition-all duration-200
                            disabled:opacity-40 disabled:cursor-not-allowed
                            ${
                                digit.trim()
                                    ? 'border-primary/50 shadow-[0_0_15px_rgba(143,245,255,0.15)]'
                                    : 'border-[rgba(72,72,73,0.3)] hover:border-[rgba(72,72,73,0.5)]'
                            }
                            focus:border-primary focus:shadow-[0_0_20px_rgba(143,245,255,0.25)]
                        `}
                        aria-label={`Digit ${index + 1}`}
                    />
                </div>
            ))}
        </div>
    );
}

export default function MfaEnrollPage() {
    const router = useRouter();
    const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
    const [code, setCode] = useState('');
    const [isEnrolling, setIsEnrolling] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const hasEnrolled = useRef(false);

    const startEnrollment = useCallback(async () => {
        if (hasEnrolled.current) return;
        hasEnrolled.current = true;

        try {
            setIsEnrolling(true);
            const supabase = getSupabaseClient();

            // Clean up any existing unverified factors first to prevent the "friendly name already exists" error
            const { data: factorsData } = await supabase.auth.mfa.listFactors();
            if (factorsData?.totp) {
                for (const factor of factorsData.totp) {
                    if (factor.status === 'unverified') {
                        await supabase.auth.mfa.unenroll({ factorId: factor.id });
                    }
                }
            }

            // Also pass a unique friendlyName to guarantee no conflicts if multiple unverified factors exist
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
                friendlyName: `Authenticator-${Date.now()}`
            });
            if (error) throw error;

            setEnrollment({
                factorId: data.id,
                qrCode: data.totp.qr_code,
                secret: data.totp.secret,
            });
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to start MFA enrollment'
            );
        } finally {
            setIsEnrolling(false);
        }
    }, []);

    useEffect(() => {
        startEnrollment();
    }, [startEnrollment]);

    const handleVerify = async () => {
        if (!enrollment || code.length !== 6) return;

        try {
            setIsVerifying(true);
            setError(null);
            const supabase = getSupabaseClient();

            // Step 1: Challenge
            const { data: challengeData, error: challengeError } =
                await supabase.auth.mfa.challenge({ factorId: enrollment.factorId });
            if (challengeError) throw challengeError;

            // Step 2: Verify
            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: enrollment.factorId,
                challengeId: challengeData.id,
                code,
            });
            if (verifyError) throw verifyError;

            setIsVerified(true);

            // Redirect after brief animation
            setTimeout(() => {
                router.push('/settings/security');
            }, 2000);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Verification failed. Please try again.'
            );
            setCode('');
        } finally {
            setIsVerifying(false);
        }
    };

    // Auto-submit when 6 digits entered
    useEffect(() => {
        if (code.length === 6 && enrollment && !isVerifying && !isVerified) {
            handleVerify();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code]);

    const copySecret = async () => {
        if (!enrollment) return;
        await navigator.clipboard.writeText(enrollment.secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Success screen
    if (isVerified) {
        return (
            <StandalonePageLayout title="MFA Setup">
                <div className="bg-surface text-foreground min-h-screen flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', duration: 0.6 }}
                        className="text-center space-y-6"
                    >
                        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                            <ShieldCheck className="w-10 h-10 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-bold text-foreground">
                                MFA Enabled!
                            </h2>
                            <p className="text-muted-foreground mt-2">
                                Your account is now protected with two-factor authentication.
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Redirecting to security settings…
                        </div>
                    </motion.div>
                </div>
            </StandalonePageLayout>
        );
    }

    return (
        <StandalonePageLayout title="Set Up Two-Factor Auth">
            <div className="bg-surface text-foreground min-h-screen flex flex-col pb-32 pt-6">
                <main className="flex-grow max-w-lg mx-auto w-full px-4 md:px-8 space-y-6">
                    {/* Loading */}
                    {isEnrolling ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">
                                Preparing your secure enrollment…
                            </p>
                        </div>
                    ) : enrollment ? (
                        <>
                            {/* Step indicator */}
                            <div className="flex items-center justify-center gap-2 pt-2">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-8 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(143,245,255,0.5)]" />
                                    <div className="w-8 h-1 rounded-full bg-primary/30" />
                                </div>
                            </div>

                            {/* Instructions */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center space-y-2"
                            >
                                <h2 className="text-xl font-display font-bold text-foreground">
                                    Scan QR Code
                                </h2>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                    Open{' '}
                                    <span className="text-foreground font-medium">
                                        Google Authenticator
                                    </span>
                                    ,{' '}
                                    <span className="text-foreground font-medium">
                                        Authy
                                    </span>
                                    , or any TOTP app and scan this code.
                                </p>
                            </motion.div>

                            {/* QR Code Card */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="bg-[#1a191b]/50 backdrop-blur-[30px] rounded-xl p-6 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                {/* QR Code */}
                                <div className="flex justify-center relative z-10">
                                    <div className="bg-white p-4 rounded-xl shadow-[0_0_40px_rgba(143,245,255,0.1)]">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={enrollment.qrCode}
                                            alt="MFA QR Code"
                                            className="w-48 h-48 sm:w-56 sm:h-56"
                                        />
                                    </div>
                                </div>

                                {/* Manual entry toggle */}
                                <div className="relative z-10 mt-5">
                                    <button
                                        onClick={() => setShowSecret(!showSecret)}
                                        className="flex items-center gap-2 mx-auto text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                                    >
                                        {showSecret ? (
                                            <QrCode className="w-4 h-4" />
                                        ) : (
                                            <KeyRound className="w-4 h-4" />
                                        )}
                                        {showSecret
                                            ? 'Hide manual key'
                                            : "Can't scan? Enter key manually"}
                                    </button>

                                    {showSecret && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mt-3"
                                        >
                                            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#262627] border border-[rgba(72,72,73,0.2)]">
                                                <code className="flex-1 text-sm text-foreground font-mono tracking-widest break-all select-all">
                                                    {enrollment.secret}
                                                </code>
                                                <button
                                                    onClick={copySecret}
                                                    className="shrink-0 p-2 rounded-md hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
                                                    title="Copy secret"
                                                >
                                                    {copied ? (
                                                        <Check className="w-4 h-4 text-emerald-400" />
                                                    ) : (
                                                        <Copy className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Verification Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-[#131314] rounded-xl p-1"
                            >
                                <div className="bg-[#1a191b]/40 backdrop-blur-xl rounded-lg p-6 space-y-5">
                                    <div className="text-center">
                                        <h3 className="font-display text-base font-semibold text-foreground">
                                            Enter Verification Code
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Type the 6-digit code shown in your authenticator
                                            app
                                        </p>
                                    </div>

                                    <OtpInput
                                        value={code}
                                        onChange={setCode}
                                        disabled={isVerifying}
                                    />

                                    {/* Error */}
                                    {error && (
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                                            <p className="text-sm text-destructive">
                                                {error}
                                            </p>
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleVerify}
                                        disabled={code.length !== 6 || isVerifying}
                                        className="w-full bg-gradient-to-r from-primary to-accent text-[#003f43] font-display font-bold shadow-[0_0_25px_rgba(143,245,255,0.2)] disabled:opacity-40 disabled:shadow-none"
                                    >
                                        {isVerifying ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Verifying…
                                            </>
                                        ) : (
                                            'Verify & Activate'
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        </>
                    ) : (
                        /* Error fallback */
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                            <p className="text-sm text-destructive text-center">
                                {error || 'Something went wrong. Please try again.'}
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => router.push('/settings/security')}
                                className="border-border text-foreground"
                            >
                                Go Back
                            </Button>
                        </div>
                    )}
                </main>
            </div>
        </StandalonePageLayout>
    );
}
