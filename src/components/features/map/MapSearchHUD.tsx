'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, UtensilsCrossed, ShoppingBag, Ticket, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
    { id: 'food', label: 'Food', icon: UtensilsCrossed, active: true },
    { id: 'retail', label: 'Retail', icon: ShoppingBag, active: false },
    { id: 'events', label: 'Events', icon: Ticket, active: false },
    { id: 'cafes', label: 'Cafes', icon: Coffee, active: false },
];

export function MapSearchHUD() {
    const [activeCategory, setActiveCategory] = useState('food');

    return (
        <div className="absolute top-safe top-6 left-0 right-0 px-4 md:px-6 lg:px-8 flex flex-col items-center gap-4 z-40 pointer-events-none w-full">
            {/* Glass Search Bar */}
            <div className="w-full max-w-3xl bg-[#131214]/60 backdrop-blur-[24px] rounded-xl flex items-center px-4 py-3.5 shadow-2xl pointer-events-auto border border-[#3b3a3c]/30">
                <Search className="w-6 h-6 text-muted-foreground mr-3 flex-shrink-0" />
                <input
                    className="bg-transparent border-none w-full text-foreground font-sans placeholder:text-muted-foreground text-base focus:outline-none focus:ring-0"
                    placeholder="Search the pulse..."
                    type="text"
                />
                <button className="ml-3 p-1.5 rounded-lg text-muted-foreground hover:bg-[#2c2c2d]/50 hover:text-foreground transition-colors flex-shrink-0">
                    <SlidersHorizontal className="w-5 h-5" />
                </button>
            </div>

            {/* Category Pills */}
            <div className="w-full max-w-3xl overflow-x-auto scrollbar-hide pointer-events-auto">
                <div className="flex justify-start md:justify-center gap-3 py-1">
                    {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={cn(
                                    "px-5 py-2.5 rounded-full font-display font-bold text-[15px] whitespace-nowrap flex items-center gap-2 transition-all active:scale-95 duration-200 border",
                                    isActive
                                        ? "bg-gradient-to-r from-primary to-accent text-[#003f43] border-transparent shadow-[0_0_24px_rgba(143,245,255,0.15)]"
                                        : "bg-[#1a191b]/50 border-white/5 text-foreground hover:bg-[#2c2c2d]/50 hover:border-white/10"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", !isActive && "text-primary")} strokeWidth={isActive ? 2.5 : 2} />
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
