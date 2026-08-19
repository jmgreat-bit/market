'use client';

import { Suspense, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { TicketCategory, ReferenceType } from '@/types';
import { useSearchParams } from 'next/navigation';
import {
    HelpCircle, Bug, Flag, ChevronRight, CheckCircle,
    Loader2, ArrowLeft, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

const CATEGORIES: { id: TicketCategory; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
        id: 'help',
        label: 'Help & How-To',
        desc: 'Questions about features or how to use the app',
        icon: <HelpCircle className="w-6 h-6" />,
        color: 'text-blue-400 bg-blue-400/10 border-blue-400/30 group-hover:border-blue-400/60',
    },
    {
        id: 'software',
        label: 'Software Bug',
        desc: 'Something is broken or not working as expected',
        icon: <Bug className="w-6 h-6" />,
        color: 'text-amber-400 bg-amber-400/10 border-amber-400/30 group-hover:border-amber-400/60',
    },
    {
        id: 'report',
        label: 'Report Content',
        desc: 'Report a post, comment, or user for review',
        icon: <Flag className="w-6 h-6" />,
        color: 'text-red-400 bg-red-400/10 border-red-400/30 group-hover:border-red-400/60',
    },
];

const REFERENCE_TYPES: { id: ReferenceType; label: string }[] = [
    { id: 'post', label: 'A Post' },
    { id: 'comment', label: 'A Comment' },
    { id: 'user', label: 'A User / Account' },
];

type Step = 'category' | 'form' | 'success';

function SupportContent() {
    const { user } = useUser();
    const searchParams = useSearchParams();
    
    const [step, setStep] = useState<Step>('category');
    const [category, setCategory] = useState<TicketCategory | null>(null);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [referenceType, setReferenceType] = useState<ReferenceType>('post');
    const [referenceId, setReferenceId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const cat = searchParams?.get('category') as TicketCategory;
        const refType = searchParams?.get('reference_type') as ReferenceType;
        const refId = searchParams?.get('reference_id');

        if (cat && CATEGORIES.find(c => c.id === cat)) {
            setCategory(cat);
            setStep('form');
            if (refType) setReferenceType(refType);
            if (refId) setReferenceId(refId);
        }
    }, [searchParams]);

    const selectedCategory = CATEGORIES.find(c => c.id === category);

    const handleSelectCategory = (cat: TicketCategory) => {
        setCategory(cat);
        setStep('form');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !subject.trim() || !message.trim()) return;
        setError(null);
        setIsSubmitting(true);

        try {
            const supabase = createClient();
            const { error: insertError } = await supabase.from('support_tickets').insert({
                user_id: user?.id ?? null,
                category,
                subject: subject.trim(),
                message: message.trim(),
                reference_type: category === 'report' ? referenceType : null,
                reference_id: category === 'report' && referenceId.trim() ? referenceId.trim() : null,
            });
            if (insertError) throw new Error(insertError.message);
            setStep('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setStep('category');
        setCategory(null);
        setSubject('');
        setMessage('');
        setReferenceId('');
        setError(null);
    };

    return (
        <div className="max-w-xl mx-auto px-6 pt-6 space-y-8">
            {/* Top Navigation Bar */}
            <div className="flex items-center mb-6">
                {step === 'category' || step === 'success' ? (
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-foreground text-sm font-bold transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>
                ) : null}
            </div>

            {/* Header */}
            <div className="flex items-center gap-4">
                {step === 'form' && (
                    <button onClick={() => setStep('category')} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                )}
                <div>
                    <h1 className="font-display text-3xl font-black tracking-tight text-white">
                        {step === 'success' ? 'Ticket Submitted' : 'Help & Support'}
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        {step === 'category' && 'What can we help you with?'}
                        {step === 'form' && selectedCategory?.label}
                        {step === 'success' && "We'll look into it shortly"}
                    </p>
                </div>
            </div>

            {/* Step: Category selection */}
            {step === 'category' && (
                <div className="space-y-3">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleSelectCategory(cat.id)}
                            className="group w-full flex items-center gap-4 p-5 bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl hover:border-slate-500 transition-all text-left"
                        >
                            <div className={`p-3 rounded-xl border transition-colors shrink-0 ${cat.color}`}>
                                {cat.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-display font-bold text-base text-white">{cat.label}</p>
                                <p className="text-sm text-slate-400 mt-0.5">{cat.desc}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 group-hover:text-white transition-all shrink-0" />
                        </button>
                    ))}
                </div>
            )}

            {/* Step: Form */}
            {step === 'form' && category && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Report-specific: reference type */}
                    {category === 'report' && (
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                What are you reporting?
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {REFERENCE_TYPES.map((rt) => (
                                    <button
                                        key={rt.id}
                                        type="button"
                                        onClick={() => setReferenceType(rt.id)}
                                        className={`py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${referenceType === rt.id
                                            ? 'bg-blue-600 text-white border-blue-500'
                                            : 'bg-[#0f172a] border-slate-800 text-slate-400 hover:border-slate-600'
                                            }`}
                                    >
                                        {rt.label}
                                    </button>
                                ))}
                            </div>
                            {/* Reference ID Input / Display */}
                            {searchParams?.get('reference_id') ? (
                                <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-sm text-blue-400 font-medium flex items-center justify-between">
                                    <span>
                                        {referenceType === 'user' 
                                            ? `Reporting User: @${referenceId}` 
                                            : `Attached ${referenceType} securely`}
                                    </span>
                                    <CheckCircle className="w-4 h-4 text-blue-500" />
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    value={referenceId}
                                    onChange={(e) => setReferenceId(e.target.value)}
                                    placeholder={`Username or link to the ${referenceType} (optional)`}
                                    className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            )}
                        </div>
                    )}

                    {/* Subject */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Subject
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                            maxLength={120}
                            placeholder="Brief summary of your issue"
                            className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* Message */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Details
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            rows={6}
                            maxLength={2000}
                            placeholder={
                                category === 'help'
                                    ? 'Describe what you need help with...'
                                    : category === 'software'
                                        ? 'Describe the bug. What happened? What did you expect?'
                                        : 'Describe what you are reporting and why...'
                            }
                            className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                        />
                        <p className="text-right text-[10px] text-slate-500">{message.length}/2000</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting || !subject.trim() || !message.trim()}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                        ) : (
                            'Submit Ticket'
                        )}
                    </button>
                </form>
            )}

            {/* Step: Success */}
            {step === 'success' && (
                <div className="flex flex-col items-center text-center gap-6 pt-8">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="font-display font-black text-2xl text-white">We got your message!</h2>
                        <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">
                            Your support ticket has been submitted. Our team will review it and get back to you soon.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 w-full">
                        <button
                            onClick={handleReset}
                            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
                        >
                            Submit Another Ticket
                        </button>
                        <Link
                            href="/feed"
                            className="w-full py-4 bg-transparent border border-slate-700 text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-center"
                        >
                            Back to Feed
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-background pb-32">
            <Suspense fallback={<div className="text-center pt-20 text-slate-500">Loading support...</div>}>
                <SupportContent />
            </Suspense>
        </div>
    );
}
