'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/lib/constants';
import { useSettings } from '@/contexts/SettingsContext';
import { Map, Loader2, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

/* ─── 6-digit OTP Input ─── */
function MfaOtpInput({
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
        if (index >= 0 && index < 6) inputRefs.current[index]?.focus();
    };

    const handleChange = (index: number, char: string) => {
        if (!/^\d?$/.test(char)) return;
        const newDigits = [...digits];
        newDigits[index] = char;
        onChange(newDigits.join('').replace(/\s/g, ''));
        if (char && index < 5) focusInput(index + 1);
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!digits[index] && index > 0) {
                focusInput(index - 1);
                const nd = [...digits];
                nd[index - 1] = '';
                onChange(nd.join('').replace(/\s/g, ''));
            } else {
                const nd = [...digits];
                nd[index] = '';
                onChange(nd.join('').replace(/\s/g, ''));
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
                        ref={(el) => { inputRefs.current[index] = el; }}
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
                            text-foreground outline-none
                            transition-all duration-200
                            disabled:opacity-40 disabled:cursor-not-allowed
                            ${digit.trim()
                                ? 'border-primary/50 shadow-[0_0_15px_rgba(143,245,255,0.15)]'
                                : 'border-[rgba(72,72,73,0.3)] hover:border-[rgba(72,72,73,0.5)]'}
                            focus:border-primary focus:shadow-[0_0_20px_rgba(143,245,255,0.25)]
                        `}
                        aria-label={`Digit ${index + 1}`}
                    />
                </div>
            ))}
        </div>
    );
}

/* ─── MFA Challenge Screen ─── */
function MfaChallengeScreen({ onSuccess }: { onSuccess: () => void }) {
    const [code, setCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const verifyingRef = useRef(false);

    const handleVerify = async (otpCode: string) => {
        if (otpCode.length !== 6 || verifyingRef.current) return;
        verifyingRef.current = true;
        setIsVerifying(true);
        setError(null);

        try {
            const supabase = getSupabaseClient();

            // Get the TOTP factor
            const { data: factorsData, error: factorsError } =
                await supabase.auth.mfa.listFactors();
            if (factorsError) throw factorsError;

            const totpFactor = factorsData?.totp?.find(
                (f: { status: string }) => f.status === 'verified'
            );
            if (!totpFactor) throw new Error('No verified MFA factor found');

            // Challenge
            const { data: challengeData, error: challengeError } =
                await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
            if (challengeError) throw challengeError;

            // Verify
            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: totpFactor.id,
                challengeId: challengeData.id,
                code: otpCode,
            });
            if (verifyError) throw verifyError;

            onSuccess();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Verification failed. Please try again.'
            );
            setCode('');
        } finally {
            setIsVerifying(false);
            verifyingRef.current = false;
        }
    };

    const handleCodeChange = (newCode: string) => {
        setCode(newCode);
        if (newCode.length === 6) {
            handleVerify(newCode);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm"
        >
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(143,245,255,0.2)]">
                    <ShieldCheck className="w-8 h-8 text-[#003f43]" />
                </div>
                <h1 className="text-2xl font-bold text-foreground font-display">
                    Two-Factor Authentication
                </h1>
                <p className="text-muted-foreground text-sm text-center mt-1">
                    Enter the 6-digit code from your authenticator app
                </p>
            </div>

            {/* Code Entry */}
            <Card className="p-6 bg-card backdrop-blur-[30px] border border-border rounded-xl">
                <div className="space-y-5">
                    <MfaOtpInput
                        value={code}
                        onChange={handleCodeChange}
                        disabled={isVerifying}
                    />

                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 text-center">
                            {error}
                        </div>
                    )}

                    <Button
                        onClick={() => handleVerify(code)}
                        disabled={code.length !== 6 || isVerifying}
                        className="w-full bg-gradient-to-r from-primary to-accent text-[#003f43] font-display font-bold"
                    >
                        {isVerifying ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Verifying…
                            </>
                        ) : (
                            'Verify'
                        )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                        Open your authenticator app to view your verification code.
                    </p>
                </div>
            </Card>
        </motion.div>
    );
}

/* ─── Login Form ─── */
// Separated into its own component so useSearchParams() can be wrapped in Suspense
function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useSettings();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showMfaChallenge, setShowMfaChallenge] = useState(false);

    const getRedirectPath = () => searchParams.get('next') || ROUTES.FEED;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const supabase = getSupabaseClient();

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;

            // Check if user has MFA enabled
            const { data: aalData, error: aalError } =
                await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (aalError) throw aalError;

            if (
                aalData?.nextLevel === 'aal2' &&
                aalData?.currentLevel === 'aal1'
            ) {
                // User has MFA – show challenge screen
                setShowMfaChallenge(true);
                return;
            }

            // No MFA – redirect directly
            router.push(getRedirectPath());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sign in');
        } finally {
            setIsLoading(false);
        }
    };

    // MFA challenge succeeded → redirect
    if (showMfaChallenge) {
        return (
            <MfaChallengeScreen
                onSuccess={() => router.push(getRedirectPath())}
            />
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm"
        >
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(143,245,255,0.2)]">
                    <Map className="w-8 h-8 text-[#003f43]" />
                </div>
                <h1 className="text-2xl font-bold text-foreground font-display">Welcome Back</h1>
                <p className="text-muted-foreground text-sm">Sign in to continue exploring</p>
            </div>

            {/* Form */}
            <Card className="p-6 bg-card backdrop-blur-[30px] border border-border rounded-xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-foreground text-sm">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-foreground text-sm">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 pr-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary to-accent text-[#003f43] font-display font-bold"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </Button>
                </form>
            </Card>

            {/* Footer */}
            <p className="text-center text-sm text-muted-foreground mt-6">
                Don&apos;t have an account?{' '}
                <Link href={ROUTES.SIGNUP} className="text-primary hover:underline font-medium">
                    Sign Up
                </Link>
            </p>

            {/* Legal Links */}
            <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                <Link href="/legal/privacy" className="text-[11px] text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
                <span className="text-muted-foreground/30 text-[10px]">•</span>
                <Link href="/legal/terms" className="text-[11px] text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
                <span className="text-muted-foreground/30 text-[10px]">•</span>
                <Link href="/legal/rights" className="text-[11px] text-muted-foreground hover:text-primary transition-colors">Your Data Rights</Link>
            </div>
        </motion.div>
    );
}

// Suspense wrapper required because LoginForm uses useSearchParams()
export default function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col bg-surface">
            <div className="flex-1 flex items-center justify-center p-4">
                <Suspense fallback={
                    <div className="flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                }>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
}
