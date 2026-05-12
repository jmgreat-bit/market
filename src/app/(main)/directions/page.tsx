'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { DirectionPhoto } from '@/types';
import { getSupabaseClient } from '@/lib/supabase/client';
import { DIRECTION_MAX_PHOTOS, DIRECTION_CAPTION_MAX_LENGTH, IMAGE_MAX_BYTES } from '@/lib/constants';
import {
    ChevronLeft, Loader2, Upload, Trash2, GripVertical,
    MapPin, Save, Camera, AlertTriangle, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DirectionsPage() {
    const { profile, isAuthenticated, isLoading: authLoading } = useUser();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [photos, setPhotos] = useState<DirectionPhoto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [businessId, setBusinessId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [addressText, setAddressText] = useState('');

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    // Fetch business + existing direction photos
    useEffect(() => {
        if (!profile?.id || profile.role !== 'trader') return;
        
        const load = async () => {
            setIsLoading(true);
            try {
                const supabase = getSupabaseClient();
                const { data: biz } = await supabase
                    .from('business_details')
                    .select('id, address')
                    .eq('profile_id', profile.id)
                    .single();
                
                if (!biz) {
                    router.replace('/setup-business');
                    return;
                }
                setBusinessId(biz.id);
                setAddressText(biz.address || '');

                const { data: dirPhotos } = await supabase
                    .from('direction_photos')
                    .select('*')
                    .eq('business_id', biz.id)
                    .order('sort_order', { ascending: true });
                
                setPhotos(dirPhotos || []);
            } catch (err) {
                console.error('Failed to load directions:', err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [profile, router]);

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated || profile?.role !== 'trader') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <h1 className="font-display font-bold text-2xl text-foreground mb-2">Access Denied</h1>
                <p className="text-muted-foreground mb-6">Only traders can manage directions.</p>
                <Button onClick={() => router.push('/feed')} className="bg-primary text-primary-foreground font-bold">
                    Return to Feed
                </Button>
            </div>
        );
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !businessId) return;

        if (photos.length >= DIRECTION_MAX_PHOTOS) {
            showToast('error', `Maximum ${DIRECTION_MAX_PHOTOS} photos allowed.`);
            return;
        }
        if (file.size > IMAGE_MAX_BYTES) {
            showToast('error', 'Image must be under 4MB.');
            return;
        }
        if (!file.type.startsWith('image/')) {
            showToast('error', 'Only image files allowed.');
            return;
        }

        setIsSaving(true);
        try {
            const supabase = getSupabaseClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `directions/${businessId}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('post-media')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(fileName);

            const { data: newPhoto, error: insertError } = await supabase
                .from('direction_photos')
                .insert({
                    business_id: businessId,
                    image_url: urlData.publicUrl,
                    caption: '',
                    sort_order: photos.length,
                })
                .select()
                .single();
            
            if (insertError) throw insertError;
            setPhotos(prev => [...prev, newPhoto]);
            showToast('success', 'Photo added!');
        } catch (err) {
            console.error('Upload failed:', err);
            showToast('error', 'Failed to upload photo.');
        } finally {
            setIsSaving(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeletePhoto = async (photoId: string) => {
        try {
            const supabase = getSupabaseClient();
            await supabase.from('direction_photos').delete().eq('id', photoId);
            setPhotos(prev => prev.filter(p => p.id !== photoId));
            showToast('success', 'Photo removed.');
        } catch (err) {
            showToast('error', 'Failed to delete photo.');
        }
    };

    const handleCaptionUpdate = (photoId: string, caption: string) => {
        setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, caption } : p));
    };

    const handleSaveAll = async () => {
        if (!businessId) return;
        setIsSaving(true);
        try {
            const supabase = getSupabaseClient();
            
            // Save address text
            await supabase
                .from('business_details')
                .update({ address: addressText.trim() })
                .eq('id', businessId);

            // Save captions + sort order
            for (let i = 0; i < photos.length; i++) {
                await supabase
                    .from('direction_photos')
                    .update({ caption: photos[i].caption, sort_order: i })
                    .eq('id', photos[i].id);
            }
            showToast('success', 'Directions saved!');
        } catch (err) {
            showToast('error', 'Failed to save. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface text-foreground pb-32">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border text-sm font-medium ${
                    toast.type === 'success' ? 'bg-card border-primary/40 text-foreground' : 'bg-card border-destructive/40 text-foreground'
                }`}>
                    {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-primary shrink-0" /> : <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />}
                    {toast.message}
                </div>
            )}

            <div className="max-w-xl mx-auto px-6 pt-10 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                        <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <div className="flex-1">
                        <h1 className="font-headline text-2xl font-black tracking-tight">How to Find Us</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Help customers locate your exact spot</p>
                    </div>
                    <Button
                        onClick={handleSaveAll}
                        disabled={isSaving}
                        className="bg-primary text-primary-foreground font-bold rounded-xl h-9 px-4"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1.5" /> Save</>}
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Written Address */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" /> Detailed Address
                            </label>
                            <textarea
                                value={addressText}
                                onChange={(e) => setAddressText(e.target.value)}
                                maxLength={300}
                                rows={3}
                                placeholder="e.g. 15th floor, KG 7 Ave, Kigali Heights Building. Take the main elevator, turn left at the hallway..."
                                className="w-full bg-secondary border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors resize-none"
                            />
                            <p className="text-right text-[10px] text-muted-foreground">{addressText.length}/300</p>
                        </div>

                        {/* Direction Photos */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                <Camera className="w-3.5 h-3.5" /> Step-by-step Photos ({photos.length}/{DIRECTION_MAX_PHOTOS})
                            </label>

                            {photos.map((photo, idx) => (
                                <div key={photo.id} className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                                    <div className="relative">
                                        <img src={photo.image_url} alt={`Step ${idx + 1}`} className="w-full aspect-video object-cover" />
                                        <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest border border-primary/20">
                                            Step {idx + 1}
                                        </div>
                                        <button
                                            onClick={() => handleDeletePhoto(photo.id)}
                                            className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-destructive transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="p-3">
                                        <input
                                            type="text"
                                            value={photo.caption || ''}
                                            onChange={(e) => handleCaptionUpdate(photo.id, e.target.value)}
                                            maxLength={DIRECTION_CAPTION_MAX_LENGTH}
                                            placeholder="Describe this step (e.g. Enter from main gate)..."
                                            className="w-full bg-secondary/50 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* Upload button */}
                            {photos.length < DIRECTION_MAX_PHOTOS && (
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={handlePhotoUpload}
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isSaving}
                                        className="w-full flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 border-dashed border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                                            <Upload className="w-5 h-5" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-semibold">Add Step Photo</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Show how to reach your location</p>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
