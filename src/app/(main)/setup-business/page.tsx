'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Loader2, Check, Phone, Globe, MapPin, ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';

const OnboardingMap = dynamic(
    () => import('@/components/features/map/OnboardingMap'),
    { 
        ssr: false,
        loading: () => <div className="h-64 bg-secondary animate-pulse rounded-xl flex items-center justify-center text-muted-foreground">Initializing Map...</div>
    }
);

export default function SetupBusinessPage() {
    const { profile, user, isLoading, refreshProfile } = useUser();
    const router = useRouter();
    const [step, setStep] = useState<'details' | 'location'>('details');
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        category: 'Retail',
        bio: '',
        phone: '',
        website: '',
        is_reviews_enabled: true
    });

    const [locationLat, setLocationLat] = useState(-1.9441);
    const [locationLng, setLocationLng] = useState(30.0619);
    const [locationSet, setLocationSet] = useState(false);

    useEffect(() => {
        if (!isLoading && profile && profile.role !== 'trader') {
            router.replace('/feed');
        }
    }, [isLoading, profile, router]);

    useEffect(() => {
        if (!user?.id) return;
        const supabase = getSupabaseClient();
        supabase
            .from('business_details')
            .select('*')
            .eq('profile_id', user.id)
            .maybeSingle()
            .then(({ data }: { data: any }) => {
                if (data) {
                    setFormData(prev => ({
                        ...prev,
                        name: data.business_name || prev.name,
                        category: data.category || prev.category,
                        bio: data.bio || prev.bio,
                        phone: data.phone || prev.phone,
                        website: data.website_url || prev.website,
                        is_reviews_enabled: data.is_reviews_enabled ?? prev.is_reviews_enabled,
                    }));
                }
            });
    }, [user?.id]);

    function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c; // Distance in km
    }

    function isPointInPolygon(point: {lat: number, lng: number}, polygon: {lat: number, lng: number}[]) {
        let x = point.lng, y = point.lat;
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            let xi = polygon[i].lng, yi = polygon[i].lat;
            let xj = polygon[j].lng, yj = polygon[j].lat;
            let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    const handleLocationSelect = (lat: number, lng: number) => {
        setLocationLat(lat);
        setLocationLng(lng);
        setLocationSet(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !locationSet) return;
        setLoading(true);

        try {
            // Use the server API route which has admin privileges to bypass RLS
            const res = await fetch('/api/setup-business', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    business_name: formData.name,
                    category: formData.category,
                    bio: formData.bio,
                    phone: formData.phone,
                    website_url: formData.website,
                    is_reviews_enabled: formData.is_reviews_enabled,
                    latitude: locationLat,
                    longitude: locationLng,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Failed to save');
            }

            await refreshProfile();
            router.push('/feed');
        } catch (err) {
            console.error('Failed to setup business:', err);
            alert('Failed to save. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pt-24 pb-32 px-6 flex items-center justify-center">
            {step === 'details' ? (
                <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-3xl border border-border/50 shadow-xl">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-display font-black tracking-tight">Setup Your Shop</h1>
                        <p className="text-muted-foreground">Add your final business details.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="biz-name">Business Name</Label>
                            <Input 
                                id="biz-name"
                                placeholder="e.g. AmazingSpiderman Shop"
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="h-12 bg-input border-border/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <select 
                                className="w-full bg-input border border-border/50 rounded-lg h-12 px-3 text-sm focus:ring-2 focus:ring-primary text-foreground"
                                style={{ colorScheme: 'dark' }}
                                value={formData.category}
                                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            >
                                <option className="bg-[#0f172a] text-white">Food</option>
                                <option className="bg-[#0f172a] text-white">Retail</option>
                                <option className="bg-[#0f172a] text-white">Events</option>
                                <option className="bg-[#0f172a] text-white">Services</option>
                                <option className="bg-[#0f172a] text-white">Other</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bio">About your business</Label>
                            <textarea 
                                className="w-full bg-input border border-border/50 rounded-lg p-3 text-sm min-h-[120px] focus:ring-2 focus:ring-primary text-foreground"
                                placeholder="Tell customers what makes you special..."
                                value={formData.bio}
                                onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">WhatsApp Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input 
                                    id="phone"
                                    type="tel"
                                    placeholder="e.g. 250788123456"
                                    value={formData.phone}
                                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="h-12 bg-input border-border/50 pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Website (optional)</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input 
                                    id="website"
                                    type="url"
                                    placeholder="e.g. https://myshop.com"
                                    value={formData.website}
                                    onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                    className="h-12 bg-input border-border/50 pl-10"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-secondary/50">
                            <div className="space-y-0.5">
                                <Label htmlFor="reviews-enabled" className="text-base">Enable Customer Reviews</Label>
                                <p className="text-sm text-muted-foreground">Allow users to rate and review your business</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    id="reviews-enabled"
                                    className="sr-only peer"
                                    checked={formData.is_reviews_enabled}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_reviews_enabled: e.target.checked }))}
                                />
                                <div className="w-11 h-6 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        <Button 
                            disabled={!formData.name}
                            onClick={() => setStep('location')}
                            className="w-full bg-gradient-to-r from-accent to-primary text-primary-foreground font-bold h-12 rounded-xl text-lg"
                        >
                            Next: Set Location
                        </Button>
                    </div>
                </div>
            ) : (
                /* Location Picker for Traders — Full Screen Map */
                <div className="fixed inset-0 z-50 flex flex-col bg-background">
                    {/* Top bar */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-background/90 backdrop-blur-xl border-b border-border/30 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground shrink-0"
                            onClick={() => setStep('details')}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h2 className="text-lg font-bold font-headline tracking-tight text-foreground leading-none">Pin Your Location</h2>
                            <p className="text-muted-foreground text-xs">Tap the map where your business is located</p>
                        </div>
                    </div>

                    {/* Full-screen map */}
                    <div className="flex-1 relative">
                        <OnboardingMap 
                            initialCenter={[locationLat, locationLng]} 
                            onLocationSelect={handleLocationSelect} 
                        />
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
                            <div className="bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-primary/20 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-primary-foreground" /> 
                                <span className="text-[10px] font-bold text-primary-foreground uppercase tracking-widest whitespace-nowrap">Tap to set</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom panel */}
                    <div className="shrink-0 px-5 py-4 bg-background/90 backdrop-blur-xl border-t border-border/30 space-y-3 pb-safe">
                        {locationSet ? (
                            <div className="flex items-center gap-3 text-sm text-foreground bg-secondary/50 px-4 py-3 rounded-xl border border-border/50">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <MapPin className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Location Selected</p>
                                    <p className="text-xs text-muted-foreground">{locationLat.toFixed(4)}, {locationLng.toFixed(4)}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center">
                                Please tap on the map to select your location.
                            </p>
                        )}

                        <Button
                            onClick={handleSubmit}
                            className="w-full h-12 font-display font-bold text-[#003f43] bg-gradient-to-r from-accent to-primary"
                            disabled={loading || !locationSet}
                        >
                            {loading ? (
                                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Saving profile...</>
                            ) : (
                                'Complete Setup'
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
