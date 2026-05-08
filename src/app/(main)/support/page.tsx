'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { TicketCategory, ReferenceType } from '@/types';
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

export default function SupportPage() {
    const { user } = useUser();
    const [step, setStep] = useState<Step>('category');
    const [category, setCategory] = useState<TicketCategory | null>(null);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [referenceType, setReferenceType] = useState<ReferenceType>('post');
    const [referenceId, setReferenceId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        <div className="min-h-screen bg-surface text-foreground pb-32">
            <div className="max-w-xl mx-auto px-6 pt-10 space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    {step === 'form' && (
                        <button onClick={() => setStep('category')} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </button>
                    )}
                    <div>
                        <h1 className="font-headline text-2xl font-black tracking-tight">
                            {step === 'success' ? 'Ticket Submitted' : 'Help & Support'}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
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
                                className="group w-full flex items-center gap-4 p-5 bg-card border border-border/50 rounded-2xl hover:border-primary/40 active:scale-[0.98] transition-all text-left"
                            >
                                <div className={`p-3 rounded-xl border transition-colors shrink-0 ${cat.color}`}>
                                    {cat.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-headline font-bold text-sm text-foreground">{cat.label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{cat.desc}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all shrink-0" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Step: Form */}
                {step === 'form' && category && (
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Report-specific: reference type */}
                        {category === 'report' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    What are you reporting?
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {REFERENCE_TYPES.map((rt) => (
                                        <button
                                            key={rt.id}
                                            type="button"
                                            onClick={() => setReferenceType(rt.id)}
                                            className={`py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${referenceType === rt.id
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-secondary border-border/50 text-muted-foreground hover:border-primary/40'
                                                }`}
                                        >
                                            {rt.label}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={referenceId}
                                    onChange={(e) => setReferenceId(e.target.value)}
                                    placeholder={`ID or username of the ${referenceType} (optional)`}
                                    className="w-full bg-secondary border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                                />
                            </div>
                        )}

                        {/* Subject */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                Subject
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required
                                maxLength={120}
                                placeholder="Brief summary of your issue"
                                className="w-full bg-secondary border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                            />
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
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
                                className="w-full bg-secondary border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors resize-none"
                            />
                            <p className="text-right text-[10px] text-muted-foreground">{message.length}/2000</p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !subject.trim() || !message.trim()}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground font-headline font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-headline font-black text-xl text-foreground">We got your message!</h2>
                            <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
                                Your support ticket has been submitted. Our team will review it and get back to you soon.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={handleReset}
                                className="w-full py-4 bg-primary text-primary-foreground font-headline font-bold rounded-xl hover:opacity-90 transition-all"
                            >
                                Submit Another Ticket
                            </button>
                            <Link
                                href="/feed"
                                className="w-full py-4 bg-secondary border border-border/50 text-foreground font-headline font-bold rounded-xl hover:border-primary/40 transition-all text-center"
                            >
                                Back to Feed
                            </Link>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
