'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { PostType } from '@/types';
import { 
    Image as ImageIcon, 
    Clock, 
    Globe, 
    ChevronLeft,
    Loader2,
    X,
    Pin,
    Hash,
    BarChart3,
    FileText,
    Plus,
    Minus,
    Trash2
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { 
    SHOUT_MAX_LENGTH, SHOUT_MIN_WORDS, IMAGE_MIN_BYTES, IMAGE_MAX_BYTES,
    COUNTER_LABEL_MAX_LENGTH, POLL_MIN_OPTIONS, POLL_MAX_OPTIONS, POLL_OPTION_MAX_LENGTH
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
    
    const [content, setContent] = useState('');
    const [postType, setPostType] = useState<PostType>('standard');
    const [isPinned, setIsPinned] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Duration based on tier
    const tier = profile?.trader_tier || 'free';
    const maxDuration = tier === 'national' ? 12 : tier === 'pro' ? 5 : 2;
    const [durationHours, setDurationHours] = useState(2);

    // Counter fields
    const [counterValue, setCounterValue] = useState(0);
    const [counterLabel, setCounterLabel] = useState('');

    // Poll fields
    const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

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
        if (file.size > IMAGE_MAX_BYTES) { setError('Image must be under 4MB'); return; }
        if (file.size < IMAGE_MIN_BYTES) { setError('Image is too small (minimum 10KB)'); return; }
        if (!file.type.startsWith('image/')) { setError('Only image files are allowed.'); return; }
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
        setError(null);
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
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
        if (!content.trim() || content.trim().split(/\s+/).length < SHOUT_MIN_WORDS) return false;
        if (postType === 'counter' && !counterLabel.trim()) return false;
        if (postType === 'poll') {
            const filled = pollOptions.filter(o => o.trim());
            if (filled.length < POLL_MIN_OPTIONS) return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!canSubmit() || isSubmitting) return;
        setIsSubmitting(true);
        setError(null);

        const timeoutId = setTimeout(() => {
            setError("Submission taking too long. Please check your connection.");
            setIsSubmitting(false);
        }, 15000);

        try {
            const supabase = getSupabaseClient();
            
            const { data: business, error: businessError } = await supabase
                .from('business_details')
                .select('id, latitude, longitude')
                .eq('profile_id', profile.id)
                .single();

            if (businessError || !business) throw new Error("Could not find your business profile.");

            let imageUrl: string | null = null;

            if (selectedImage) {
                const fileExt = selectedImage.name.split('.').pop();
                const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('post-media')
                    .upload(fileName, selectedImage, { cacheControl: '3600', upsert: false });
                if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
                const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(fileName);
                imageUrl = urlData.publicUrl;
            }

            // If pinning, unpin existing pinned posts for this business
            if (isPinned) {
                await supabase
                    .from('posts')
                    .update({ is_pinned: false })
                    .eq('business_id', business.id)
                    .eq('is_pinned', true);
            }

            // Calculate expiration
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + durationHours);

            // Create post
            const { data: newPost, error: postError } = await supabase
                .from('posts')
                .insert({
                    business_id: business.id,
                    content: content.trim(),
                    image_url: imageUrl,
                    latitude: business.latitude,
                    longitude: business.longitude,
                    post_type: postType,
                    is_pinned: isPinned,
                    counter_value: postType === 'counter' ? counterValue : null,
                    counter_label: postType === 'counter' ? counterLabel.trim() : null,
                    expires_at: expiresAt.toISOString(),
                })
                .select('id')
                .single();

            if (postError) throw postError;

            // Create poll options if poll type
            if (postType === 'poll' && newPost) {
                const options = pollOptions
                    .filter(o => o.trim())
                    .map(label => ({ post_id: newPost.id, label: label.trim() }));
                
                const { error: pollError } = await supabase
                    .from('poll_options')
                    .insert(options);
                if (pollError) throw pollError;
            }

            clearTimeout(timeoutId);
            window.alert("Post Broadcasted Successfully!");
            setIsSubmitting(false);
            window.location.href = '/feed';
        } catch (err: any) {
            clearTimeout(timeoutId);
            setError(err.message || "Failed to publish post. Please try again.");
            setIsSubmitting(false);
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
                    disabled={!canSubmit() || isSubmitting}
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

                {/* Post Type Selector */}
                <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Post Type</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {POST_TYPES.map(pt => (
                            <button
                                key={pt.id}
                                onClick={() => setPostType(pt.id)}
                                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all text-center ${
                                    postType === pt.id
                                        ? 'bg-primary text-primary-foreground border-primary font-bold'
                                        : 'bg-card border-border/50 text-muted-foreground hover:border-primary/40'
                                }`}
                            >
                                {pt.icon}
                                <span className="text-xs font-bold">{pt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Composer Area — Always visible for all types */}
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
                                placeholder={
                                    postType === 'counter' ? "Describe what this counter is for..."
                                    : postType === 'poll' ? "Ask your question or describe the poll..."
                                    : "What's happening at your business?"
                                }
                                className="w-full bg-transparent border-0 focus:ring-0 p-0 text-lg resize-none min-h-[100px] placeholder:text-muted-foreground/50 text-foreground"
                                maxLength={SHOUT_MAX_LENGTH}
                            />
                        </div>
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
                    
                    {/* Bottom toolbar */}
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
                        {/* Pin Toggle */}
                        <button
                            onClick={() => setIsPinned(!isPinned)}
                            className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-border/20 transition-colors ${isPinned ? 'bg-primary/20' : 'bg-secondary'}`}>
                                    <Pin className={`w-4 h-4 transition-colors ${isPinned ? 'text-primary' : 'text-muted-foreground'}`} />
                                </div>
                                <div className="text-left">
                                    <p className="font-display font-bold text-sm text-foreground">Pin Post</p>
                                    <p className="text-xs text-muted-foreground">{isPinned ? 'Pinned — always shown first' : 'Not pinned'}</p>
                                </div>
                            </div>
                            <div className={`w-10 h-5 rounded-full relative border transition-all ${isPinned ? 'bg-primary/20 border-primary/50' : 'bg-secondary border-border/50'}`}>
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full shadow transition-all ${isPinned ? 'right-0.5 bg-primary shadow-[0_0_8px_rgba(143,245,255,0.8)]' : 'left-0.5 bg-muted-foreground'}`} />
                            </div>
                        </button>

                        {/* Duration */}
                        <div className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center border border-border/20">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-display font-bold text-sm text-foreground">Duration</p>
                                    <p className="text-xs text-muted-foreground">How long post stays on feed</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="range" 
                                    min="1" 
                                    max={maxDuration} 
                                    value={durationHours} 
                                    onChange={(e) => setDurationHours(parseInt(e.target.value))}
                                    className="w-20 md:w-24 accent-primary"
                                />
                                <span className="text-sm font-bold w-12 text-right">{durationHours} hr{durationHours > 1 ? 's' : ''}</span>
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
