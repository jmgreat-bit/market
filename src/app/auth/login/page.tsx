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
import { useSettings } from '@/contexts/SettingsContext';
import { Map, Loader2, Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
    
export default function LoginPage() {
    const router = useRouter();
    const { t } = useSettings();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

            router.push(ROUTES.MAP);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sign in');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-surface">
            {/* Back button */}
            <div className="p-4">
                <Link href={ROUTES.MAP}>
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                </Link>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-4">
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
                    <Card className="p-6 bg-[#1a191b]/50 backdrop-blur-[30px] border border-[rgba(72,72,73,0.15)] rounded-xl">
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
                                        className="pl-10 bg-[#131314] border-[rgba(72,72,73,0.15)] text-foreground placeholder:text-muted-foreground focus:border-primary/50"
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
                                        className="pl-10 pr-10 bg-[#131314] border-[rgba(72,72,73,0.15)] text-foreground placeholder:text-muted-foreground focus:border-primary/50"
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
                </motion.div>
            </div>
        </div>
    );
}
