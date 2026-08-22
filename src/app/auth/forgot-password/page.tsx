'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { getSupabaseClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/auth/reset-password'
            });

            if (error) throw error;
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] animate-pulse-slow pointer-events-none" />
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm z-10"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 overflow-hidden shadow-[0_0_30px_rgba(143,245,255,0.2)] p-1">
                        <img src="/logo.png?v=5" alt="SynchroMarket Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground font-display">Reset Password</h1>
                    <p className="text-muted-foreground text-sm text-center mt-2">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                    {success ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-6"
                        >
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MailCheck className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Check your email</h3>
                            <p className="text-muted-foreground text-sm mb-6">
                                We sent a password reset link to <br/>
                                <span className="text-foreground font-medium">{email}</span>
                            </p>
                            <Link href="/auth/login">
                                <Button variant="outline" className="w-full">
                                    Return to Log In
                                </Button>
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 ml-1">Email</label>
                                <input 
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                                    {error}
                                </div>
                            )}

                            <Button 
                                type="submit"
                                disabled={isLoading || !email}
                                className="w-full bg-gradient-to-r from-primary to-accent text-[#003f43] font-display font-bold py-3.5"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                            </Button>
                        </form>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <Link href="/auth/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Log In
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
