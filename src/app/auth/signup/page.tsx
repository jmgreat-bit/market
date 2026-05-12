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
                            </form>
                        </Card>
                    ) : (
                        /* Location Picker for Traders */
                        <Card className="p-6 bg-card backdrop-blur-[30px] border border-border rounded-xl space-y-5">
                            {error && (
                                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-foreground text-sm">Drop a pin on your business location</Label>
                                <div className="h-72 w-full rounded-2xl overflow-hidden border border-border/50 relative">
                                    <OnboardingMap 
                                        initialCenter={[locationLat, locationLng]} 
                                        onLocationSelect={handleLocationSelect} 
                                    />
                                    <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-primary border border-primary/20 flex items-center gap-2">
                                        <MapPin className="w-3 h-3" /> TAP MAP TO SET POSITION
                                    </div>
                                </div>
                            </div>

                            {locationSet && (
                                <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 px-3 py-2 rounded-lg border border-primary/20">
                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                    Location set: {locationLat.toFixed(4)}, {locationLng.toFixed(4)}
                                </div>
                            )}

                            <p className="text-xs text-muted-foreground text-center">
                                This will be stored as your business address. You can update it later.
                            </p>

                            <Button
                                onClick={handleSubmit}
                                className="w-full font-display font-bold text-[#003f43] bg-gradient-to-r from-accent to-primary"
                                disabled={isLoading || !locationSet}
                            >
                                {isLoading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating account...</>
                                ) : (
                                    'Create Account & Continue Setup'
                                )}
                            </Button>
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
