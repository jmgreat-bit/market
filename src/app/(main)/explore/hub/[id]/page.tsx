'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { CommercialHub, BusinessWithDetails } from '@/types';
import { MapPin, Loader2, Navigation, ArrowLeft, CheckCircle2, Building2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HubDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const hubId = params.id as string;

    const [hub, setHub] = useState<CommercialHub | null>(null);
    const [businesses, setBusinesses] = useState<BusinessWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!hubId) return;

        async function fetchHubData() {
            try {
                setIsLoading(true);
                const supabase = getSupabaseClient();

                // Fetch hub details
                const { data: hubData, error: hubError } = await supabase
                    .from('commercial_hubs')
                    .select('*')
                    .eq('id', hubId)
                    .single();

                if (hubError) throw hubError;
                setHub(hubData);

                // Fetch businesses in this hub
                const { data: bizData, error: bizError } = await supabase
                    .from('business_details')
                    .select(`
                        *,
                        profile:profiles(avatar_url, username, is_premium)
                    `)
                    .eq('hub_id', hubId);

                if (bizError) throw bizError;
                setBusinesses(bizData || []);

            } catch (err) {
                console.error('Failed to fetch hub details:', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchHubData();
    }, [hubId]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!hub) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
                <p className="text-muted-foreground font-medium">Hub not found</p>
                <Button variant="ghost" onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    // Group businesses by category
    const groupedBusinesses = businesses.reduce((acc, biz) => {
        const cat = biz.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(biz);
        return acc;
    }, {} as Record<string, BusinessWithDetails[]>);

    return (
        <div className="min-h-screen bg-background pb-32 md:pb-12 text-foreground">
            {/* Banner Header */}
            <div className="relative h-64 md:h-80 w-full bg-secondary">
                {hub.image_url ? (
                    <img src={hub.image_url} alt={hub.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full geo-gradient opacity-30" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                
                <div className="absolute top-4 left-4 z-10">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.back()}
                        className="bg-black/20 backdrop-blur-md text-white hover:bg-black/40 rounded-full"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <span className="bg-primary/20 text-primary font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider mb-3 inline-block border border-primary/30">
                                Commercial Hub
                            </span>
                            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-2">
                                {hub.name}
                            </h1>
                            <p className="text-muted-foreground flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> {hub.address || 'Kigali'}
                            </p>
                        </div>
                        <Button 
                            className="bg-primary text-primary-foreground font-bold rounded-full hover:scale-105 transition-transform shrink-0 shadow-[0_0_20px_rgba(143,245,255,0.3)]"
                            onClick={() => router.push(`/map?lat=${hub.latitude}&lng=${hub.longitude}`)}
                        >
                            <Navigation className="w-4 h-4 mr-2" /> View on Map
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 pt-8 space-y-12">
                
                {/* About Section */}
                {hub.description && (
                    <section>
                        <h2 className="text-xl font-bold font-display mb-3">About this Hub</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {hub.description}
                        </p>
                    </section>
                )}

                {/* Directory */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold font-display flex items-center gap-2">
                            <Building2 className="w-6 h-6 text-primary" /> Directory
                        </h2>
                        <span className="bg-secondary px-3 py-1 rounded-full text-sm font-bold text-foreground">
                            {businesses.length} shops
                        </span>
                    </div>

                    {businesses.length === 0 ? (
                        <div className="bg-card border border-border/50 rounded-2xl p-8 text-center">
                            <p className="text-muted-foreground">No shops listed in this hub yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {Object.entries(groupedBusinesses).map(([category, shops]) => (
                                <div key={category}>
                                    <h3 className="text-lg font-bold text-muted-foreground mb-4 border-b border-border/50 pb-2">
                                        {category}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {shops.map((shop) => (
                                            <Link 
                                                key={shop.id} 
                                                href={`/u/${shop.profile?.username}`}
                                                className="bg-card hover:bg-secondary/50 border border-border/50 rounded-2xl p-4 flex gap-4 transition-colors group"
                                            >
                                                <div className="w-16 h-16 rounded-xl bg-secondary overflow-hidden shrink-0">
                                                    {shop.profile?.avatar_url ? (
                                                        <img src={shop.profile.avatar_url} alt={shop.business_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground text-xl bg-secondary">
                                                            {shop.business_name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold font-display truncate group-hover:text-primary transition-colors">
                                                            {shop.business_name}
                                                        </h4>
                                                        {shop.profile?.is_premium && (
                                                            <SparklesIcon />
                                                        )}
                                                    </div>
                                                    
                                                    {/* Floor and Stall Info */}
                                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                        {shop.hub_floor && <span>{shop.hub_floor}</span>}
                                                        {shop.hub_floor && shop.hub_stall && <span>•</span>}
                                                        {shop.hub_stall && <span className="font-medium text-foreground">{shop.hub_stall}</span>}
                                                    </div>

                                                    {/* Verification Badge */}
                                                    {shop.last_verified_at && (
                                                        <div className="mt-2 inline-flex items-center gap-1 bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider w-fit">
                                                            <CheckCircle2 className="w-3 h-3" /> Location Verified
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

function SparklesIcon() {
    return (
        <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        </svg>
    );
}
