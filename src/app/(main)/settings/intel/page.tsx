'use client';

import { 
    Radar, 
    UtensilsCrossed, 
    ShoppingBag, 
    Music, 
    Flame, 
    Clock, 
    ArrowRight, 
    Star, 
    Store, 
    BellOff, 
    Plus 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { StandalonePageLayout } from '@/components/layout/StandalonePageLayout';

export default function IntelSettingsPage() {
    const [foodActive, setFoodActive] = useState(true);
    const [retailActive, setRetailActive] = useState(false);
    const [musicActive, setMusicActive] = useState(true);
    const [dropsActive, setDropsActive] = useState(true);

    return (
        <StandalonePageLayout title="Intel Settings">
            <div className="bg-surface text-foreground min-h-screen flex flex-col pb-32 pt-6 selection:bg-primary-container/30 selection:text-primary">

                <main className="flex-grow max-w-5xl mx-auto w-full px-4 md:px-8 space-y-12">
                    {/* Subtitle Section */}
                    <section className="mt-4 mb-8 relative z-10">
                        <p className="font-sans text-muted-foreground text-lg max-w-2xl">Configure your proximity alerts and category feeds to curate your midnight navigation.</p>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                        {/* Left Column: Primary Controls */}
                        <div className="lg:col-span-7 space-y-8">
                            {/* Proximity Alerts Slider (Glassmorphic Card) */}
                            <section className="bg-[#1a191b]/50 backdrop-blur-[30px] rounded-xl p-6 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
                                            <Radar className="w-5 h-5 text-primary" />
                                            Proximity Alerts
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">Adjust distance for nearby drop notifications.</p>
                                    </div>
                                    <div className="bg-[#262627] px-4 py-2 rounded-full border border-[rgba(72,72,73,0.15)]">
                                        <span className="text-primary font-bold font-display">2.5 km</span>
                                    </div>
                                </div>
                                
                                <div className="relative pt-6 pb-2">
                                    {/* Custom Range Slider Track */}
                                    <div className="h-2 bg-[#262627] rounded-full w-full relative overflow-hidden">
                                        <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-primary to-accent shadow-[0_0_15px_rgba(0,238,252,0.4)]"></div>
                                    </div>
                                    {/* Thumb */}
                                    <div className="absolute top-4 left-1/2 -ml-3 w-6 h-6 bg-surface border-2 border-primary rounded-full shadow-[0_0_10px_rgba(143,245,255,0.6)] cursor-pointer hover:scale-110 transition-transform"></div>
                                    <div className="flex justify-between text-xs text-muted-foreground mt-4 font-medium uppercase tracking-wider">
                                        <span>500m</span>
                                        <span>5km</span>
                                    </div>
                                </div>
                            </section>

                            {/* Category Following (Bento Grid Style) */}
                            <section className="space-y-4">
                                <h3 className="font-display text-xl font-semibold text-foreground flex items-center gap-2 px-2">
                                    <ShoppingBag className="w-5 h-5 text-[#d674ff]" />
                                    Category Frequencies
                                </h3>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {/* Toggle Card 1 */}
                                    <div onClick={() => setFoodActive(!foodActive)} className={cn("rounded-xl p-4 flex flex-col items-center justify-center gap-3 relative cursor-pointer shadow-[0_0_20px_rgba(143,245,255,0.1)] transition-all", foodActive ? "bg-[#1a191b]/50 border-primary/30" : "bg-[#2c2c2d]/30 border-[rgba(72,72,73,0.15)]")}>
                                        <UtensilsCrossed className={cn("w-8 h-8 mb-1", foodActive ? "text-primary" : "text-muted-foreground")} />
                                        <span className={cn("font-display text-sm font-medium", foodActive ? "text-foreground" : "text-muted-foreground")}>Food</span>
                                        {/* Toggle */}
                                        <div className={cn("w-10 h-5 rounded-full relative mt-2 border", foodActive ? "bg-primary/20 border-primary/50" : "bg-[#262627] border-[rgba(72,72,73,0.3)]")}>
                                            <div className={cn("absolute top-0.5 w-4 h-4 rounded-full transition-all", foodActive ? "right-0.5 bg-primary shadow-[0_0_8px_rgba(143,245,255,0.8)]" : "left-0.5 bg-muted-foreground")}></div>
                                        </div>
                                    </div>

                                    {/* Toggle Card 2 */}
                                    <div onClick={() => setRetailActive(!retailActive)} className={cn("rounded-xl p-4 flex flex-col items-center justify-center gap-3 relative cursor-pointer shadow-[0_0_20px_rgba(143,245,255,0.1)] transition-all", retailActive ? "bg-[#1a191b]/50 border-primary/30" : "bg-[#2c2c2d]/30 border-[rgba(72,72,73,0.15)]")}>
                                        <ShoppingBag className={cn("w-8 h-8 mb-1", retailActive ? "text-primary" : "text-muted-foreground")} />
                                        <span className={cn("font-display text-sm font-medium", retailActive ? "text-foreground" : "text-muted-foreground")}>Retail</span>
                                        {/* Toggle */}
                                        <div className={cn("w-10 h-5 rounded-full relative mt-2 border", retailActive ? "bg-primary/20 border-primary/50" : "bg-[#262627] border-[rgba(72,72,73,0.3)]")}>
                                            <div className={cn("absolute top-0.5 w-4 h-4 rounded-full transition-all", retailActive ? "right-0.5 bg-primary shadow-[0_0_8px_rgba(143,245,255,0.8)]" : "left-0.5 bg-muted-foreground")}></div>
                                        </div>
                                    </div>

                                    {/* Toggle Card 3 */}
                                    <div onClick={() => setMusicActive(!musicActive)} className={cn("rounded-xl p-4 flex flex-col items-center justify-center gap-3 relative cursor-pointer shadow-[0_0_20px_rgba(214,116,255,0.1)] transition-all", musicActive ? "bg-[#1a191b]/50 border-[#d674ff]/30" : "bg-[#2c2c2d]/30 border-[rgba(72,72,73,0.15)]")}>
                                        <Music className={cn("w-8 h-8 mb-1", musicActive ? "text-[#d674ff]" : "text-muted-foreground")} />
                                        <span className={cn("font-display text-sm font-medium", musicActive ? "text-foreground" : "text-muted-foreground")}>Music</span>
                                        {/* Toggle */}
                                        <div className={cn("w-10 h-5 rounded-full relative mt-2 border", musicActive ? "bg-[#d674ff]/20 border-[#d674ff]/50" : "bg-[#262627] border-[rgba(72,72,73,0.3)]")}>
                                            <div className={cn("absolute top-0.5 w-4 h-4 rounded-full transition-all", musicActive ? "right-0.5 bg-[#d674ff] shadow-[0_0_8px_rgba(214,116,255,0.8)]" : "left-0.5 bg-muted-foreground")}></div>
                                        </div>
                                    </div>

                                    {/* Toggle Card 4 */}
                                    <div onClick={() => setDropsActive(!dropsActive)} className={cn("rounded-xl p-4 flex flex-col items-center justify-center gap-3 relative cursor-pointer shadow-[0_0_20px_rgba(255,110,132,0.1)] transition-all", dropsActive ? "bg-[#1a191b]/50 border-[#ff6e84]/30" : "bg-[#2c2c2d]/30 border-[rgba(72,72,73,0.15)]")}>
                                        <Flame className={cn("w-8 h-8 mb-1", dropsActive ? "text-[#ff6e84]" : "text-muted-foreground")} />
                                        <span className={cn("font-display text-sm font-medium", dropsActive ? "text-foreground" : "text-muted-foreground")}>Secret Drops</span>
                                        {/* Toggle */}
                                        <div className={cn("w-10 h-5 rounded-full relative mt-2 border", dropsActive ? "bg-[#ff6e84]/20 border-[#ff6e84]/50" : "bg-[#262627] border-[rgba(72,72,73,0.3)]")}>
                                            <div className={cn("absolute top-0.5 w-4 h-4 rounded-full transition-all", dropsActive ? "right-0.5 bg-[#ff6e84] shadow-[0_0_8px_rgba(255,110,132,0.8)]" : "left-0.5 bg-muted-foreground")}></div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Quiet Hours Scheduler */}
                            <section className="bg-[#131314] rounded-xl p-1 relative overflow-hidden">
                                <div className="bg-[#1a191b]/40 backdrop-blur-xl rounded-lg p-6">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <h3 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-muted-foreground" />
                                                Quiet Hours
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">Mute non-priority pulses during specific times.</p>
                                        </div>
                                        {/* Custom Toggle Switch Inactive */}
                                        <div className="w-12 h-6 bg-[#262627] rounded-full relative border border-[rgba(72,72,73,0.3)] cursor-pointer">
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-muted-foreground rounded-full"></div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 opacity-50 pointer-events-none">
                                        <div className="flex-1 bg-[#262627] rounded-md px-4 py-3 border border-[rgba(72,72,73,0.15)] flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Start</span>
                                            <span className="text-foreground font-display font-bold">23:00</span>
                                        </div>
                                        <ArrowRight className="w-6 h-6 text-muted-foreground" />
                                        <div className="flex-1 bg-[#262627] rounded-md px-4 py-3 border border-[rgba(72,72,73,0.15)] flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">End</span>
                                            <span className="text-foreground font-display font-bold">07:00</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Priority Pulse */}
                        <div className="lg:col-span-5">
                            <section className="bg-[#1a191b]/30 backdrop-blur-[40px] rounded-xl border border-[rgba(72,72,73,0.1)] h-full flex flex-col">
                                <div className="p-6 border-b border-[rgba(72,72,73,0.1)]">
                                    <h3 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
                                        <Star className="w-5 h-5 text-primary fill-primary" />
                                        Priority Pulse
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">Followed Traders bypassing Quiet Hours.</p>
                                </div>
                                
                                <div className="p-4 flex-grow space-y-2">
                                    {/* List Item 1 */}
                                    <div className="flex items-center justify-between p-3 rounded-md hover:bg-[#1a191b] transition-colors group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-md overflow-hidden bg-[#262627] border border-[rgba(72,72,73,0.2)] relative">
                                                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center">
                                                    <Store className="w-5 h-5 text-primary" />
                                                </div>
                                                <div className="absolute bottom-0 right-0 w-2 h-2 bg-primary rounded-full shadow-[0_0_5px_#8ff5ff] m-1"></div>
                                            </div>
                                            <div>
                                                <h4 className="font-display font-medium text-sm text-foreground">Neon Noodle Bar</h4>
                                                <p className="text-xs text-muted-foreground">Food • Always active</p>
                                            </div>
                                        </div>
                                        <button className="text-[rgba(118,117,118,1)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                            <BellOff className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* List Item 2 */}
                                    <div className="flex items-center justify-between p-3 rounded-md hover:bg-[#1a191b] transition-colors group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-md overflow-hidden bg-[#262627] border border-[rgba(72,72,73,0.2)] relative">
                                                <div className="w-full h-full bg-gradient-to-br from-[#d674ff]/20 to-transparent flex items-center justify-center">
                                                    <Music className="w-5 h-5 text-[#d674ff]" />
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-display font-medium text-sm text-foreground">Vinyl Vault</h4>
                                                <p className="text-xs text-muted-foreground">Music • Drops only</p>
                                            </div>
                                        </div>
                                        <button className="text-[rgba(118,117,118,1)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                            <BellOff className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* List Item 3 */}
                                    <div className="flex items-center justify-between p-3 rounded-md hover:bg-[#1a191b] transition-colors group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-md overflow-hidden bg-[#262627] border border-[rgba(72,72,73,0.2)] relative">
                                                <div className="w-full h-full bg-gradient-to-br from-[#ff6e84]/20 to-transparent flex items-center justify-center">
                                                    <Flame className="w-5 h-5 text-[#ff6e84]" />
                                                </div>
                                                <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#ff6e84] rounded-full shadow-[0_0_5px_#ff6e84] m-1"></div>
                                            </div>
                                            <div>
                                                <h4 className="font-display font-medium text-sm text-foreground">Midnight Threads</h4>
                                                <p className="text-xs text-muted-foreground">Retail • Flash sales</p>
                                            </div>
                                        </div>
                                        <button className="text-[rgba(118,117,118,1)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                            <BellOff className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 border-t border-[rgba(72,72,73,0.1)]">
                                    <button className="w-full py-3 bg-[#2c2c2d]/30 border border-[rgba(72,72,73,0.15)] text-sm font-medium text-foreground rounded-md hover:bg-[#2c2c2d]/50 transition-colors flex items-center justify-center gap-2">
                                        <Plus className="w-5 h-5" />
                                        Add Trader to Pulse
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        </StandalonePageLayout>
    );
}
