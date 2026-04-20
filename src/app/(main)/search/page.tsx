'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    ArrowLeft, 
    TrendingUp, 
    Utensils, 
    ShoppingBag, 
    Ticket, 
    Sparkles, 
    MapPin, 
    Heart, 
    History, 
    ChevronRight,
    Search as SearchIcon,
    Zap,
    Navigation,
    X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ROUTES, BUSINESS_CATEGORIES } from '@/lib/constants';
import { useBusinesses } from '@/hooks/useBusinesses';
import { getSupabaseClient } from '@/lib/supabase/client';

// Category icons mapping
const CATEGORY_ICONS: Record<string, any> = {
    'Restaurant': Utensils,
    'Cafe': Utensils,
    'Retail': ShoppingBag,
    'Services': Sparkles,
    'Entertainment': Ticket,
    'Health & Beauty': Heart,
    'Automotive': Zap,
    'Other': MapPin,
};

const TRENDING_TAGS = [
    { label: 'MidnightRamen', count: 124 },
    { label: 'SecretRave', count: 89 },
    { label: 'NeonFashion', count: 45 },
    { label: 'CyberBrunch', count: 32 },
];

export default function SearchPage() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const { businesses, isLoading } = useBusinesses();
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter businesses based on search
    const filteredBusinesses = businesses.filter(b => 
        (b.business_name?.toLowerCase()?.includes(query.toLowerCase()) ||
         b.category?.toLowerCase()?.includes(query.toLowerCase())) ?? false
    );

    return (
        <div className="min-h-screen bg-background text-foreground pb-32">
            {/* HUD Header: Search & Navigation */}
            <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-2xl px-6 h-20 flex items-center gap-4">
                <button 
                    onClick={() => router.back()}
                    className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                
                <div className="flex-1 glass-card border border-border/50 rounded-full px-5 py-2.5 flex items-center gap-3 transition-all focus-within:border-primary/30">
                    <Search className="w-5 h-5 text-primary" />
                    <input 
                        ref={inputRef}
                        className="bg-transparent border-none focus:outline-none text-sm w-full placeholder:text-muted-foreground font-medium"
                        placeholder="Search pulses, events, or traders..."
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                
                <button 
                    onClick={() => { setQuery(''); setIsFocused(false); }}
                    className="text-xs font-bold text-primary uppercase tracking-widest shrink-0"
                >
                    Cancel
                </button>
            </header>

            <main className="pt-24 px-6 space-y-10 max-w-2xl mx-auto">
                {/* Trending Section */}
                <section>
                    <h2 className="font-headline text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Trending Pulses
                    </h2>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                        {TRENDING_TAGS.map((tag) => (
                            <button 
                                key={tag.label}
                                onClick={() => setQuery(tag.label)}
                                className="glass-card px-4 py-2 rounded-full border border-border/50 whitespace-nowrap flex items-center gap-2 hover:border-primary/40 transition-all cursor-pointer"
                            >
                                <span className="text-primary text-sm font-bold">#</span>
                                <span className="text-sm font-medium">{tag.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Categories Grid */}
                {!query && (
                    <section>
                        <div className="grid grid-cols-4 gap-4">
                            {['Food', 'Retail', 'Events', 'Services'].map((cat) => {
                                const Icon = cat === 'Food' ? Utensils : cat === 'Retail' ? ShoppingBag : cat === 'Events' ? Ticket : Sparkles;
                                return (
                                    <button 
                                        key={cat}
                                        onClick={() => setQuery(cat)}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className="w-full aspect-square glass-card rounded-2xl flex items-center justify-center border border-border/50 group-hover:border-primary/40 group-active:scale-95 transition-all">
                                            <Icon className="w-7 h-7 text-primary" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                                            {cat}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Live Near You Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-headline text-2xl font-bold tracking-tight">
                            {query ? 'Search Results' : 'Live Near You'}
                        </h2>
                        {!query && (
                            <span className="px-3 py-1 bg-secondary rounded-full text-[10px] font-bold text-primary tracking-widest uppercase border border-primary/20">
                                Active Now
                            </span>
                        )}
                    </div>

                    <div className="space-y-6">
                        {filteredBusinesses.map((biz) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={biz.id} 
                                className="glass-card rounded-[2rem] overflow-hidden border border-border shadow-sm"
                            >
                                <div className="relative h-48 w-full group">
                                    <img 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                        src={biz.category === 'Restaurant' ? 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800' : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800'} 
                                        alt={biz.business_name} 
                                    />
                                    <div className="absolute top-4 left-4 px-3 py-1 bg-destructive text-white font-bold text-[10px] uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-lg">
                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                        Live
                                    </div>
                                    <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-md rounded-full border border-border">
                                        <Navigation className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-[10px] font-bold text-foreground tracking-widest uppercase">400M AWAY</span>
                                    </div>
                                </div>
                                
                                <div className="p-6 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-headline text-xl font-bold text-foreground">{biz.business_name}</h3>
                                            <p className="text-muted-foreground text-sm font-medium">{biz.category} • $$$</p>
                                        </div>
                                        <button className="text-primary hover:scale-110 transition-transform">
                                            <Heart className="w-6 h-6" />
                                        </button>
                                    </div>
                                    
                                    <div className="bg-secondary/50 p-4 rounded-2xl border border-border/50">
                                        <p className="text-sm text-foreground italic leading-relaxed">
                                            &ldquo;{biz.bio || 'Discover our new secret menu items today. Open until late.'}&rdquo;
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        
                        {filteredBusinesses.length === 0 && (
                            <div className="text-center py-20 bg-secondary rounded-3xl border border-dashed border-border/50">
                                <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                <p className="text-muted-foreground font-medium">No results found for &ldquo;{query}&rdquo;</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Recent Intel Section */}
                {!query && (
                    <section className="pb-10">
                        <h2 className="font-headline text-lg font-bold tracking-tight mb-4 flex items-center gap-2 text-muted-foreground">
                            <History className="w-5 h-5" />
                            Recent Intel
                        </h2>
                        <div className="space-y-1">
                            {[
                                { name: 'The Obsidian Club', type: 'location', time: '2 days ago' },
                                { name: 'Late Night Matcha', type: 'search', time: 'Yesterday' },
                                { name: 'Underground Arcade', type: 'visit', time: '3 days ago' }
                            ].map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className="flex items-center justify-between py-4 group cursor-pointer hover:px-2 transition-all border-b border-border/50 last:border-0"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background transition-colors">
                                            {item.type === 'location' ? <MapPin className="w-4 h-4" /> : item.type === 'search' ? <SearchIcon className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">{item.type.charAt(0).toUpperCase() + item.type.slice(1)} {item.time}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
