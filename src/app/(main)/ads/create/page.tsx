'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target, Check, Globe, MapPin, Clock,
    ArrowRight, ArrowLeft, Megaphone,
    Crown, BarChart3, Lock, Loader2, CheckCircle2
} from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Post } from '@/types';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

// ── Constants ──────────────────────────────────────────

const PLACEMENTS = [
    { id: 'in_feed', label: 'In-Feed', desc: 'Appears in user feeds', icon: <Target className="w-5 h-5" /> },
    { id: 'in_comments', label: 'In-Comments', desc: 'Appears between comments', icon: <Megaphone className="w-5 h-5" /> },
    { id: 'explore', label: 'Explore Page', desc: 'Appears in explore', icon: <Globe className="w-5 h-5" /> },
    { id: 'search', label: 'Search Results', desc: 'Appears at top of search', icon: <MapPin className="w-5 h-5" /> },
] as const;

const BUNDLE_MULTIPLIERS: Record<number, number> = { 1: 1, 2: 1.5, 3: 1.8, 4: 2 };

const DURATIONS = [
    { days: 1, dailyRate: 500, label: '1 Day' },
    { days: 7, dailyRate: 450, label: '7 Days' },
    { days: 14, dailyRate: 400, label: '14 Days' },
    { days: 30, dailyRate: 350, label: '30 Days' },
] as const;

const RADII = [
    { km: 2, multiplier: 1, label: '2 km', desc: 'Default', minTier: 'pro' as const },
    { km: 4, multiplier: 1.5, label: '4 km', desc: 'Pro only', minTier: 'pro' as const },
    { km: 0, multiplier: 3, label: 'Citywide', desc: 'National only', minTier: 'national' as const, isCitywide: true },
    { km: 0, multiplier: 10, label: 'Nationwide', desc: 'National only', minTier: 'national' as const, isNationwide: true },
] as const;

const STEP_LABELS = ['Select Post', 'Placements', 'Duration & Radius', 'Review'];

// ── Animation variants ─────────────────────────────────

const stepVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: 'easeOut' as const } },
    exit: (direction: number) => ({ x: direction > 0 ? -80 : 80, opacity: 0, transition: { duration: 0.25 } }),
};

// ── Page component ──────────────────────────────────────

export default function AdsCreatePage() {
    const { profile, isLoading: authLoading } = useUser();
    const { coordinates } = useGeolocation();

    const isTrader = profile?.role === 'trader';
    const traderTier = profile?.trader_tier;
    const hasPaidTier = traderTier === 'pro' || traderTier === 'national';

    // ── Step state ──
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);

    // ── Step 1: posts ──
    const [posts, setPosts] = useState<Post[]>([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [businessId, setBusinessId] = useState<string | null>(null);

    // ── Step 2: placements ──
    const [selectedPlacements, setSelectedPlacements] = useState<string[]>([]);

    // ── Step 3: duration & radius ──
    const [selectedDuration, setSelectedDuration] = useState<(typeof DURATIONS)[number]>(DURATIONS[0]);
    const [selectedRadius, setSelectedRadius] = useState<(typeof RADII)[number]>(RADII[0]);

    // ── Step 4: submit ──
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // ── Fetch trader's posts ──
    useEffect(() => {
        if (!isTrader || !profile?.id || !hasPaidTier) return;

        async function fetchPosts() {
            setPostsLoading(true);
            try {
                const supabase = getSupabaseClient();
                const { data: biz } = await supabase
                    .from('business_details')
                    .select('id')
                    .eq('profile_id', profile!.id)
                    .single();

                if (!biz) return;
                setBusinessId(biz.id);

                const { data } = await supabase
                    .from('posts')
                    .select('*')
                    .eq('business_id', biz.id)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (data) setPosts(data as Post[]);
            } catch (err) {
                console.warn('Failed to fetch posts:', err);
            } finally {
                setPostsLoading(false);
            }
        }

        fetchPosts();
    }, [isTrader, profile?.id, hasPaidTier]);

    // ── Price calculation ──
    const totalPrice = useMemo(() => {
        const placementCount = selectedPlacements.length;
        if (placementCount === 0) return 0;
        const bundleMultiplier = BUNDLE_MULTIPLIERS[placementCount] ?? 2;
        const baseCost = selectedDuration.dailyRate * selectedDuration.days;
        return Math.round(baseCost * bundleMultiplier * selectedRadius.multiplier);
    }, [selectedPlacements, selectedDuration, selectedRadius]);

    // ── Navigation ──
    const goNext = () => { setDirection(1); setStep(s => Math.min(s + 1, 3)); };
    const goBack = () => { setDirection(-1); setStep(s => Math.max(s - 1, 0)); };

    const canProceed = (): boolean => {
        if (step === 0) return selectedPostId !== null;
        if (step === 1) return selectedPlacements.length > 0;
        if (step === 2) return true;
        return true;
    };

    // ── Placement toggle ──
    const togglePlacement = (id: string) => {
        setSelectedPlacements(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    // ── Radius tier check ──
    const canSelectRadius = (minTier: 'pro' | 'national') => {
        if (traderTier === 'national') return true;
        if (traderTier === 'pro' && minTier === 'pro') return true;
        return false;
    };

    // ── Submit ──
    const handleSubmit = async () => {
        if (!selectedPostId || !businessId || selectedPlacements.length === 0) return;
        setIsSubmitting(true);

        try {
            const supabase = getSupabaseClient();
            const now = new Date();
            const endsAt = new Date(now);
            endsAt.setDate(endsAt.getDate() + selectedDuration.days);

            const isNationwide = 'isNationwide' in selectedRadius && selectedRadius.isNationwide === true;

            await supabase.from('ads').insert({
                business_id: businessId,
                post_id: selectedPostId,
                placements: selectedPlacements,
                radius_km: selectedRadius.km,
                center_lat: coordinates?.latitude ?? -1.9441,
                center_lng: coordinates?.longitude ?? 30.0619,
                is_nationwide: isNationwide,
                starts_at: now.toISOString(),
                ends_at: endsAt.toISOString(),
                daily_rate: selectedDuration.dailyRate,
                total_cost: totalPrice,
                status: 'pending',
                impressions: 0,
                clicks: 0,
            });

            setIsSubmitted(true);
        } catch (err) {
            console.error('Failed to create ad:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Gate: not a trader ──
    if (!authLoading && !isTrader) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center"
                >
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                        <Lock className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="font-display text-2xl font-bold text-foreground mb-2">Ads for Traders</h1>
                    <p className="text-muted-foreground max-w-xs mb-6">
                        Ad creation is available for trader accounts only.
                    </p>
                    <Link
                        href={ROUTES.FEED}
                        className="bg-primary text-primary-foreground font-display font-bold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
                    >
                        Return to Feed
                    </Link>
                </motion.div>
            </div>
        );
    }

    // ── Gate: free tier ──
    if (!authLoading && isTrader && !hasPaidTier) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="glass-card rounded-2xl border border-border/50 p-8 sm:p-10 max-w-md w-full flex flex-col items-center"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6"
                    >
                        <Megaphone className="w-10 h-10 text-primary" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.25 }}
                        className="font-display text-2xl sm:text-3xl font-black text-foreground tracking-tight mb-3"
                    >
                        Unlock Ads
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.35 }}
                        className="text-muted-foreground text-sm leading-relaxed max-w-sm mb-8"
                    >
                        Upgrade to Pro or National to promote your posts — reach more customers with targeted local and nationwide ads.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.45 }}
                    >
                        <Link
                            href={ROUTES.PREMIUM}
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-display font-bold px-8 py-3.5 rounded-full hover:opacity-90 transition-opacity text-sm"
                        >
                            <Crown className="w-4 h-4" />
                            Upgrade Now
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

    // ── Success state ──
    if (isSubmitted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="glass-card rounded-2xl border border-border/50 p-8 sm:p-10 max-w-md w-full flex flex-col items-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-6"
                    >
                        <CheckCircle2 className="w-10 h-10 text-green-400" />
                    </motion.div>

                    <h1 className="font-display text-2xl font-black text-foreground tracking-tight mb-3">
                        Ad Submitted!
                    </h1>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mb-8">
                        Your ad has been submitted! Contact us on WhatsApp to activate payment.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <a
                            href="https://wa.me/250780000000?text=Hi%2C%20I%20want%20to%20activate%20my%20ad%20on%20MarketPLC"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors"
                        >
                            WhatsApp Us
                        </a>
                        <Link
                            href={ROUTES.FEED}
                            className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary border border-border/50 text-foreground text-sm font-bold hover:bg-secondary/80 transition-colors"
                        >
                            Back to Feed
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ── Main ad creation flow ──
    const selectedPost = posts.find(p => p.id === selectedPostId);

    return (
        <div className="min-h-screen bg-background text-foreground pb-32 md:pb-12">
            <main className="max-w-2xl mx-auto px-4 sm:px-6 py-24 md:py-12">

                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
                        <Megaphone className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">Create Ad</span>
                    </div>
                    <h1 className="font-display text-3xl font-black text-foreground tracking-tight mb-1">
                        Promote a Post
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Boost your reach with targeted ads across MarketPLC.
                    </p>
                </motion.header>

                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-8">
                    {STEP_LABELS.map((label, i) => (
                        <div key={label} className="flex items-center gap-2 flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                                i < step
                                    ? 'bg-primary text-primary-foreground'
                                    : i === step
                                        ? 'bg-primary/20 text-primary border border-primary/40'
                                        : 'bg-secondary text-muted-foreground border border-border/30'
                            }`}>
                                {i < step ? <Check className="w-4 h-4" /> : i + 1}
                            </div>
                            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {label}
                            </span>
                            {i < STEP_LABELS.length - 1 && (
                                <div className={`flex-1 h-px ${i < step ? 'bg-primary/40' : 'bg-border/30'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step content */}
                <div className="relative overflow-hidden">
                    <AnimatePresence mode="wait" custom={direction}>
                        {/* ── Step 0: Select Post ── */}
                        {step === 0 && (
                            <motion.div
                                key="step-0"
                                custom={direction}
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                            >
                                <div className="glass-card rounded-2xl border border-border/50 p-6">
                                    <h2 className="font-display text-lg font-bold text-foreground mb-1">Select a Post to Promote</h2>
                                    <p className="text-xs text-muted-foreground mb-5">Choose one of your posts to turn into an ad.</p>

                                    {postsLoading ? (
                                        <div className="space-y-3">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-16 bg-secondary/50 rounded-xl animate-pulse" />
                                            ))}
                                        </div>
                                    ) : posts.length === 0 ? (
                                        <div className="text-center py-10">
                                            <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                                            <p className="text-muted-foreground text-sm">No posts found. Create a post first!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                                            {posts.map(post => (
                                                <button
                                                    key={post.id}
                                                    onClick={() => setSelectedPostId(post.id)}
                                                    className={`w-full text-left p-4 rounded-xl flex items-center gap-4 border transition-all ${
                                                        selectedPostId === post.id
                                                            ? 'bg-primary/10 border-primary/40 shadow-sm'
                                                            : 'bg-secondary/40 border-border/20 hover:bg-secondary/70'
                                                    }`}
                                                >
                                                    {/* Thumbnail */}
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-secondary">
                                                        {post.image_url ? (
                                                            <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Megaphone className="w-5 h-5 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-foreground truncate">
                                                            {post.content?.substring(0, 60)}{(post.content?.length ?? 0) > 60 ? '…' : ''}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    {/* Check */}
                                                    {selectedPostId === post.id && (
                                                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                                                            <Check className="w-3.5 h-3.5 text-primary-foreground" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ── Step 1: Choose Placements ── */}
                        {step === 1 && (
                            <motion.div
                                key="step-1"
                                custom={direction}
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                            >
                                <div className="glass-card rounded-2xl border border-border/50 p-6">
                                    <h2 className="font-display text-lg font-bold text-foreground mb-1">Choose Placements</h2>
                                    <p className="text-xs text-muted-foreground mb-5">Select where your ad will appear. Bundle for better pricing.</p>

                                    <div className="space-y-3 mb-6">
                                        {PLACEMENTS.map(placement => {
                                            const isSelected = selectedPlacements.includes(placement.id);
                                            return (
                                                <button
                                                    key={placement.id}
                                                    onClick={() => togglePlacement(placement.id)}
                                                    className={`w-full text-left p-4 rounded-xl flex items-center gap-4 border transition-all ${
                                                        isSelected
                                                            ? 'bg-primary/10 border-primary/40 shadow-sm'
                                                            : 'bg-secondary/40 border-border/20 hover:bg-secondary/70'
                                                    }`}
                                                >
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                        isSelected ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                                                    }`}>
                                                        {placement.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-foreground">{placement.label}</p>
                                                        <p className="text-xs text-muted-foreground">{placement.desc}</p>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                                        isSelected
                                                            ? 'bg-primary border-primary'
                                                            : 'border-border/50'
                                                    }`}>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Bundle pricing info */}
                                    <div className="bg-secondary/50 rounded-xl p-4 border border-border/20">
                                        <p className="text-xs font-bold text-foreground mb-2">Bundle Pricing</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {Object.entries(BUNDLE_MULTIPLIERS).map(([count, mult]) => (
                                                <div
                                                    key={count}
                                                    className={`text-center p-2 rounded-lg text-xs ${
                                                        selectedPlacements.length === Number(count)
                                                            ? 'bg-primary/15 text-primary border border-primary/30'
                                                            : 'bg-secondary/60 text-muted-foreground'
                                                    }`}
                                                >
                                                    <p className="font-bold">{count}×</p>
                                                    <p className="text-[10px]">{mult}× price</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── Step 2: Duration & Radius ── */}
                        {step === 2 && (
                            <motion.div
                                key="step-2"
                                custom={direction}
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                            >
                                <div className="space-y-5">
                                    {/* Duration */}
                                    <div className="glass-card rounded-2xl border border-border/50 p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Clock className="w-5 h-5 text-primary" />
                                            <h2 className="font-display text-lg font-bold text-foreground">Duration</h2>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {DURATIONS.map(dur => (
                                                <button
                                                    key={dur.days}
                                                    onClick={() => setSelectedDuration(dur)}
                                                    className={`p-4 rounded-xl border text-left transition-all ${
                                                        selectedDuration.days === dur.days
                                                            ? 'bg-primary/10 border-primary/40 shadow-sm'
                                                            : 'bg-secondary/40 border-border/20 hover:bg-secondary/70'
                                                    }`}
                                                >
                                                    <p className="font-bold text-sm text-foreground">{dur.label}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{dur.dailyRate.toLocaleString()} RWF/day</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Radius */}
                                    <div className="glass-card rounded-2xl border border-border/50 p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <MapPin className="w-5 h-5 text-primary" />
                                            <h2 className="font-display text-lg font-bold text-foreground">Radius</h2>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {RADII.map(rad => {
                                                const allowed = canSelectRadius(rad.minTier);
                                                return (
                                                    <button
                                                        key={rad.label}
                                                        onClick={() => allowed && setSelectedRadius(rad)}
                                                        disabled={!allowed}
                                                        className={`p-4 rounded-xl border text-left transition-all ${
                                                            !allowed
                                                                ? 'opacity-40 cursor-not-allowed bg-secondary/20 border-border/10'
                                                                : selectedRadius.label === rad.label
                                                                    ? 'bg-primary/10 border-primary/40 shadow-sm'
                                                                    : 'bg-secondary/40 border-border/20 hover:bg-secondary/70'
                                                        }`}
                                                    >
                                                        <p className="font-bold text-sm text-foreground">{rad.label}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {rad.multiplier}× · {rad.desc}
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Live price */}
                                    <div className="glass-card rounded-2xl border border-primary/30 p-5 bg-primary/5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium">Estimated Total</p>
                                                <p className="font-display text-2xl font-black text-foreground tracking-tight">
                                                    {totalPrice.toLocaleString()} <span className="text-sm font-bold text-muted-foreground">RWF</span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground">{selectedDuration.label} · {selectedRadius.label}</p>
                                                <p className="text-xs text-muted-foreground">{selectedPlacements.length} placement{selectedPlacements.length !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── Step 3: Review & Submit ── */}
                        {step === 3 && (
                            <motion.div
                                key="step-3"
                                custom={direction}
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                            >
                                <div className="glass-card rounded-2xl border border-border/50 p-6">
                                    <h2 className="font-display text-lg font-bold text-foreground mb-5">Review Your Ad</h2>

                                    <div className="space-y-4 mb-6">
                                        {/* Post */}
                                        <div className="bg-secondary/40 rounded-xl p-4 border border-border/20">
                                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Post</p>
                                            <p className="text-sm text-foreground font-medium truncate">
                                                {selectedPost?.content?.substring(0, 80)}{(selectedPost?.content?.length ?? 0) > 80 ? '…' : ''}
                                            </p>
                                        </div>

                                        {/* Placements */}
                                        <div className="bg-secondary/40 rounded-xl p-4 border border-border/20">
                                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Placements</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedPlacements.map(id => {
                                                    const p = PLACEMENTS.find(pl => pl.id === id);
                                                    return (
                                                        <span
                                                            key={id}
                                                            className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-medium"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                            {p?.label}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Duration & Radius */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-secondary/40 rounded-xl p-4 border border-border/20">
                                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Duration</p>
                                                <p className="text-sm text-foreground font-bold">{selectedDuration.label}</p>
                                                <p className="text-xs text-muted-foreground">{selectedDuration.dailyRate.toLocaleString()} RWF/day</p>
                                            </div>
                                            <div className="bg-secondary/40 rounded-xl p-4 border border-border/20">
                                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Radius</p>
                                                <p className="text-sm text-foreground font-bold">{selectedRadius.label}</p>
                                                <p className="text-xs text-muted-foreground">{selectedRadius.multiplier}× multiplier</p>
                                            </div>
                                        </div>

                                        {/* Total */}
                                        <div className="bg-primary/5 rounded-xl p-5 border border-primary/30">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-bold text-foreground">Total Cost</p>
                                                <p className="font-display text-2xl font-black text-foreground tracking-tight">
                                                    {totalPrice.toLocaleString()} <span className="text-sm font-bold text-muted-foreground">RWF</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Creating Ad...
                                            </>
                                        ) : (
                                            <>
                                                <Megaphone className="w-4 h-4" />
                                                Create Ad
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center justify-between mt-6">
                    <button
                        onClick={goBack}
                        disabled={step === 0}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            step === 0
                                ? 'opacity-0 pointer-events-none'
                                : 'bg-secondary border border-border/50 text-foreground hover:bg-secondary/80'
                        }`}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    {step < 3 && (
                        <button
                            onClick={goNext}
                            disabled={!canProceed()}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>

            </main>
        </div>
    );
}
