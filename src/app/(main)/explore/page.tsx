'use client';

import { Sparkles, TrendingUp, Zap, MapPin } from 'lucide-react';
import { FeedList } from '@/components/features/feed/FeedList';

// Using mock data for explore page to show the concept
const trendingPosts = [
    {
        id: '101',
        business_id: 'b1',
        content: '🔥 Midnight Secret Drop! First 50 people showing this pulse get 50% off our Neo-Neon hoodies. Starts at 11PM sharp!',
        business: {
            id: 'b1',
            profile_id: 'p1',
            business_name: 'Cyber Threads',
            category: 'Retail',
            latitude: 40.7128,
            longitude: -74.006,
            is_premium: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            bio: null,
            address: null,
            phone: null
        },
        likes_count: 342,
        comments_count: 89,
        is_liked: true,
        image_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200',
        latitude: null,
        longitude: null,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
        id: '102',
        business_id: 'b2',
        content: '🎶 Guest DJ Alert! DJ Synthwave is taking over the decks tonight. VIP tables are 80% full. Secure your spot!',
        business: {
            id: 'b2',
            profile_id: 'p2',
            business_name: 'The Voltage Room',
            category: 'Events',
            latitude: 40.7138,
            longitude: -74.005,
            is_premium: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            bio: null,
            address: null,
            phone: null
        },
        likes_count: 890,
        comments_count: 124,
        is_liked: false,
        image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
        latitude: null,
        longitude: null,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    }
];

export default function ExplorePage() {
    return (
        <div className="min-h-screen bg-background pb-32 md:pb-12 text-foreground">
            {/* Explore Header */}
            <div className="relative pt-20 md:pt-28 pb-8 px-6 md:px-10 max-w-3xl mx-auto w-full z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50 pointer-events-none" />
                <h1 className="text-4xl md:text-5xl font-display font-black text-foreground mb-4 tracking-tight flex items-center gap-4">
                    Explore
                    <span className="bg-primary/20 text-primary text-sm font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-primary/30 flex items-center gap-1">
                        <Sparkles className="w-4 h-4" /> Trending
                    </span>
                </h1>
                <p className="text-muted-foreground text-lg mb-8 max-w-lg">
                    Discover buzzing events, viral drops, and the hottest spots emerging in your city right now.
                </p>

                {/* Sub-navigation Pills */}
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                    <button className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm shadow-sm group">
                        🔥 Trending Now
                    </button>
                    <button className="px-5 py-2.5 rounded-full bg-secondary border border-border/10 text-foreground hover:bg-muted font-sans font-medium text-sm whitespace-nowrap">
                        <Zap className="w-4 h-4 inline-block mr-1.5 align-text-bottom text-primary" />
                        Flash Discounts
                    </button>
                    <button className="px-5 py-2.5 rounded-full bg-secondary border border-border/10 text-foreground hover:bg-muted font-sans font-medium text-sm whitespace-nowrap">
                        <MapPin className="w-4 h-4 inline-block mr-1.5 align-text-bottom text-primary" />
                        Local Events
                    </button>
                </div>
            </div>

            {/* Feed content */}
            <div className="px-6 md:px-10 max-w-3xl mx-auto w-full">
                <FeedList posts={trendingPosts as any} isLoading={false} error={null} />
            </div>
        </div>
    );
}
