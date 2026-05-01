'use client';

import { Timer, QrCode } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function VouchersIntelPage() {
    const [activeTab, setActiveTab] = useState<'active' | 'saved'>('active');

    return (
        <div className="bg-surface text-foreground font-sans min-h-screen selection:bg-primary/30 selection:text-primary">
            {/* Main Content Canvas */}
            <main className="pt-8 pb-32 px-6 max-w-4xl mx-auto flex flex-col gap-8">
                {/* Header & Tabs */}
                <div className="flex flex-col gap-6">
                    <h2 className="font-display text-4xl font-bold text-foreground leading-tight tracking-tight">
                        My Intel <span className="text-primary drop-shadow-[0_0_12px_rgba(143,245,255,0.3)]">Cache</span>
                    </h2>
                    <div className="flex bg-secondary rounded-xl p-1 gap-1 border border-border/10">
                        <button 
                            onClick={() => setActiveTab('active')}
                            className={cn(
                                "flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all",
                                activeTab === 'active' 
                                    ? "bg-card text-primary backdrop-blur-md shadow-sm" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Active Vouchers
                        </button>
                        <button 
                            onClick={() => setActiveTab('saved')}
                            className={cn(
                                "flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all",
                                activeTab === 'saved' 
                                    ? "bg-card text-primary backdrop-blur-md shadow-sm" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Saved Intel
                        </button>
                    </div>
                </div>

                {/* Voucher Cards Grid (Bento Style) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Voucher Card 1 (Neon Coral Accent) */}
                    <div className="relative rounded-[1.5rem] bg-card p-6 border border-border/10 flex flex-col gap-6 overflow-hidden group">
                        {/* Background Ambient Glow */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#ff6e84]/10 rounded-full blur-[40px] pointer-events-none"></div>
                        
                        {/* Card Header */}
                        <div className="flex justify-between items-start z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-[#262627] flex items-center justify-center overflow-hidden border border-[rgba(72,72,73,0.15)]">
                                    <img 
                                        alt="Neon Burger Joint" 
                                        className="w-full h-full object-cover opacity-80" 
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnWESuq6qqDfu3x0pX7DgUiZbd2GMK9J9Eq3oeXxMM8qBA9zz0D7_srsPhXzc7gwgpZUwVDpUQIgd2cp-l4EhXE18KriZfIrwK4GF_eaeiPZQyH9WTg9KL-r9AxrCB7UnHGrnD53sW1-_9CT95BmJBhu2_blX6d4xleDh6Y-vbrHTkIAbMgZ1KZSrpXzHLWkKIMrlUuFbnRiog8LDP2ILcg3nFNU3leQ8U7Ii_kkaj3riik7Yf7iuQduL3ZS7suvFELUEW_aG7jw0" 
                                    />
                                </div>
                                <div>
                                    <h3 className="font-display text-lg font-bold text-foreground">Neon Bites</h3>
                                    <p className="text-xs text-primary flex items-center gap-1 font-medium">
                                        <Timer className="w-3 h-3" />
                                        Expires in 45m
                                    </p>
                                </div>
                            </div>
                            <div className="bg-[#131314] px-3 py-1 rounded-full border border-[rgba(72,72,73,0.2)]">
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Food</span>
                            </div>
                        </div>

                        {/* Deal Info */}
                        <div className="z-10 mt-2">
                            <p className="font-display text-3xl font-bold text-foreground leading-tight">Free Slider Duo</p>
                            <p className="text-sm text-muted-foreground mt-1">with any signature synth-brew purchase.</p>
                        </div>

                        {/* QR Area & Action */}
                        <div className="mt-auto pt-6 border-t border-[rgba(72,72,73,0.15)] flex items-center justify-between z-10">
                            <div className="w-16 h-16 bg-[#0e0e0f] rounded-md p-1 border border-[rgba(72,72,73,0.2)] relative">
                                <div className="w-full h-full border border-dashed border-[rgba(72,72,73,0.5)] flex items-center justify-center relative overflow-hidden group-hover:border-[#ff6e84]/50 transition-colors">
                                    <QrCode className="text-[rgba(72,72,73,0.8)] w-8 h-8" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#ff6e84]/20 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 ease-in-out"></div>
                                </div>
                            </div>
                            <button className="bg-primary text-primary-foreground font-medium px-6 py-3 rounded-full shadow-sm transition-all">
                                Reveal Code
                            </button>
                        </div>
                    </div>

                    {/* Voucher Card 2 (Cyan Accent) */}
                    <div className="relative rounded-[1.5rem] bg-[#1a191b]/50 backdrop-blur-[30px] p-6 border border-[rgba(72,72,73,0.15)] flex flex-col gap-6 overflow-hidden group">
                        {/* Background Ambient Glow */}
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none"></div>
                        
                        {/* Card Header */}
                        <div className="flex justify-between items-start z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-[#262627] flex items-center justify-center overflow-hidden border border-[rgba(72,72,73,0.15)]">
                                    <img 
                                        alt="Kicks Underground" 
                                        className="w-full h-full object-cover opacity-80" 
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsFJlltDcUHvy2j2SIaUBgDDnVbj8YGrx38Z6QoKVi-3Q9ykPXk_tCWyIfiS9HnMakasm7j6Jplrd49g3XJj3IkDPN7dtF6Ba0-VpSMIfcakaCr248ovh5U4sWDOyq8Ug0M1EwMAUqeiIRszoEG6Nae_9NqJ9azqRuxxFOON-6L95DpwTel_c3lpTHe9BzGY1DdJsQGORb0wRbclkeQSZ3a9hrF8IZ73RGdwyt-tk4fv4a-CzB4geku0_erJWWryqaDQ7QM-xeHmY" 
                                    />
                                </div>
                                <div>
                                    <h3 className="font-display text-lg font-bold text-foreground">Kicks District</h3>
                                    <p className="text-xs text-primary flex items-center gap-1 font-medium">
                                        <Timer className="w-3 h-3" />
                                        Expires in 2h 15m
                                    </p>
                                </div>
                            </div>
                            <div className="bg-[#131314] px-3 py-1 rounded-full border border-[rgba(72,72,73,0.2)]">
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Retail</span>
                            </div>
                        </div>

                        {/* Deal Info */}
                        <div className="z-10 mt-2">
                            <p className="font-display text-3xl font-bold text-foreground leading-tight">30% Off Drops</p>
                            <p className="text-sm text-muted-foreground mt-1">Valid on all new arrivals this weekend.</p>
                        </div>

                        {/* QR Area & Action */}
                        <div className="mt-auto pt-6 border-t border-[rgba(72,72,73,0.15)] flex items-center justify-between z-10">
                            <div className="w-16 h-16 bg-[#0e0e0f] rounded-md p-1 border border-[rgba(72,72,73,0.2)] relative">
                                <div className="w-full h-full border border-dashed border-[rgba(72,72,73,0.5)] flex items-center justify-center relative overflow-hidden group-hover:border-primary/50 transition-colors">
                                    <QrCode className="text-[rgba(72,72,73,0.8)] w-8 h-8" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 ease-in-out"></div>
                                </div>
                            </div>
                            <button className="bg-primary text-primary-foreground font-medium px-6 py-3 rounded-full shadow-sm transition-all">
                                Reveal Code
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
