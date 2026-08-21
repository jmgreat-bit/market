'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Supabase will automatically pick up the #access_token=... in the URL
    // and establish a session. We just need to call updateUser.
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const supabase = getSupabaseClient();
            
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;
            
            setSuccess(true);
            setTimeout(() => {
                router.push(ROUTES.FEED);
            }, 2000);
            
        } catch (err: any) {
            setError(err.message || 'Failed to update password. Your link may have expired.');
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
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 overflow-hidden shadow-[0_0_30px_rgba(143,245,255,0.2)]">
                        <img src="/logo.png" alt="MarketPLC Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground font-display">Set New Password</h1>
                    <p className="text-muted-foreground text-sm text-center mt-2">
                        Please enter your new password below.
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
                                <KeyRound className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Password Updated!</h3>
                            <p className="text-muted-foreground text-sm mb-6">
                                Your password has been successfully changed. Redirecting to the app...
                            </p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 ml-1">New Password</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="��������"
                                        className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                                    {error}
                                </div>
                            )}

                            <Button 
                                type="submit"
                                disabled={isLoading || password.length < 6}
                                className="w-full bg-gradient-to-r from-primary to-accent text-[#003f43] font-display font-bold py-3.5"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                            </Button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
