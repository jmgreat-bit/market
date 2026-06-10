'use client';

import { useState, useEffect } from 'react';
import { Loader2, Phone, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MomoPayModalProps {
    isOpen: boolean;
    onClose: () => void;
    tier: string;
    amount: number;
    onSuccess: () => void;
}

export function MomoPayModal({ isOpen, onClose, tier, amount, onSuccess }: MomoPayModalProps) {
    const [phone, setPhone] = useState('');
    const [step, setStep] = useState<'input' | 'initiating' | 'waiting' | 'success' | 'error'>('input');
    const [referenceId, setReferenceId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        if (step === 'waiting' && referenceId) {
            // Poll for status every 3 seconds
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/momo/status?id=${referenceId}`);
                    const data = await res.json();
                    
                    if (data.status === 'completed') {
                        setStep('success');
                        clearInterval(interval);
                        setTimeout(() => {
                            onSuccess();
                        }, 2000);
                    } else if (data.status === 'failed') {
                        setErrorMsg('Payment failed or was cancelled.');
                        setStep('error');
                        clearInterval(interval);
                    }
                } catch (err) {
                    console.error("Polling error", err);
                }
            }, 3000);
        }

        return () => clearInterval(interval);
    }, [step, referenceId, onSuccess]);

    if (!isOpen) return null;

    const handlePay = async () => {
        if (!phone || phone.length < 9) {
            setErrorMsg('Please enter a valid phone number');
            setStep('error');
            return;
        }

        try {
            setStep('initiating');
            const res = await fetch('/api/momo/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, amount, tier })
            });
            
            const data = await res.json();
            
            if (res.ok && data.referenceId) {
                setReferenceId(data.referenceId);
                setStep('waiting');
            } else {
                throw new Error(data.error || 'Failed to initiate payment');
            }
        } catch (err: any) {
            setErrorMsg(err.message);
            setStep('error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border/50 overflow-hidden relative">
                
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-muted-foreground hover:bg-secondary rounded-full">
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-[#ffcc00] flex items-center justify-center">
                            <span className="font-bold text-black">MTN</span>
                        </div>
                        <div>
                            <h2 className="font-display font-bold text-lg text-foreground">Mobile Money Payment</h2>
                            <p className="text-sm text-muted-foreground">{amount.toLocaleString()} RWF for {tier.toUpperCase()} Tier</p>
                        </div>
                    </div>

                    {step === 'input' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">MTN Mobile Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input 
                                        type="tel"
                                        placeholder="078..."
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-secondary border border-border/50 rounded-xl pl-10 pr-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={handlePay} 
                                className="w-full font-bold h-12 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
                                style={{ backgroundColor: '#ffcc00', color: '#000' }}
                            >
                                Pay {amount.toLocaleString()} RWF
                            </button>
                        </div>
                    )}

                    {step === 'initiating' && (
                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                            <Loader2 className="w-10 h-10 animate-spin text-[#ffcc00]" />
                            <p className="font-medium text-foreground">Connecting to MTN...</p>
                        </div>
                    )}

                    {step === 'waiting' && (
                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 relative">
                                <div className="absolute inset-0 rounded-full border-4 border-secondary"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-[#ffcc00] border-t-transparent animate-spin"></div>
                                <Phone className="absolute inset-0 m-auto w-6 h-6 text-[#ffcc00]" />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-foreground mb-1">Check your phone!</p>
                                <p className="text-sm text-muted-foreground">Please enter your MoMo PIN on the prompt sent to {phone}.</p>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                                <ShieldCheck className="w-8 h-8 text-green-500" />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-foreground mb-1">Payment Successful!</p>
                                <p className="text-sm text-muted-foreground">Your account has been upgraded.</p>
                            </div>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                                <X className="w-8 h-8 text-destructive" />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-foreground mb-1">Payment Failed</p>
                                <p className="text-sm text-muted-foreground">{errorMsg}</p>
                            </div>
                            <Button onClick={() => setStep('input')} variant="outline" className="mt-2">
                                Try Again
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
