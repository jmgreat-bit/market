'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    ArrowLeft,
    TrendingUp,
    Utensils,
    ShoppingBag,
    Ticket,
    Sparkles,
    Navigation,
    X,
    LocateFixed,
    Loader2,
    Heart,
    User,
    Store,
    Megaphone
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { useGeolocation } from '@/hooks/useGeolocation';
import { createClient } from '@/lib/supabase/client';
import { useAds } from '@/hooks/useAds';
import type { BusinessDetails, PostWithBusiness, Profile } from '@/types';

export default function SearchPage() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [trendingTags, setTrendingTags] = useState<{name: string, post_count: number}[]>([]);
    const [results, setResults] = useState<{
        businesses: BusinessDetails[],
        posts: PostWithBusiness[],
        profiles: Profile[]
    }>({ businesses: [], posts: [], profiles: [] });
    
    const [isSearching, setIsSearching] = useState(false);
    const [loadingTags, setLoadingTags] = useState(true);
    const { coordinates, isLoading: geoLoading, requestLocation } = useGeolocation();
    const inputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();
    const { ads: searchAds } = useAds('search');

    // Fetch trending hashtags
    useEffect(() => {
        async function fetchTags() {
            setLoadingTags(true);
            const { data } = await supabase
                .from('hashtags')
                .select('*')
                .order('post_count', { ascending: false })
                .limit(10);
            
            if (data) setTrendingTags(data);
            setLoadingTags(false);
        }
        fetchTags();
    }, []);

    // Perform multi-entity search
    useEffect(() => {
        if (!query.trim() || query.length < 2) {
            setResults({ businesses: [], posts: [], profiles: [] });
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            const cleanQuery = query.startsWith('#') ? query.slice(1) : query;

            try {
                // 1. Search Businesses
                const bizPromise = supabase
                    .from('business_details')
                    .select('*')
                    .or(`business_name.ilike.%${query}%,category.ilike.%${query}%,bio.ilike.%${query}%`)
                    .limit(5);

                // 2. Search Posts (including hashtag support)
                const postPromise = supabase
                    .from('posts')
                    .select(`
                        *,
                        business:business_details(business_name, category)
                    `)
                    .or(`content.ilike.%${query}%,content.ilike.%#${cleanQuery}%`)
                    .limit(5);

                // 3. Search Profiles
                const profilePromise = supabase
                    .from('profiles')
                    .select('*')
                    .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
                    .limit(5);

                const [bizRes, postRes, profRes] = await Promise.all([bizPromise, postPromise, profilePromise]);

                console.log('[Search] Found:', {
                    biz: bizRes.data?.length,
                    posts: postRes.data?.length,
                    profiles: profRes.data?.length
                });

                setResults({
                    businesses: bizRes.data || [],
                    posts: postRes.data || [],
                    profiles: profRes.data || []
                });
            } catch (err) {
                console.error('Search failed:', err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="min-h-screen bg-background text-foreground pb-32">
            <header className="fixed top-[3.5rem] w-full z-50 bg-background/80 backdrop-blur-2xl px-6 h-20 flex items-center gap-4 border-b border-border/10">
                <button onClick={() => router.back()} className="text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>

                <div className="flex-1 glass-card border border-border/50 rounded-full px-5 py-2.5 flex items-center gap-3 focus-within:border-primary/30 transition-all">
                    <Search className="w-5 h-5 text-primary" />
                    <input
                        ref={inputRef}
                        autoFocus
                        className="bg-transparent border-none focus:outline-none text-sm w-full placeholder:text-muted-foreground font-medium"
                        placeholder="Search name, product, or #hashtag..."
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </header>

            <main className="pt-36 px-6 space-y-10 max-w-2xl mx-auto">
                {/* Initial View: Trending & Categories */}
                {!query && (
                    <>
                        <section>
                            <h2 className="font-headline text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Trending Topics
                            </h2>
                            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                                {loadingTags ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                ) : trendingTags.map((tag) => (
                                    <button
                                        key={tag.name}
                                        onClick={() => setQuery(`#${tag.name}`)}
                                        className="glass-card px-4 py-2 rounded-full border border-border/50 whitespace-nowrap flex items-center gap-2 hover:border-primary/40 transition-all"
                                    >
                                        <span className="text-primary text-sm font-bold">#</span>
                                        <span className="text-sm font-medium">{tag.name}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                            {[
                                { name: 'Food', icon: Utensils },
                                { name: 'Retail', icon: ShoppingBag },
                                { name: 'Events', icon: Ticket },
                                { name: 'Other', icon: Sparkles }
                            ].map((cat) => (
                                <button
                                    key={cat.name}
                                    onClick={() => setQuery(cat.name)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-border/50 hover:border-primary/40 transition-all whitespace-nowrap"
                                >
                                    <cat.icon className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary">
                                        {cat.name}
                                    </span>
                                </button>
                            ))}
                        </section>
                    </>
                )}

                {/* Search Results View */}
                {query && (
                    <div className="space-y-8">
                        {isSearching ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <>
                                {/* Promoted Listings */}
                                {searchAds.length > 0 && (
                                    <section>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                                            <Megaphone className="w-4 h-4 text-amber-400" /> Promoted
                                        </h3>
                                        <div className="space-y-4 mb-2">
                                            {searchAds.map(ad => (
                                                <div key={ad.id} className="glass-card rounded-2xl overflow-hidden border border-amber-500/30 shadow-[0_0_16px_rgba(245,190,80,0.08)]">
                                                    <div className="p-4 flex gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex-shrink-0 flex items-center justify-center">
                                                            <Store className="w-6 h-6 text-amber-400" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="font-bold text-foreground">{ad.business?.business_name || 'Business'}</h4>
                                                                <span className="text-[10px] font-bold text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                                                                    <Megaphone className="w-3 h-3" /> Promoted
                                                                </span>
                                                            </div>
                                                            {ad.business?.category && (
                                                                <span className="text-[10px] font-bold text-amber-400/70 uppercase">{ad.business.category}</span>
                                                            )}
                                                            {ad.post?.content && (
                                                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{ad.post.content}</p>
                                                            )}
                                                            {ad.post?.image_url && (
                                                                <img src={ad.post.image_url} className="mt-2 w-full h-24 object-cover rounded-lg" alt="Promoted" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* People / Profiles */}
                                {results.profiles.length > 0 && (
                                    <section>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                                            <User className="w-4 h-4" /> People
                                        </h3>
                                        <div className="space-y-3">
                                            {results.profiles.map(prof => (
                                                <button 
                                                    key={prof.id}
                                                    onClick={() => router.push(`/u/${prof.username}`)}
                                                    className="w-full flex items-center gap-4 p-3 glass-card rounded-xl border border-border/30 hover:border-primary/30 transition-all"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                                        {prof.avatar_url ? <img src={prof.avatar_url} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-primary" />}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-sm">{prof.full_name}</p>
                                                        <p className="text-xs text-muted-foreground">@{prof.username}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Businesses */}
                                {results.businesses.length > 0 && (
                                    <section>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                                            <Store className="w-4 h-4" /> Businesses
                                        </h3>
                                        <div className="space-y-4">
                                            {results.businesses.map(biz => (
                                                <div key={biz.id} className="glass-card rounded-2xl overflow-hidden border border-border/30">
                                                    <div className="p-4 flex gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-secondary flex-shrink-0 flex items-center justify-center">
                                                            <Store className="w-6 h-6 text-primary" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="font-bold text-foreground">{biz.business_name}</h4>
                                                                <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">{biz.category}</span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{biz.bio}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Posts / Pulses */}
                                {results.posts.length > 0 && (
                                    <section>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" /> Pulses & Posts
                                        </h3>
                                        <div className="space-y-4">
                                            {results.posts.map(post => (
                                                <div key={post.id} className="p-4 glass-card rounded-xl border border-border/30">
                                                    <p className="text-[10px] font-bold text-primary uppercase mb-2">{post.business?.business_name}</p>
                                                    <p className="text-sm text-foreground line-clamp-3">{post.content}</p>
                                                    {post.image_url && <img src={post.image_url} className="mt-3 w-full h-32 object-cover rounded-lg" />}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {results.businesses.length === 0 && results.posts.length === 0 && results.profiles.length === 0 && (
                                    <div className="text-center py-20 opacity-50">
                                        <p>No results found for &quot;{query}&quot;</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
