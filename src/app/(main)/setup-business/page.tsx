'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Loader2, Check, Phone, Globe } from 'lucide-react';

export default function SetupBusinessPage() {
    const { profile, user, refreshProfile } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        category: 'Retail',
        bio: '',
        phone: '',
        website: ''
    });

    useEffect(() => {
        if (profile?.role !== 'trader') {
            router.replace('/feed');
        }
    }, [profile, router]);

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

    const handleSubmit = async () => {
        if (!formData.name) return;
        setLoading(true);

        try {
            const supabase = getSupabaseClient();
            
            // 1. Check if business is near a Commercial Hub
            const { data: bizData } = await supabase
                .from('business_details')
                .select('latitude, longitude')
                .eq('profile_id', user?.id)
                .single();

            let matchedHubId = null;

            if (bizData?.latitude && bizData?.longitude) {
                const { data: hubs } = await supabase.from('commercial_hubs').select('id, latitude, longitude');
                if (hubs) {
                    for (const hub of hubs) {
                        const distance = getDistanceFromLatLonInKm(bizData.latitude, bizData.longitude, hub.latitude, hub.longitude);
                        if (distance <= 0.5) { // 500 meters
                            matchedHubId = hub.id;
                            break;
                        }
                    }
                }
            }
            
            // Update Business Details
            const { error: bizError } = await supabase
                .from('business_details')
                .update({
                    business_name: formData.name,
                    category: formData.category,
                    bio: formData.bio,
                    phone: formData.phone.trim() || null,
                    website_url: formData.website.trim() || null,
                    ...(matchedHubId ? { hub_id: matchedHubId } : {})
                })
                .eq('profile_id', user?.id);

            if (bizError) throw bizError;

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
                            value={formData.category}
                            onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        >
                            <option>Food</option>
                            <option>Retail</option>
                            <option>Events</option>
                            <option>Services</option>
                            <option>Other</option>
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

                    <Button 
                        disabled={!formData.name || loading}
                        onClick={handleSubmit}
                        className="w-full bg-gradient-to-r from-accent to-primary text-primary-foreground font-bold h-12 rounded-xl text-lg"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                        Complete Setup
                    </Button>
                </div>
            </div>
        </div>
    );
}
