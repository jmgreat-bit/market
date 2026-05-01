'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { 
    Image as ImageIcon, 
    MapPin, 
    Clock, 
    Globe, 
    ChevronLeft,
    Loader2,
    X
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { SHOUT_MAX_LENGTH, SHOUT_MIN_WORDS, IMAGE_MIN_BYTES, IMAGE_MAX_BYTES } from '@/lib/constants';

export default function ComposePage() {
    const { profile, isAuthenticated, isLoading: authLoading } = useUser();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Redirect to setup if business is missing
    useEffect(() => {
        if (!authLoading && isAuthenticated && profile?.role === 'trader') {
            const checkBusiness = async () => {
                const supabase = getSupabaseClient();
                const { data } = await supabase
                    .from('business_details')
                    .select('id')
                    .eq('profile_id', profile.id)
                    .single();
                
                if (!data) {
                    router.replace('/setup-business');
                }
            };
            checkBusiness();
        }
    }, [authLoading, isAuthenticated, profile, router]);

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
                <p className="text-muted-foreground mb-6">Only verified traders can create posts.</p>
                <Button onClick={() => router.push('/feed')} className="bg-primary text-primary-foreground font-bold">
                    Return to Feed
                </Button>
            </div>
        );
    }

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > IMAGE_MAX_BYTES) {
            setError('Image must be under 4MB');
            return;
        }

        if (file.size < IMAGE_MIN_BYTES) {
            setError('Image is too small (minimum 10KB)');
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError('Only image files are allowed. Videos are not supported.');
            return;
        }

        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setError(null);
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return;
        setIsSubmitting(true);
        setError(null);
        console.log('[Compose] Starting submission...');

        // Timeout safeguard
        const timeoutId = setTimeout(() => {
            if (isSubmitting) {
                console.error('[Compose] Submission timed out');
                setError("Submission taking too long. Please check your connection.");
                setIsSubmitting(false);
                window.alert("Broadcast timed out. Please try again.");
            }
        }, 15000);

        try {
            const supabase = getSupabaseClient();
            
            // 1. Get business details
            console.log('[Compose] Fetching business details...');
            const { data: business, error: businessError } = await supabase
                .from('business_details')
                .select('id, latitude, longitude')
                .eq('profile_id', profile.id)
                .single();

            if (businessError || !business) {
                console.error('[Compose] Business Error:', businessError);
                throw new Error("Could not find your business profile. Please complete your registration.");
            }

            let imageUrl: string | null = null;

            // 2. Upload image if selected
            if (selectedImage) {
                console.log('[Compose] Uploading image...');
                const fileExt = selectedImage.name.split('.').pop();
                const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('post-media')
                    .upload(fileName, selectedImage, {
                        cacheControl: '3600',
                        upsert: false,
                    });

                if (uploadError) {
                    console.error('[Compose] Upload Error:', uploadError);
                    throw new Error(`Image upload failed: ${uploadError.message}`);
                }

                const { data: urlData } = supabase.storage
                    .from('post-media')
                    .getPublicUrl(fileName);

                imageUrl = urlData.publicUrl;
                console.log('[Compose] Image uploaded successfully:', imageUrl);
            }

            // 3. Create post
            console.log('[Compose] Creating post in DB...');
            const { error: postError } = await supabase
                .from('posts')
                .insert({
                    business_id: business.id,
                    content: content.trim(),
                    image_url: imageUrl,
                    latitude: business.latitude,
                    longitude: business.longitude
                    // expires_at removed so posts last forever
                });

            if (postError) {
                console.error('[Compose] Post Error:', postError);
                throw postError;
            }

            clearTimeout(timeoutId);
            console.log('[Compose] Success! Redirecting...');
            window.alert("Pulse Broadcasted Successfully!");
            setIsSubmitting(false);
            window.location.href = '/feed';
        } catch (err: any) {
            clearTimeout(timeoutId);
            console.error('[Compose] Submission Failed:', err);
            setError(err.message || "Failed to publish post. Please try again.");
            setIsSubmitting(false);
            window.alert(`Error: ${err.message || "Failed to post"}`);
        }
    };

    return (
        <div className="min-h-screen bg-surface font-sans text-foreground pb-32">
            <header className="sticky top-[4.5rem] md:top-20 z-40 bg-background/90 backdrop-blur-xl border-b border-[rgba(72,72,73,0.1)] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="font-display font-bold text-lg text-foreground">Create Post</h1>
                </div>
                <Button 
                    onClick={handleSubmit} 
                    disabled={!content.trim() || content.trim().split(/\s+/).length < SHOUT_MIN_WORDS || isSubmitting}
                    className="bg-primary text-primary-foreground font-display font-bold rounded-full h-8 px-4 disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Broadcast'}
                </Button>
            </header>

            <main className="max-w-2xl mx-auto w-full p-4 md:p-6 space-y-6">
                
                {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
                        {error}
                    </div>
                )}

                {/* Main Composer Area */}
                <div className="bg-card rounded-2xl border border-border/30 overflow-hidden shadow-sm">
                    <div className="p-4 flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary font-display font-bold mt-1 overflow-hidden">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                profile?.full_name?.charAt(0) || 'T'
                            )}
                        </div>
                        <div className="flex-1">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What's happening at your business?"
                                className="w-full bg-transparent border-0 focus:ring-0 p-0 text-lg resize-none min-h-[120px] placeholder:text-muted-foreground/50 text-foreground"
                                maxLength={SHOUT_MAX_LENGTH}
                            />
                        </div>
                    </div>

                    {/* Image Preview */}
                    {imagePreview && (
                        <div className="px-4 pb-3">
                            <div className="relative rounded-xl overflow-hidden border border-border/30">
                                <img src={imagePreview} alt="Selected" className="w-full max-h-64 object-cover" />
                                <button 
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Character limit and media tools */}
                    <div className="bg-secondary border-t border-border/20 px-4 py-3 flex items-center justify-between">
                        <div className="flex gap-1 text-primary">
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                accept="image/jpeg,image/png,image/webp,image/gif" 
                                className="hidden" 
                                onChange={handleImageSelect}
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                            >
                                <ImageIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className={`text-xs font-medium flex flex-col items-end`}>
                            <span className={content.length > SHOUT_MAX_LENGTH - 20 ? 'text-orange-500' : 'text-muted-foreground'}>
                                {content.length} / {SHOUT_MAX_LENGTH}
                            </span>
                            {content.trim() && content.trim().split(/\s+/).length < SHOUT_MIN_WORDS && (
                                <span className="text-destructive text-[10px]">Min {SHOUT_MIN_WORDS} words required</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Campaign Settings HUD */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Campaign Settings</h3>
                    
                    <div className="bg-card/80 backdrop-blur-[30px] rounded-xl border border-border/30 divide-y divide-border/20">
                        {/* Duration */}
                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center border border-border/20">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-display font-bold text-sm text-foreground">Duration</p>
                                    <p className="text-xs text-muted-foreground">Permanent Post</p>
                                </div>
                            </div>
                        </div>

                        {/* Location Target */}
                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center border border-border/20">
                                    <MapPin className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="font-display font-bold text-sm text-foreground">Location Pin</p>
                                    <p className="text-xs text-primary">Downtown District</p>
                                </div>
                            </div>
                        </div>

                        {/* Visibility */}
                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center border border-border/20">
                                    <Globe className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-display font-bold text-sm text-foreground">Network</p>
                                    <p className="text-xs text-muted-foreground">Global Display</p>
                                </div>
                            </div>
                            <div className="w-10 h-5 bg-primary/20 rounded-full relative border border-primary/50">
                                <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary rounded-full shadow-[0_0_8px_rgba(143,245,255,0.8)]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
