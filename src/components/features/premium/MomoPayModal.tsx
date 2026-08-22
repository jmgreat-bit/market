'use client';

import { useState, useEffect } from 'react';
import { 
    Loader2, 
    Phone, 
    ShieldCheck, 
    X, 
    Gift, 
    Sparkles, 
    ArrowRight, 
    CreditCard, 
    AlertCircle, 
    CheckCircle2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/useUser';

interface MomoPayModalProps {
    isOpen: boolean;
    onClose: () => void;
    tier: string;
    amount: number;
    onSuccess: () => void;
}

export function MomoPayModal({ isOpen, onClose, tier, amount, onSuccess }: MomoPayModalProps) {
    const { refreshProfile } = useUser();
    const [activeTab, setActiveTab] = useState<'promo' | 'momo'>('promo');
    
    // Promo State
    const [promoCode, setPromoCode] = useState('');
    const [isSubmittingPromo, setIsSubmittingPromo] = useState(false);
    const [promoSuccessMsg, setPromoSuccessMsg] = useState<string | null>(null);
    const [promoErrorMsg, setPromoErrorMsg] = useState<string | null>(null);

    // MoMo State
    const [phone, setPhone] = useState('');
    const [momoStep, setMomoStep] = useState<'input' | 'initiating' | 'waiting' | 'success' | 'error'>('input');
    const [referenceId, setReferenceId] = useState<string | null>(null);
    const [momoErrorMsg, setMomoErrorMsg] = useState('');

    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        if (momoStep === 'waiting' && referenceId) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/momo/status?id=${referenceId}`);
                    const data = await res.json();
                    
                    if (data.status === 'completed') {
                        setMomoStep('success');
                        clearInterval(interval);
                        await refreshProfile();
                        setTimeout(() => {
                            onSuccess();
                        }, 2000);
                    } else if (data.status === 'failed') {
                        setMomoErrorMsg('Payment failed or was cancelled.');
                        setMomoStep('error');
                        clearInterval(interval);
                    }
                } catch (err) {
                    console.error("Polling error", err);
                }
            }, 3000);
        }

        return () => clearInterval(interval);
    }, [momoStep, referenceId, onSuccess, refreshProfile]);

    if (!isOpen) return null;

    const handleApplyPromo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promoCode.trim()) return;

        setIsSubmittingPromo(true);
        setPromoErrorMsg(null);
        setPromoSuccessMsg(null);

        try {
            const res = await fetch('/api/promo/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: promoCode.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to redeem promo code.');
            }

            setPromoSuccessMsg(data.message || 'Promo code applied successfully!');
            await refreshProfile();
            setTimeout(() => {
                onSuccess();
            }, 2500);
        } catch (err: any) {
            setPromoErrorMsg(err.message || 'An error occurred while redeeming.');
        } finally {
            setIsSubmittingPromo(false);
        }
    };

    const handlePay = async () => {
        if (!phone || phone.length < 9) {
            setMomoErrorMsg('Please enter a valid phone number');
            setMomoStep('error');
            return;
        }

        try {
            setMomoStep('initiating');
            const res = await fetch('/api/momo/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, amount, tier })
            });
            
            const data = await res.json();
            
            if (res.ok && data.referenceId) {
                setReferenceId(data.referenceId);
                setMomoStep('waiting');
            } else {
                throw new Error(data.error || 'Failed to initiate payment');
            }
        } catch (err: any) {
            setMomoErrorMsg(err.message);
            setMomoStep('error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#0f172a] w-full max-w-md rounded-3xl shadow-2xl border border-slate-700/60 overflow-hidden relative">
                
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-full transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Banner */}
                <div className="p-6 border-b border-slate-800 bg-gradient-to-br from-blue-900/30 via-slate-900 to-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="font-display font-black text-xl text-white tracking-tight">
                                Upgrade to {tier.toUpperCase()}
                            </h2>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                Regular Price: <span className="text-white font-bold">{amount.toLocaleString()} RWF</span> / month
                            </p>
                        </div>
                    </div>

                    {/* Method Selector */}
                    <div className="grid grid-cols-2 gap-2 mt-5 p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setActiveTab('promo')}
                            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'promo' 
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' 
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Gift className="w-3.5 h-3.5" />
                            Promo / Beta Code
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('momo')}
                            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'momo' 
                                    ? 'bg-amber-500 text-black shadow-md' 
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Phone className="w-3.5 h-3.5" />
                            MTN MoMo
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* TAB 1: PROMO CODE REDEMPTION */}
                    {activeTab === 'promo' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
                                <p className="text-xs text-cyan-300 font-semibold flex items-center gap-1.5">
                                    <Gift className="w-4 h-4 text-cyan-400 shrink-0" />
                                    Early Bird & Community Access
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                    Got a launch voucher or VIP code from our team? Redeem it below for free, full-access Pro features.
                                </p>
                            </div>

                            {promoSuccessMsg ? (
                                <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
                                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-display font-bold text-lg text-white">Promo Activated!</h3>
                                    <p className="text-xs text-slate-300 max-w-xs">{promoSuccessMsg}</p>
                                </div>
                            ) : (
                                <form onSubmit={handleApplyPromo} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                            Enter Promo Code
                                        </label>
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                placeholder="e.g. LAUNCH2026"
                                                value={promoCode}
                                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white font-mono text-sm uppercase placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors tracking-widest font-bold"
                                            />
                                        </div>
                                    </div>

                                    {promoErrorMsg && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-400">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <span>{promoErrorMsg}</span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSubmittingPromo || !promoCode.trim()}
                                        className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {isSubmittingPromo ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Verifying Code...</>
                                        ) : (
                                            <>Apply Promo Code <ArrowRight className="w-4 h-4" /></>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* TAB 2: MOBILE MONEY PAYMENT */}
                    {activeTab === 'momo' && (
                        <div>
                            {/* Sandbox / Coming Soon Alert */}
                            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-xs text-amber-300">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold">Gateway Notice:</span> Direct MoMo payments are in sandbox/test mode. Use a <button type="button" onClick={() => setActiveTab('promo')} className="underline font-bold text-amber-200 hover:text-white">Promo Code</button> for free launch access.
                                </div>
                            </div>

                            {momoStep === 'input' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                            MTN Mobile Phone Number
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input 
                                                type="tel"
                                                placeholder="078..."
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-colors text-sm"
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handlePay} 
                                        className="w-full font-bold h-12 rounded-xl hover:opacity-90 transition-opacity cursor-pointer text-black"
                                        style={{ backgroundColor: '#ffcc00' }}
                                    >
                                        Pay {amount.toLocaleString()} RWF (Sandbox)
                                    </button>
                                </div>
                            )}

                            {momoStep === 'initiating' && (
                                <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                                    <Loader2 className="w-10 h-10 animate-spin text-[#ffcc00]" />
                                    <p className="font-medium text-white">Connecting to MTN...</p>
                                </div>
                            )}

                            {momoStep === 'waiting' && (
                                <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-16 h-16 relative">
                                        <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                                        <div className="absolute inset-0 rounded-full border-4 border-[#ffcc00] border-t-transparent animate-spin"></div>
                                        <Phone className="absolute inset-0 m-auto w-6 h-6 text-[#ffcc00]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-white mb-1">Check your phone!</p>
                                        <p className="text-xs text-slate-400">Please enter your MoMo PIN on the prompt sent to {phone}.</p>
                                    </div>
                                </div>
                            )}

                            {momoStep === 'success' && (
                                <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                        <ShieldCheck className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-white mb-1">Payment Successful!</p>
                                        <p className="text-xs text-slate-400">Your account has been upgraded.</p>
                                    </div>
                                </div>
                            )}

                            {momoStep === 'error' && (
                                <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                                        <X className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-white mb-1">Payment Failed</p>
                                        <p className="text-xs text-slate-400">{momoErrorMsg}</p>
                                    </div>
                                    <Button onClick={() => setMomoStep('input')} variant="outline" className="mt-2 text-white border-slate-700">
                                        Try Again
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
