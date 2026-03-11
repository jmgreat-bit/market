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
import { ROUTES } from '@/lib/constants';
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
    Store
} from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const { t } = useSettings();
    const [step, setStep] = useState<'role' | 'details'>('role');
    const [role, setRole] = useState<UserRole>('client');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role,
                    },
                },
            });

            if (error) throw error;

            // Redirect based on role
            if (role === 'trader') {
                router.push(ROUTES.PROFILE);
            } else {
                router.push(ROUTES.MAP);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t.common?.error || 'Failed to sign up');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Back button */}
            <div className="p-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => step === 'details' ? setStep('role') : router.push(ROUTES.MAP)}
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
                        <div className="w-16 h-16 rounded-2xl geo-gradient flex items-center justify-center mb-4 geo-glow">
                            <Map className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {step === 'role' ? 'Join GeoPulse' : t.auth.createAccount}
                        </h1>
                        <p className="text-muted-foreground text-sm text-center">
                            {step === 'role'
                                ? 'Choose how you want to use GeoPulse'
                                : role === 'trader' ? t.auth.traderRole : t.auth.clientRole}
                        </p>
                    </div>

                    {step === 'role' ? (
                        /* Role Selection */
                        <div className="space-y-4">
                            <button
                                onClick={() => { setRole('client'); setStep('details'); }}
                                className="w-full"
                            >
                                <Card className="glass-card p-6 hover:border-primary/50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <ShoppingBag className="w-7 h-7 text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-semibold text-foreground text-lg">{t.auth.clientRole}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {t.auth.clientDesc}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </button>

                            <button
                                onClick={() => { setRole('trader'); setStep('details'); }}
                                className="w-full"
                            >
                                <Card className="glass-card p-6 hover:border-accent/50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                                            <Store className="w-7 h-7 text-accent" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-semibold text-foreground text-lg">{t.auth.traderRole}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {t.auth.traderDesc}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </button>
                        </div>
                    ) : (
                        /* Details Form */
                        <Card className="glass-card p-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="fullName">{t.auth.fullName}</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="fullName"
                                            type="text"
                                            placeholder="John Doe"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">{t.auth.email}</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">{t.auth.password}</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10"
                                            minLength={6}
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Must be at least 6 characters
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    className={`w-full text-white ${role === 'trader' ? 'bg-accent hover:bg-accent/90' : 'geo-gradient'}`}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            {t.common?.loading || 'Loading...'}
                                        </>
                                    ) : (
                                        t.auth.createAccount
                                    )}
                                </Button>
                            </form>
                        </Card>
                    )}

                    {/* Footer */}
                    <p className="text-center text-sm text-muted-foreground mt-6">
                        {t.auth.haveAccount}{' '}
                        <Link href={ROUTES.LOGIN} className="text-primary hover:underline">
                            {t.auth.signIn}
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
