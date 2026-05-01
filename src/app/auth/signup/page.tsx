'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ROUTES, USERNAME_MAX_LENGTH, FULLNAME_MAX_LENGTH } from '@/lib/constants';
import { UserRole } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import {
    Map,
    Loader2,
    Mail,
    Lock,
    User,
    ArrowLeft,
    ShoppingBag,
    Store,
    AtSign,
    Eye,
    EyeOff
} from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const { t } = useSettings();
    const [step, setStep] = useState<'role' | 'details'>('role');
    const [role, setRole] = useState<UserRole>('client');
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agreeToTerms, setAgreeToTerms] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreeToTerms) {
            setError('You must agree to the Terms of Service and Privacy Policy');
            return;
        }
        setIsLoading(true);
        setError(null);

        // Basic validation
        if (!username.trim()) {
            setError('Username is required');
            setIsLoading(false);
            return;
        }

        if (username.length < 3) {
            setError('Username must be at least 3 characters');
            setIsLoading(false);
            return;
        }

        if (username.length > USERNAME_MAX_LENGTH) {
            setError(`Username must be less than ${USERNAME_MAX_LENGTH} characters`);
            setIsLoading(false);
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setError('Username can only contain letters, numbers, and underscores');
            setIsLoading(false);
            return;
        }

        if (fullName.length > FULLNAME_MAX_LENGTH) {
            setError(`Full name must be less than ${FULLNAME_MAX_LENGTH} characters`);
            setIsLoading(false);
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            setIsLoading(false);
            return;
        }

        if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
            setError('Password must contain at least one letter and one number');
            setIsLoading(false);
            return;
        }

        try {
            const supabase = getSupabaseClient();
            const normalizedUsername = username.toLowerCase().trim();

            // 1. Pre-check if username already exists
            const { data: existingUser, error: checkError } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', normalizedUsername)
                .maybeSingle();

            if (existingUser) {
                setError('This username is already taken. Please choose another.');
                setIsLoading(false);
                return;
            }

            // 2. Sign up the user
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        username: normalizedUsername,
                        role: role,
                    },
                },
            });
            if (signUpError) throw signUpError;

            // Update the profile with username after signup
            if (data.user) {
                await supabase.from('profiles').update({
                    username: normalizedUsername,
                    full_name: fullName,
                }).eq('id', data.user.id);
            }

            // Redirect to feed after signup — middleware handles the rest
            router.push(ROUTES.FEED);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sign up');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-surface">
            {/* Back button */}
            <div className="p-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => step === 'details' ? setStep('role') : router.push(ROUTES.LOGIN)}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-4">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: step === 'role' ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: step === 'role' ? 20 : -20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-sm"
                >
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(143,245,255,0.2)]">
                            <Map className="w-8 h-8 text-[#003f43]" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground font-display">
                            {step === 'role' ? 'Join MarketPLC' : 'Create Account'}
                        </h1>
                        <p className="text-muted-foreground text-sm text-center mt-1">
                            {step === 'role'
                                ? 'Choose how you want to use MarketPLC'
                                : role === 'trader' ? 'Set up your business presence' : 'Start discovering local businesses'}
                        </p>
                    </div>

                    {step === 'role' ? (
                        /* Role Selection */
                        <div className="space-y-4">
                            <button
                                onClick={() => { setRole('client'); setStep('details'); }}
                                className="w-full text-left"
                            >
                                <Card className="p-6 bg-card backdrop-blur-[30px] border border-border hover:border-primary/40 transition-all group rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <ShoppingBag className="w-7 h-7 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground text-lg font-display">Explorer</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Discover deals, events & local businesses
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </button>

                            <button
                                onClick={() => { setRole('trader'); setStep('details'); }}
                                className="w-full text-left"
                            >
                                <Card className="p-6 bg-card backdrop-blur-[30px] border border-border hover:border-accent/40 transition-all group rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                                            <Store className="w-7 h-7 text-accent" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground text-lg font-display">Trader</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Promote your business & reach customers
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </button>
                        </div>
                    ) : (
                        /* Details Form */
                        <Card className="p-6 bg-card backdrop-blur-[30px] border border-border rounded-xl">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                                        {error}
                                    </div>
                                )}


                                {/* Full Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-foreground text-sm">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="fullName"
                                            type="text"
                                            placeholder="John Doe"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50"
                                            required
                                            maxLength={FULLNAME_MAX_LENGTH}
                                        />
                                    </div>
                                </div>

                                {/* Username */}
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-foreground text-sm">Username</Label>
                                    <div className="relative">
                                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="username"
                                            type="text"
                                            placeholder="johndoe"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                                            className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50"
                                            required
                                            minLength={3}
                                            maxLength={USERNAME_MAX_LENGTH}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Letters, numbers, and underscores only</p>
                                </div>

                                {/* Email */}
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
                                            minLength={8}
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
                                    <p className="text-xs text-muted-foreground">
                                        Min 8 chars, including at least 1 number and 1 letter.
                                    </p>
                                </div>

                                {/* Legal Consent */}
                                <div className="flex items-start gap-3 py-2">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="terms"
                                            name="terms"
                                            type="checkbox"
                                            checked={agreeToTerms}
                                            onChange={(e) => setAgreeToTerms(e.target.checked)}
                                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-input"
                                            required
                                        />
                                    </div>
                                    <div className="text-xs text-muted-foreground leading-snug">
                                        By clicking &quot;Create Account&quot;, I agree to the{' '}
                                        <Link href="/legal/terms" target="_blank" className="text-primary hover:underline font-medium">Terms of Service</Link>
                                        {' '}and acknowledge the{' '}
                                        <Link href="/legal/privacy" target="_blank" className="text-primary hover:underline font-medium">Privacy Policy</Link>.
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className={`w-full font-display font-bold text-[#003f43] ${role === 'trader' ? 'bg-gradient-to-r from-accent to-primary' : 'bg-gradient-to-r from-primary to-accent'}`}
                                    disabled={isLoading || !agreeToTerms}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Creating account...
                                        </>
                                    ) : (
                                        'Create Account'
                                    )}
                                </Button>
                            </form>
                        </Card>
                    )}

                    {/* Footer */}
                    <p className="text-center text-sm text-muted-foreground mt-6">
                        Already have an account?{' '}
                        <Link href={ROUTES.LOGIN} className="text-primary hover:underline font-medium">
                            Sign In
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
