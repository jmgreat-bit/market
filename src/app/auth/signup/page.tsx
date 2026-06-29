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
import dynamic from 'next/dynamic';
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
    EyeOff,
    MapPin,
    ChevronRight
} from 'lucide-react';

const OnboardingMap = dynamic(
    () => import('@/components/features/map/OnboardingMap'),
    { 
        ssr: false,
        loading: () => <div className="h-64 bg-secondary animate-pulse rounded-xl flex items-center justify-center text-muted-foreground">Initializing Map...</div>
    }
);

export default function SignupPage() {
    const router = useRouter();
    const { t } = useSettings();
    const [step, setStep] = useState<'role' | 'details' | 'location'>('role');
    const [role, setRole] = useState<UserRole>('client');
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    
    // Location state for traders
    const [locationLat, setLocationLat] = useState(-1.9441);
    const [locationLng, setLocationLng] = useState(30.0619);
    const [locationSet, setLocationSet] = useState(false);

    const handleLocationSelect = (lat: number, lng: number) => {
        setLocationLat(lat);
        setLocationLng(lng);
        setLocationSet(true);
    };

    const handleDetailsNext = (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreeToTerms) {
            setError('You must agree to the Terms of Service and Privacy Policy');
            return;
        }
        setError(null);

        // Validation
        if (!username.trim()) { setError('Username is required'); return; }
        if (username.length < 3) { setError('Username must be at least 3 characters'); return; }
        if (username.length > USERNAME_MAX_LENGTH) { setError(`Username must be less than ${USERNAME_MAX_LENGTH} characters`); return; }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('Username can only contain letters, numbers, and underscores'); return; }
        if (fullName.length > FULLNAME_MAX_LENGTH) { setError(`Full name must be less than ${FULLNAME_MAX_LENGTH} characters`); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
        if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) { setError('Password must contain at least one letter and one number'); return; }

        // If trader, go to location step; if explorer, submit directly
        if (role === 'trader') {
            setStep('location');
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const supabase = getSupabaseClient();
            const normalizedUsername = username.toLowerCase().trim();

            // Pre-check username
            const { data: existingUser } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', normalizedUsername)
                .maybeSingle();

            if (existingUser) {
                setError('This username is already taken. Please choose another.');
                setIsLoading(false);
                return;
            }

            // Sign up
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

            // Update profile
            if (data.user) {
                await supabase.from('profiles').update({
                    username: normalizedUsername,
                    full_name: fullName,
                }).eq('id', data.user.id);

                // If trader, create business with location as their stored address
                if (role === 'trader' && locationSet) {
                    await supabase.from('business_details').upsert({
                        profile_id: data.user.id,
                        business_name: fullName + "'s Business",
                        category: 'Other',
                        latitude: locationLat,
                        longitude: locationLng,
                        address: `${locationLat.toFixed(6)}, ${locationLng.toFixed(6)}`,
                    });
                }
            }

            // Redirect traders to setup-business to fill remaining details, explorers to feed
            if (role === 'trader') {
                router.push('/setup-business');
            } else {
                router.push(ROUTES.FEED);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sign up');
        } finally {
            setIsLoading(false);
        }
    };

    const getStepIndex = () => step === 'role' ? 0 : step === 'details' ? 1 : 2;
    const totalSteps = role === 'trader' ? 3 : 2;

    return (
        <div className="min-h-screen flex flex-col bg-surface">
            {/* Back button */}
            <div className="p-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                        if (step === 'location') setStep('details');
                        else if (step === 'details') setStep('role');
                        else router.push(ROUTES.LOGIN);
                    }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-4">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-sm"
                >
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(143,245,255,0.2)]">
                            <Map className="w-8 h-8 text-[#003f43]" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground font-display">
                            {step === 'role' ? 'Join MarketPLC' : step === 'location' ? 'Pin Your Location' : 'Create Account'}
                        </h1>
                        <p className="text-muted-foreground text-sm text-center mt-1">
                            {step === 'role'
                                ? 'Choose how you want to use MarketPLC'
                                : step === 'location'
                                    ? 'Drop a pin where your business is located'
                                    : role === 'trader' ? 'Set up your business presence' : 'Start discovering local businesses'}
                        </p>
                        {/* Progress dots */}
                        <div className="flex gap-2 mt-4">
                            {Array.from({ length: totalSteps }).map((_, i) => (
                                <div key={i} className={`w-8 h-1.5 rounded-full transition-colors ${i <= getStepIndex() ? 'bg-primary' : 'bg-secondary'}`} />
                            ))}
                        </div>
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
                    ) : step === 'details' ? (
                        /* Details Form */
                        <Card className="p-6 bg-card backdrop-blur-[30px] border border-border rounded-xl">
                            <form onSubmit={handleDetailsNext} className="space-y-4">
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
                                    {role === 'trader' ? (
                                        <>Next: Set Location <ChevronRight className="w-4 h-4 ml-1" /></>
                                    ) : isLoading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating account...</>
                                    ) : (
                                        'Create Account'
                                    )}
                                </Button>

                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-border/50" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-card px-2 text-muted-foreground">Or</span>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full bg-transparent border border-border text-foreground hover:bg-secondary/50 font-medium"
                                    disabled={!agreeToTerms}
                                    onClick={async () => {
                                        const supabase = getSupabaseClient();
                                        await supabase.auth.signInWithOAuth({
                                            provider: 'google',
                                            options: { redirectTo: `${window.location.origin}/auth/callback` }
                                        });
                                    }}
                                >
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Continue with Google
                                </Button>
                            </form>
                        </Card>
                    ) : (
                        /* Location Picker for Traders (Full Screen Overlay) */
                        <div className="fixed inset-0 z-50 bg-background flex flex-col">
                            {/* Full screen map */}
                            <div className="flex-1 w-full relative">
                                <OnboardingMap 
                                    initialCenter={[locationLat, locationLng]} 
                                    onLocationSelect={handleLocationSelect} 
                                />
                                
                                {/* Floating Back Button */}
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="absolute top-6 left-6 z-[400] gap-2 shadow-lg rounded-full"
                                    onClick={() => setStep('details')}
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </Button>

                                {/* Floating Header */}
                                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[400] bg-background/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-border/50 text-center">
                                    <h1 className="text-sm font-bold text-foreground font-display">Pin Your Location</h1>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">Where is your business located?</p>
                                </div>

                                {/* Floating Status Pill */}
                                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[400] bg-primary/10 backdrop-blur-md px-4 py-2 rounded-full border border-primary/20 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-primary" /> 
                                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Tap Map or Use GPS</span>
                                </div>
                            </div>

                            {/* Bottom Sheet for Action */}
                            <div className="bg-card border-t border-border/50 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[400]">
                                <div className="max-w-md mx-auto space-y-4">
                                    {error && (
                                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                                            {error}
                                        </div>
                                    )}

                                    {locationSet ? (
                                        <div className="flex items-center gap-3 text-sm text-foreground bg-secondary/50 px-4 py-3 rounded-xl border border-border/50">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <MapPin className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">Location Selected</p>
                                                <p className="text-xs text-muted-foreground">{locationLat.toFixed(4)}, {locationLng.toFixed(4)}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center">
                                            Please set your location on the map to continue.
                                        </p>
                                    )}

                                    <Button
                                        onClick={handleSubmit}
                                        className="w-full h-12 font-display font-bold text-[#003f43] bg-gradient-to-r from-accent to-primary text-lg"
                                        disabled={isLoading || !locationSet}
                                    >
                                        {isLoading ? (
                                            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Creating account...</>
                                        ) : (
                                            'Create Account & Continue'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <p className="text-center text-sm text-muted-foreground mt-6">
                        Already have an account?{' '}
                        <Link href={ROUTES.LOGIN} className="text-primary hover:underline font-medium">
                            Sign In
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
            </div>
        </div>
    );
}
