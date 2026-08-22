'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { PostType } from '@/types';
import { 
    Image as ImageIcon, 
    Clock, 
    ChevronLeft,
    Loader2,
    X,
    Hash,
    BarChart3,
    FileText,
    Plus,
    Minus,
    Trash2,
    Camera
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { 
    SHOUT_MAX_LENGTH, SHOUT_MIN_WORDS, IMAGE_MIN_BYTES, IMAGE_MAX_BYTES,
    COUNTER_LABEL_MAX_LENGTH, POLL_MIN_OPTIONS, POLL_MAX_OPTIONS, POLL_OPTION_MAX_LENGTH,
    DEFAULT_MAP_CENTER
} from '@/lib/constants';

const POST_TYPES: { id: PostType; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'standard', label: 'Standard', desc: 'Text & image post', icon: <FileText className="w-4 h-4" /> },
    { id: 'counter', label: 'Counter', desc: 'Live number display', icon: <Hash className="w-4 h-4" /> },
    { id: 'poll', label: 'Poll', desc: 'Vote & engage', icon: <BarChart3 className="w-4 h-4" /> },
];

export default function ComposePage() {
    const { profile, isAuthenticated, isLoading: authLoading } = useUser();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    
    const [content, setContent] = useState('');
    const [postType, setPostType] = useState<PostType>('standard');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const MAX_PHOTOS = 5;

    // Duration based on tier (TTL rules: Free = 3h, Pro = 9h, National = 24h)
    const tier = profile?.trader_tier || 'free';
    const maxDuration = tier === 'national' ? 24 : tier === 'pro' ? 9 : 3;
    const [durationHours, setDurationHours] = useState(maxDuration);

    useEffect(() => {
        const calculatedMax = tier === 'national' ? 24 : tier === 'pro' ? 9 : 3;
        setDurationHours(calculatedMax);
    }, [tier]);

    // Counter fields
    const [counterValue, setCounterValue] = useState(0);
    const [counterLabel, setCounterLabel] = useState('');

    // Poll fields
    const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

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
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        
        const remainingSlots = MAX_PHOTOS - selectedImages.length;
        const validFiles = files.filter(f => {
            if (!f.type.startsWith('image/')) return false;
            if (f.size > IMAGE_MAX_BYTES || f.size < IMAGE_MIN_BYTES) return false;
            return true;
        }).slice(0, remainingSlots);
        
        if (validFiles.length < files.length) {
            setError(remainingSlots === 0 ? 'Maximum 5 photos allowed.' : 'Some files were skipped (max 5 images allowed).');
        } else {
            setError(null);
        }

        if (validFiles.length > 0) {
            setSelectedImages(prev => [...prev, ...validFiles]);
            
            validFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
        
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const addPollOption = () => {
        if (pollOptions.length < POLL_MAX_OPTIONS) setPollOptions([...pollOptions, '']);
    };

    const removePollOption = (idx: number) => {
        if (pollOptions.length > POLL_MIN_OPTIONS) setPollOptions(pollOptions.filter((_, i) => i !== idx));
    };

    const updatePollOption = (idx: number, value: string) => {
        const updated = [...pollOptions];
        updated[idx] = value;
        setPollOptions(updated);
    };

    const canSubmit = () => {
        const hasContent = content.trim().length > 0;
        const hasImages = selectedImages.length > 0;

        if (postType === 'counter') {
            return counterLabel.trim().length > 0;
        }

        if (postType === 'poll') {
            const filled = pollOptions.filter(o => o.trim());
            return filled.length >= POLL_MIN_OPTIONS;
        }

        return hasContent || hasImages;
    };

    const handleSubmit = async () => {
        if (!canSubmit() || isSubmitting) return;
        setIsSubmitting(true);
        setError(null);

        const timeoutId = setTimeout(() => {
            setError("This is taking longer than usual. If it fails, please check your connection and try again.");
            setIsSubmitting(false);
        }, 60000);

        try {
            const supabase = getSupabaseClient();

            let imageUrl: string | null = null;
            let uploadedUrls: string[] = [];

            if (selectedImages.length > 0) {
                uploadedUrls = await Promise.all(selectedImages.map(async (img) => {
                    const fileExt = img.name.split('.').pop();
                    const fileName = `${profile.id}/${Date.now()}-${Math.random().toString(36).substring(2,8)}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage
                        .from('post-media')
                        .upload(fileName, img, { cacheControl: '3600', upsert: false });
                    
                    if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
                    
                    const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(fileName);
                    return urlData.publicUrl;
                }));
                
                if (uploadedUrls.length > 0) {
                    imageUrl = uploadedUrls[0];
                }
            }

            const response = await fetch('/api/posts/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: content.trim(),
                    imageUrl,
                    uploadedUrls,
                    postType,
                    durationHours,
                    counterValue: postType === 'counter' ? counterValue : null,
                    counterLabel: postType === 'counter' ? counterLabel.trim() : null,
                    pollOptions: postType === 'poll' ? pollOptions : [],
                }),
            });

            const result = await response.json();
            if (!response.ok || result.error) {
                throw new Error(result.error || "Failed to publish post. Please try again.");
            }

            clearTimeout(timeoutId);
            setIsSubmitting(false);
            router.push('/feed');
        } catch (err: any) {
            clearTimeout(timeoutId);
            setError(err.message || "Failed to publish post. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface font-sans text-foreground pb-32">
            <header className="sticky top-0 md:top-20 z-40 bg-background/95 backdrop-blur-xl border-b border-border/40 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="font-display font-bold text-lg text-foreground tracking-tight">Create Post</h1>
                </div>
                <Button 
                    onClick={handleSubmit} 
                    disabled={!canSubmit() || isSubmitting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold rounded-full py-2 px-5 h-auto disabled:opacity-50 transition-all shadow-sm"
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Broadcast'}
                </Button>
            </header>

            <main className="max-w-2xl mx-auto w-full p-4 md:p-6 space-y-6">
                
                {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg font-medium">
                        {error}
                    </div>
                )}

                {/* Post Type Selector */}
                <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Post Type</h3>
                    <div className="grid grid-cols-3 gap-2 bg-secondary/30 p-1.5 rounded-2xl">
                        {POST_TYPES.map(pt => (
                            <button
                                key={pt.id}
                                onClick={() => setPostType(pt.id)}
                                className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-300 text-center ${
                                    postType === pt.id
                                        ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                                        : 'bg-transparent text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                                }`}
                            >
                                {pt.icon}
                                <span className="text-xs font-bold">{pt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Composer Area — Always visible for all types */}
                <div className="bg-card rounded-3xl border border-border/40 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                    <div className="p-5 flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/20 to-primary/10 flex-shrink-0 flex items-center justify-center text-primary font-display font-bold mt-1 overflow-hidden border border-primary/20">
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
                                placeholder={
                                    postType === 'counter' ? "Describe what this counter is for..."
                                    : postType === 'poll' ? "Ask your question or describe the poll..."
                                    : "What's happening at your business?"
                                }
                                className="w-full bg-transparent border-0 focus:ring-0 p-0 text-lg resize-none min-h-[120px] placeholder:text-muted-foreground/50 text-foreground font-medium leading-relaxed"
                                maxLength={SHOUT_MAX_LENGTH}
                            />
                        </div>
                    </div>
                    
                    {/* Category Hash Chips */}
                    <div className="px-5 pb-5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest shrink-0 mr-1">Tags:</span>
                        {['#Food', '#Housing', '#Car', '#Retail', '#Service', '#Event'].map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                    if (!content.toLowerCase().includes(cat.toLowerCase())) {
                                        setContent(prev => prev ? `${prev} ${cat}` : cat);
                                    }
                                }}
                                className="shrink-0 px-3 py-1.5 rounded-full bg-secondary/60 text-xs font-bold text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Counter Input */}
                    {postType === 'counter' && (
                        <div className="px-4 pb-4 space-y-4">
                            <div className="bg-secondary/50 rounded-2xl p-6 border border-border/30 text-center space-y-4">
                                <input
                                    type="text"
                                    value={counterLabel}
                                    onChange={(e) => setCounterLabel(e.target.value)}
                                    placeholder="Label (e.g. Batteries Available)"
                                    maxLength={COUNTER_LABEL_MAX_LENGTH}
                                    className="w-full bg-transparent text-center text-sm font-semibold text-muted-foreground placeholder:text-muted-foreground/40 border-0 focus:ring-0"
                                />
                                <div className="flex items-center justify-center gap-6">
                                    <button
                                        type="button"
                                        onClick={() => setCounterValue(Math.max(0, counterValue - 1))}
                                        className="w-12 h-12 rounded-full bg-secondary border border-border/50 flex items-center justify-center text-foreground hover:bg-primary/10 hover:border-primary/40 transition-all active:scale-90"
                                    >
                                        <Minus className="w-5 h-5" />
                                    </button>
                                    <input
                                        type="number"
                                        value={counterValue}
                                        onChange={(e) => setCounterValue(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-28 text-center text-5xl font-black text-foreground bg-transparent border-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setCounterValue(counterValue + 1)}
                                        className="w-12 h-12 rounded-full bg-secondary border border-border/50 flex items-center justify-center text-foreground hover:bg-primary/10 hover:border-primary/40 transition-all active:scale-90"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Set starting value</p>
                            </div>
                        </div>
                    )}

                    {/* Poll Options */}
                    {postType === 'poll' && (
                        <div className="px-4 pb-4 space-y-3">
                            {pollOptions.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-secondary border border-border/50 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                                        {idx + 1}
                                    </div>
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => updatePollOption(idx, e.target.value)}
                                        placeholder={`Option ${idx + 1}`}
                                        maxLength={POLL_OPTION_MAX_LENGTH}
                                        className="flex-1 bg-secondary/50 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                    {pollOptions.length > POLL_MIN_OPTIONS && (
                                        <button onClick={() => removePollOption(idx)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {pollOptions.length < POLL_MAX_OPTIONS && (
                                <button
                                    onClick={addPollOption}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border/50 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Add Option
                                </button>
                            )}
                        </div>
                    )}

                    {/* Image Preview */}
                    {imagePreviews.length > 0 && (
                        <div className="px-4 pb-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Attached Media</span>
                                <span className="text-[10px] font-bold text-primary">{imagePreviews.length} / {MAX_PHOTOS}</span>
                            </div>
                            <div className={`grid gap-2 ${imagePreviews.length === 1 ? 'grid-cols-1' : imagePreviews.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                {imagePreviews.map((preview, idx) => (
                                    <div key={idx} className="relative rounded-xl overflow-hidden border border-border/30 aspect-square group">
                                        <img src={preview} alt={`Selected ${idx}`} className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Bottom toolbar */}
                    <div className="bg-secondary border-t border-border/20 px-4 py-3 flex items-center justify-between">
                        <div className="flex gap-1 text-primary">
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                multiple
                                accept="image/jpeg,image/png,image/webp,image/gif" 
                                className="hidden" 
                                onChange={handleImageSelect}
                            />
                            <input 
                                ref={cameraInputRef}
                                type="file" 
                                multiple
                                accept="image/jpeg,image/png,image/webp,image/gif" 
                                capture="environment"
                                className="hidden" 
                                onChange={handleImageSelect}
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                                title="Upload Image"
                            >
                                <ImageIcon className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => cameraInputRef.current?.click()}
                                className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                                title="Take Photo"
                            >
                                <Camera className="w-5 h-5" />
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

                {/* Post Settings HUD */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Post Settings</h3>
                    
                    <div className="bg-card/80 backdrop-blur-[30px] rounded-xl border border-border/30 p-4">
                        {/* Duration */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                    <Clock className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="font-display font-bold text-sm text-foreground">Active Duration</p>
                                    <p className="text-xs text-muted-foreground">How long this post stays visible on the feed</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <input 
                                    type="range" 
                                    min="1" 
                                    max={maxDuration} 
                                    value={durationHours} 
                                    onChange={(e) => setDurationHours(parseInt(e.target.value))}
                                    className="flex-1 sm:w-28 accent-primary cursor-pointer"
                                />
                                <span className="text-sm font-bold w-12 text-right text-primary shrink-0">{durationHours} hr{durationHours > 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
