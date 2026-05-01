'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseClient } from '@/lib/supabase/client';
import { MapPin, Store, Loader2, ChevronRight, Check } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import for map to avoid SSR issues
const OnboardingMap = dynamic(
    () => import('@/components/features/map/OnboardingMap'),
    { 
        ssr: false,
        loading: () => <div className="h-64 bg-secondary animate-pulse rounded-xl flex items-center justify-center text-muted-foreground">Initializing Map...</div>
    }
);

export default function SetupBusinessPage() {
    const { profile, user, refreshProfile } = useUser();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        category: 'Retail',
        bio: '',
        lat: -1.9441,
        lng: 30.0619
    });

    useEffect(() => {
        if (profile?.role !== 'trader') {
            router.replace('/feed');
        }
    }, [profile, router]);

    const handleLocationSelect = (lat: number, lng: number) => {
        setFormData(prev => ({ ...prev, lat, lng }));
    };

    const handleSubmit = async () => {
        if (!formData.name) return;
        setLoading(true);

        try {
            const supabase = getSupabaseClient();
            
            // 1. Create/Update Business Details
            const { error: bizError } = await supabase
                .from('business_details')
                .upsert({
                    profile_id: user?.id,
                    business_name: formData.name,
                    category: formData.category,
                    bio: formData.bio,
                    latitude: formData.lat,
                    longitude: formData.lng
                });

            if (bizError) throw bizError;

            // 2. Mark profile as setup (optional logic if you have a field)
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
        <div className="min-h-screen bg-background pt-24 pb-32 px-6">
            <div className="max-w-md mx-auto space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-display font-black tracking-tight">Setup Your Shop</h1>
                    <p className="text-muted-foreground">Tell us where you are and what you do.</p>
                </div>

                {/* Progress Bar */}
                <div className="flex gap-2 h-1.5">
                    <div className={`flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-secondary'}`} />
                    <div className={`flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-secondary'}`} />
                </div>

                {step === 1 ? (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="biz-name">Business Name</Label>
                                <Input 
                                    id="biz-name"
                                    placeholder="e.g. AmazingSpiderman Shop"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <select 
                                    className="w-full bg-secondary border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-primary"
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
                                    className="w-full bg-secondary border-none rounded-lg p-3 text-sm min-h-[100px] focus:ring-2 focus:ring-primary"
                                    placeholder="Tell customers what makes you special..."
                                    value={formData.bio}
                                    onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                />
                            </div>
                        </div>
                        <Button 
                            disabled={!formData.name}
                            onClick={() => setStep(2)}
                            className="w-full bg-primary text-primary-foreground font-bold h-12 rounded-xl"
                        >
                            Next: Set Location <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Drop a pin on your shop location</Label>
                            <div className="h-80 w-full rounded-2xl overflow-hidden border border-border/50 relative">
                                <OnboardingMap 
                                    initialCenter={[formData.lat, formData.lng]} 
                                    onLocationSelect={handleLocationSelect} 
                                />
                                <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-primary border border-primary/20 flex items-center gap-2">
                                    <MapPin className="w-3 h-3" /> CLICK MAP TO SET POSITION
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl">Back</Button>
                            <Button 
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-[2] bg-primary text-primary-foreground font-bold h-12 rounded-xl"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                Complete Setup
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Simple wrapper to avoid Framer Motion import issues in this scratch file
function motion_div({ children, className }: any) {
    return <div className={className}>{children}</div>;
}
