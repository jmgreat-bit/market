'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Crown, BadgeCheck, Sparkles, Zap, Globe,
    BarChart3, MessageSquare, Target, Bot,
    X, Check, ArrowRight
} from 'lucide-react';
import { TraderTier, AiPackage } from '@/types';

// ── Tier data ──────────────────────────────────────────
const TIERS: {
    id: TraderTier;
    name: string;
    price: string;
    period: string;
    color: string;
    accentBorder: string;
    accentBg: string;
    accentText: string;
    highlight?: string;
    icon: React.ReactNode;
    features: { icon: React.ReactNode; text: string }[];
}[] = [
    {
        id: 'free',
        name: 'Free Trader',
        price: 'Free',
        period: '',
        color: 'var(--muted-foreground)',
        accentBorder: 'border-border/50',
        accentBg: 'bg-secondary/40',
        accentText: 'text-muted-foreground',
        icon: <Zap className="w-6 h-6" />,
        features: [
            { icon: <Check className="w-4 h-4" />, text: 'Basic posting' },
            { icon: <Check className="w-4 h-4" />, text: 'Appear on map (1–2 km)' },
            { icon: <Check className="w-4 h-4" />, text: 'Basic profile' },
        ],
    },
    {
        id: 'pro',
        name: 'Pro Trader',
        price: '3,000',
        period: 'RWF / month',
        color: '#3b82f6',
        accentBorder: 'border-blue-500/40',
        accentBg: 'bg-blue-500/10',
        accentText: 'text-blue-400',
        icon: <BadgeCheck className="w-6 h-6" style={{ color: '#3b82f6' }} />,
        features: [
            { icon: <BadgeCheck className="w-4 h-4 text-blue-400" />, text: 'Blue verified badge everywhere' },
            { icon: <BarChart3 className="w-4 h-4 text-blue-400" />, text: 'Full analytics dashboard' },
            { icon: <Sparkles className="w-4 h-4 text-blue-400" />, text: '2× feed visibility nearby' },
            { icon: <MessageSquare className="w-4 h-4 text-blue-400" />, text: 'Comments float to top' },
            { icon: <Target className="w-4 h-4 text-blue-400" />, text: 'Run local ads (up to 4 km)' },
        ],
    },
    {
        id: 'national',
        name: 'National Trader',
        price: '35,000',
        period: 'RWF / month',
        color: '#f59e0b',
        accentBorder: 'border-amber-500/40',
        accentBg: 'bg-amber-500/10',
        accentText: 'text-amber-400',
        highlight: 'Best Value',
        icon: <Crown className="w-6 h-6" style={{ color: '#f59e0b' }} />,
        features: [
            { icon: <BadgeCheck className="w-4 h-4 text-amber-400" />, text: 'Gold verified badge' },
            { icon: <Check className="w-4 h-4 text-amber-400" />, text: 'Everything in Pro' },
            { icon: <Globe className="w-4 h-4 text-amber-400" />, text: 'Posts shown across all of Rwanda' },
            { icon: <Target className="w-4 h-4 text-amber-400" />, text: 'Run nationwide ads' },
            { icon: <Sparkles className="w-4 h-4 text-amber-400" />, text: 'City label on all posts' },
        ],
    },
];

const AI_PACKAGES: {
    id: AiPackage;
    name: string;
    prompts: number;
    price: string;
}[] = [
    { id: 'starter', name: 'Starter', prompts: 7, price: '500' },
    { id: 'standard', name: 'Standard', prompts: 20, price: '1,000' },
    { id: 'power', name: 'Power', prompts: 100, price: '4,000' },
];

// ── Animation variants ─────────────────────────────────
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' as const } },
    exit: { opacity: 0, scale: 0.92, transition: { duration: 0.2 } },
};

// ── Page component ──────────────────────────────────────
export default function PremiumPage() {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('');

    const handleSelect = (planName: string) => {
        setSelectedPlan(planName);
        setModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-surface text-foreground pb-32 md:pb-12">
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 py-24 md:py-12">

                {/* ── Header ────────────────────────────── */}
                <motion.header
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5">
                        <Crown className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">MarketPLC Premium</span>
                    </div>
                    <h1 className="font-headline text-3xl sm:text-4xl font-black tracking-tight mb-3">
                        Upgrade Your Trade Game
                    </h1>
                    <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
                        Stand out on the map, reach more customers, and grow your business with powerful premium tools built for Rwandan traders.
                    </p>
                </motion.header>

                {/* ── Tier Cards ─────────────────────────── */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16"
                >
                    {TIERS.map((tier) => (
                        <motion.div
                            key={tier.id}
                            variants={cardVariants}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            className={`relative glass-card rounded-2xl border ${tier.accentBorder} p-6 flex flex-col transition-shadow hover:shadow-lg hover:shadow-black/10`}
                        >
                            {/* Best-value ribbon */}
                            {tier.highlight && (
                                <div
                                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-black"
                                    style={{ background: tier.color }}
                                >
                                    {tier.highlight}
                                </div>
                            )}

                            {/* Icon + Name */}
                            <div className="flex items-center gap-3 mb-5 mt-1">
                                <div
                                    className={`w-11 h-11 rounded-xl ${tier.accentBg} flex items-center justify-center`}
                                >
                                    {tier.icon}
                                </div>
                                <div>
                                    <h3 className="font-headline font-bold text-base tracking-tight">{tier.name}</h3>
                                    {tier.id !== 'free' && (
                                        <p className={`text-[10px] uppercase tracking-widest ${tier.accentText} font-bold`}>Verified</p>
                                    )}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="mb-5">
                                <span className="font-headline text-3xl font-black tracking-tight">{tier.price}</span>
                                {tier.period && (
                                    <span className="text-sm text-muted-foreground ml-1.5">{tier.period}</span>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 flex-1 mb-6">
                                {tier.features.map((feat, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-sm">
                                        <span className="shrink-0 mt-0.5">{feat.icon}</span>
                                        <span className="text-foreground/80">{feat.text}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            {tier.id === 'free' ? (
                                <button
                                    disabled
                                    className="w-full py-3 rounded-xl border border-white/15 text-sm font-bold text-muted-foreground bg-white/10 cursor-default"
                                >
                                    Current Plan
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleSelect(tier.name)}
                                    className="group w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                                    style={{
                                        background: tier.color,
                                        color: '#000',
                                    }}
                                >
                                    Subscribe
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}
                        </motion.div>
                    ))}
                </motion.div>

                {/* ── AI Discovery Credits ────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 mb-4">
                            <Bot className="w-4 h-4 text-purple-400" />
                            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">AI Discovery</span>
                        </div>
                        <h2 className="font-headline text-2xl font-black tracking-tight mb-2">AI Discovery Credits</h2>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto">
                            Let customers find you through natural language search — powered by AI that understands what people really need.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                        {AI_PACKAGES.map((pkg, i) => (
                            <motion.div
                                key={pkg.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                                className="glass-card rounded-2xl border border-purple-500/20 p-5 flex flex-col items-center text-center hover:shadow-lg hover:shadow-purple-500/5 transition-shadow"
                            >
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                </div>
                                <h4 className="font-headline font-bold text-sm mb-1">{pkg.name}</h4>
                                <p className="text-muted-foreground text-xs mb-4">{pkg.prompts} prompts</p>
                                <p className="font-headline text-2xl font-black tracking-tight mb-1">{pkg.price}</p>
                                <p className="text-muted-foreground text-xs mb-5">RWF</p>
                                <button
                                    onClick={() => handleSelect(`AI ${pkg.name}`)}
                                    className="w-full py-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-sm font-bold hover:bg-purple-500/25 transition-colors flex items-center justify-center gap-2 group"
                                >
                                    Get Started
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

            </main>

            {/* ── Payment Modal ───────────────────────── */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setModalOpen(false)}
                    >
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="glass-card rounded-2xl border border-border/50 p-8 max-w-sm w-full text-center relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setModalOpen(false)}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary-foreground/10 transition-colors"
                            >
                                <X className="w-4 h-4 text-muted-foreground" />
                            </button>

                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                                <Crown className="w-7 h-7 text-primary" />
                            </div>

                            <h3 className="font-headline text-xl font-black tracking-tight mb-2">
                                {selectedPlan}
                            </h3>
                            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                                Payment integration coming soon — contact us on WhatsApp to activate your plan today.
                            </p>

                            <a
                                href="https://wa.me/250780000000?text=Hi%2C%20I%20want%20to%20activate%20my%20MarketPLC%20plan"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Contact on WhatsApp
                            </a>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
