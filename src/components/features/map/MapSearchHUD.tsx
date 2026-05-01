'use client';

import { useState } from 'react';
import {
    Search,
    Utensils,
    ShoppingBag,
    Ticket,
    Sparkles,
    Filter,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapSearchHUDProps {
    onCategoryFilter?: (category: string | null) => void;
}

export function MapSearchHUD({ onCategoryFilter }: MapSearchHUDProps) {
    const [query, setQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const categories = [
        { id: 'Food', name: 'Food', icon: Utensils },
        { id: 'Retail', name: 'Retail', icon: ShoppingBag },
        { id: 'Events', name: 'Events', icon: Ticket },
        { id: 'Other', name: 'Services', icon: Sparkles },
    ];

    const handleCategoryClick = (id: string) => {
        const next = activeCategory === id ? null : id;
        setActiveCategory(next);
        if (onCategoryFilter) onCategoryFilter(next);
    };

    return (
        <div className="absolute top-0 left-0 w-full z-20 pointer-events-none p-4 md:p-6">
            <div className="max-w-md mx-auto space-y-4 pointer-events-auto">
                {/* Search Bar HUD */}
                <div className="glass-card rounded-full border border-border/50 flex items-center px-4 py-2.5 shadow-2xl backdrop-blur-3xl">
                    <Search className="w-5 h-5 text-primary mr-3" />
                    <input
                        type="text"
                        placeholder="Search current area..."
                        className="bg-transparent border-none focus:outline-none text-sm w-full placeholder:text-muted-foreground font-medium"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="w-px h-4 bg-border/50 mx-2" />
                    <button className="p-1 text-muted-foreground hover:text-primary transition-colors">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>

                {/* Quick Filters */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap backdrop-blur-xl shadow-lg",
                                activeCategory === cat.id
                                    ? "bg-primary border-primary text-primary-foreground font-bold"
                                    : "glass-card border-border/40 text-foreground hover:border-primary/40"
                            )}
                        >
                            <cat.icon className={cn("w-3.5 h-3.5", activeCategory === cat.id ? "text-primary-foreground" : "text-primary")} />
                            <span className="text-[11px] uppercase tracking-wider">{cat.name}</span>
                            {activeCategory === cat.id && <X className="w-3 h-3 ml-1" />}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
