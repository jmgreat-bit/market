'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    User,
    LogOut,
    MapPin,
    Edit3,
    Share2,
    Bookmark,
    Zap,
    Compass,
    Trophy,
    Activity,
    Clock,
    Settings,
    Shield,
    Smartphone,
    Eye,
    Loader2,
    CheckCircle2,
    Camera,
    Store,
    Phone,
    FileText,
    Check,
    X,
    Globe,
    Twitter,
    Instagram,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/lib/constants';
import { getSupabaseClient } from '@/lib/supabase/client';

interface BusinessInfo {
    id: string;
    business_name: string;
    bio: string | null;
    category: string | null;
    latitude: number;
    longitude: number;
    address: string | null;
    phone: string | null;
    website_url: string | null;
    twitter_url: string | null;
    instagram_url: string | null;
    is_premium: boolean;
}

export default function ProfilePage() {
    const { profile, user, isLoading, isAuthenticated, signOut } = useUser();
    const router = useRouter();
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [bookmarkCount, setBookmarkCount] = useState(0);
    const [postCount, setPostCount] = useState(0);
    const [likedCount, setLikedCount] = useState(0);
    const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // Share Hub State
    const [isCopied, setIsCopied] = useState(false);

    // Edit Profile Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFullName, setEditFullName] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [editHeadline, setEditHeadline] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editWebsite, setEditWebsite] = useState('');
    const [editTwitter, setEditTwitter] = useState('');
    const [editInstagram, setEditInstagram] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Sync avatar from profile
    useEffect(() => {
        if (profile?.avatar_url) {
            setAvatarUrl(profile.avatar_url);
        }
    }, [profile?.avatar_url]);

    // Fetch real stats
    const fetchStats = useCallback(async () => {
        if (!profile?.id) return;
        setStatsLoading(true);

        try {
            const supabase = getSupabaseClient();

            // Bookmark count
            const { count: bCount } = await supabase
                .from('bookmarks')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id);
            setBookmarkCount(bCount || 0);

            // For traders, fetch business info and post count
            if (profile.role === 'trader') {
                const { data: biz } = await supabase
                    .from('business_details')
                    .select('*')
                    .eq('profile_id', profile.id)
                    .single();

                if (biz) {
                    setBusinessInfo(biz);

                    const { count: pCount } = await supabase
                        .from('posts')
                        .select('*', { count: 'exact', head: true })
                        .eq('business_id', biz.id);
                    setPostCount(pCount || 0);
                }
            } else {
                // For explorer users: count liked posts
                const { count: lCount } = await supabase
                    .from('post_likes')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', profile.id);
                setLikedCount(lCount || 0);
            }
        } catch (err) {
            console.warn('Failed to fetch profile stats:', err);
        } finally {
            setStatsLoading(false);
        }
    }, [profile?.id, profile?.role]);

    useEffect(() => {
        if (profile?.id) fetchStats();
    }, [profile?.id, fetchStats]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-6">
                    <User className="w-10 h-10 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2 font-display">Welcome to GeoPulse</h1>
                <p className="text-muted-foreground text-center mb-8 max-w-xs">
                    Sign in to access your profile and start exploring.
                </p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <Link href={ROUTES.LOGIN}>
                        <Button className="w-full bg-primary text-primary-foreground font-display font-bold">
                            Sign In
                        </Button>
                    </Link>
                    <Link href={ROUTES.SIGNUP}>
                        <Button variant="outline" className="w-full border-border bg-secondary text-foreground font-display hover:border-primary/50">
                            Create Account
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile?.id) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be under 2MB');
            return;
        }

        setAvatarUploading(true);

        try {
            const supabase = getSupabaseClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.id}/avatar.${fileExt}`;

            // Upload to avatars bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;

            // Update profile record
            await supabase
                .from('profiles')
                .update({ avatar_url: newUrl })
                .eq('id', profile.id);

            setAvatarUrl(newUrl);
        } catch (err) {
            console.error('Avatar upload failed:', err);
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleShare = async () => {
        if (!profile?.username) return;
        const url = `${window.location.origin}/u/${profile.username}`;
        await navigator.clipboard.writeText(url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const openEditModal = () => {
        setEditFullName(profile?.full_name || '');
        setEditUsername(profile?.username || '');
        setEditHeadline(profile?.headline || '');
        setEditBio(profile?.bio || '');
        if (profile?.role === 'trader' && businessInfo) {
            setEditWebsite(businessInfo.website_url || '');
            setEditTwitter(businessInfo.twitter_url || '');
            setEditInstagram(businessInfo.instagram_url || '');
        }
        setIsEditModalOpen(true);
    };

    const handleSaveProfile = async () => {
        if (!profile?.id) return;
        setIsSaving(true);
        try {
            const supabase = getSupabaseClient();
            
            // Basic validation
            const normalizedUsername = editUsername.toLowerCase().trim();
            if (normalizedUsername !== profile.username) {
                // Check uniqueness if changed
                const { data: existing } = await supabase.from('profiles').select('id').eq('username', normalizedUsername).maybeSingle();
                if (existing) {
                    alert('Username is already taken');
                    setIsSaving(false);
                    return;
                }
            }

            const { error: profileError } = await supabase.from('profiles').update({
                full_name: editFullName.trim(),
                username: normalizedUsername,
                headline: editHeadline.trim(),
                bio: editBio.trim()
            }).eq('id', profile.id);

            if (profileError) throw profileError;

            if (profile.role === 'trader' && businessInfo) {
                const { error: bizError } = await supabase.from('business_details').update({
                    website_url: editWebsite.trim(),
                    twitter_url: editTwitter.trim(),
                    instagram_url: editInstagram.trim()
                }).eq('id', businessInfo.id);

                if (bizError) throw bizError;
            }
            
            // Success - reload page or let context sync (requires manual reload here for instant visual update since context syncs on auth event)
            window.location.reload();
        } catch (err) {
            console.error('Failed to save profile:', err);
            alert('Failed to save profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace('/auth/login');
        router.refresh();
    };

    const isTrader = profile?.role === 'trader';
    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Navigator One';
    const displayRole = isTrader ? 'Verified Trader' : 'Urban Explorer';
    const displayId = `ID: ${profile?.id?.substring(0, 8).toUpperCase() || 'X-0000'}`;

    return (
        <div className="min-h-screen flex flex-col items-center pb-32 md:pb-12">
            <div className="w-full max-w-2xl mx-auto px-6 pt-8 flex flex-col gap-6">
                
                {/* Profile Card */}
                <div className="flex flex-col items-center py-8 bg-card rounded-2xl border border-border/30 relative overflow-hidden">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                    
                    {/* Avatar with upload */}
                    <div className="relative z-10 mb-4">
                        <div className="w-24 h-24 rounded-full geo-gradient p-[2.5px]">
                            <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-display text-4xl font-bold uppercase">
                                        {displayName.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Camera overlay for upload */}
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                        <button 
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={avatarUploading}
                            className="absolute -bottom-1 -right-1 bg-primary p-1.5 rounded-full border-2 border-card shadow-lg hover:scale-110 transition-transform"
                        >
                            {avatarUploading ? (
                                <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                            ) : (
                                <Camera className="w-4 h-4 text-primary-foreground" />
                            )}
                        </button>
                    </div>

                    {/* Name & Role */}
                    <h2 className={`font-display text-2xl font-bold z-10 flex items-center gap-2 ${profile?.is_premium ? 'text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]' : 'text-foreground'}`}>
                        {displayName}
                        {profile?.is_premium && <Sparkles className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />}
                    </h2>
                    {profile?.headline && (
                        <p className="text-primary font-medium text-sm z-10 mt-1">{profile.headline}</p>
                    )}
                    <p className="text-muted-foreground text-sm z-10 mt-0.5">{displayRole} • {displayId}</p>
                    {profile?.bio && (
                        <p className="text-muted-foreground text-sm z-10 mt-3 text-center max-w-xs leading-relaxed">
                            {profile.bio}
                        </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-5 z-10">
                        <button 
                            onClick={openEditModal}
                            className="bg-primary text-primary-foreground font-display font-bold py-2.5 px-6 rounded-full text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
                        >
                            <Edit3 className="w-4 h-4" />
                            Edit Profile
                        </button>
                        <button 
                            onClick={handleShare}
                            className="bg-secondary border border-border text-foreground font-display font-medium py-2.5 px-6 rounded-full text-sm flex items-center gap-2 hover:border-primary/50 transition-colors"
                        >
                            {isCopied ? (
                                <>
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span className="text-green-500">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Share2 className="w-4 h-4" />
                                    <span>Share Hub</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Business Info Card — Traders only */}
                {isTrader && businessInfo && (
                    <div className="bg-card rounded-2xl border border-border/30 p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Store className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-lg text-foreground">{businessInfo.business_name}</h3>
                                {businessInfo.category && (
                                    <span className="text-xs text-primary font-medium">{businessInfo.category}</span>
                                )}
                            </div>
                        </div>

                        {businessInfo.bio && (
                            <p className="text-sm text-muted-foreground leading-relaxed">{businessInfo.bio}</p>
                        )}

                        <div className="space-y-2">
                            {businessInfo.address && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                                    <span>{businessInfo.address}</span>
                                </div>
                            )}
                            {businessInfo.phone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                                    <span>{businessInfo.phone}</span>
                                </div>
                            )}
                            {businessInfo.website_url && (
                                <a href={businessInfo.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                                    <Globe className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{businessInfo.website_url.replace(/^https?:\/\//, '')}</span>
                                </a>
                            )}
                            {businessInfo.twitter_url && (
                                <a href={businessInfo.twitter_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                                    <Twitter className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{businessInfo.twitter_url.replace(/^https?:\/\/(www\.)?twitter\.com\//, '@')}</span>
                                </a>
                            )}
                            {businessInfo.instagram_url && (
                                <a href={businessInfo.instagram_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                                    <Instagram className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{businessInfo.instagram_url.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@')}</span>
                                </a>
                            )}
                        </div>

                        {/* Mini map preview */}
                        {businessInfo.latitude && businessInfo.longitude && (
                            <Link 
                                href={`/map`} 
                                className="block w-full h-32 rounded-xl overflow-hidden border border-border/30 relative bg-secondary group"
                            >
                                <img 
                                    src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+8ff5ff(${businessInfo.longitude},${businessInfo.latitude})/${businessInfo.longitude},${businessInfo.latitude},14,0/400x160@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''}`}
                                    alt="Business location"
                                    className="w-full h-full object-cover opacity-60"
                                    onError={(e) => {
                                        // Fallback if no mapbox token
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-4 py-2 flex items-center gap-2 group-hover:bg-primary/30 transition-colors">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        <span className="text-xs font-display font-bold text-primary">View on Map</span>
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Posts / Pulses */}
                    <div className="bg-card rounded-xl p-5 border border-border/30 relative overflow-hidden">
                        <Compass className="w-5 h-5 text-primary mb-3" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">
                            {isTrader ? 'Posts Created' : 'Posts Liked'}
                        </p>
                        {statsLoading ? (
                            <div className="h-9 bg-secondary rounded-lg animate-pulse w-16" />
                        ) : (
                            <p className="font-display text-3xl font-bold text-foreground">
                                {isTrader ? postCount : likedCount}
                            </p>
                        )}
                    </div>

                    {/* Saved Hubs */}
                    <Link href={ROUTES.SAVED} className="bg-card rounded-xl p-5 border border-border/30 relative overflow-hidden block transition-colors hover:border-primary/50 group">
                        <Bookmark className="w-5 h-5 text-primary mb-3 group-hover:scale-110 transition-transform" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Saved Posts</p>
                        {statsLoading ? (
                            <div className="h-9 bg-secondary rounded-lg animate-pulse w-16" />
                        ) : (
                            <p className="font-display text-3xl font-bold text-foreground">{bookmarkCount}</p>
                        )}
                    </Link>

                    {/* Explorer Rank / Premium */}
                    <div className="bg-gradient-to-br from-primary/10 to-accent/5 rounded-xl p-5 border border-primary/20 relative overflow-hidden">
                        <Trophy className="w-5 h-5 text-primary mb-3" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">
                            {isTrader ? 'Status' : 'Explorer Rank'}
                        </p>
                        <p className="font-display text-3xl font-bold text-foreground">
                            {isTrader ? (businessInfo?.is_premium ? '⭐ PRO' : 'Active') : 'New'}
                        </p>
                    </div>
                </div>

                {/* Trader Dashboard */}
                {isTrader && (
                    <div className="space-y-3 mt-2">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="font-display text-lg font-bold text-foreground">Trader Campaign Manager</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Link 
                                href={ROUTES.COMPOSE}
                                className="bg-primary/10 border border-primary/30 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:bg-primary/20 hover:border-primary/50 transition-all group"
                            >
                                <Zap className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-display font-bold text-primary">Create Post</span>
                            </Link>
                            <Link 
                                href={ROUTES.ANALYTICS}
                                className="bg-card border border-border/30 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:bg-secondary hover:border-border/50 transition-all group"
                            >
                                <Activity className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
                                <span className="text-sm font-display font-bold text-foreground">Analytics Data</span>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Access & Security */}
                <div className="space-y-3">
                    <h3 className="font-display text-lg font-bold text-foreground px-1">Access & Security</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <SecurityCard icon={<Settings className="w-6 h-6" />} label="Preferences" href="/menu" />
                        <SecurityCard icon={<Shield className="w-6 h-6" />} label="Privacy" />
                        <SecurityCard icon={<Smartphone className="w-6 h-6" />} label="Devices" />
                        <button 
                            onClick={handleSignOut}
                            className="bg-card border border-border/30 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:bg-destructive/10 hover:border-destructive/30 transition-all group"
                        >
                            <LogOut className="w-6 h-6 text-muted-foreground group-hover:text-destructive transition-colors" />
                            <span className="text-xs font-medium text-muted-foreground group-hover:text-destructive transition-colors">Disconnect</span>
                        </button>
                    </div>
                </div>

                {/* Profile Visibility - Disabled for now */}
                <div className="flex items-center justify-between bg-card rounded-xl p-4 px-5 border border-border/30 opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                        <Eye className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium text-sm text-foreground">Profile Visibility</span>
                    </div>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                        Public
                    </span>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-md rounded-2xl border border-border/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-4 border-b border-border/30">
                            <h2 className="font-display font-bold text-lg text-foreground">Edit Profile</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-foreground">Full Name</Label>
                                <Input 
                                    value={editFullName} 
                                    onChange={e => setEditFullName(e.target.value)} 
                                    className="bg-input border-border focus:border-primary/50"
                                    maxLength={50}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground">Username</Label>
                                <Input 
                                    value={editUsername} 
                                    onChange={e => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())} 
                                    className="bg-input border-border focus:border-primary/50"
                                    maxLength={20}
                                />
                                <p className="text-[10px] text-muted-foreground">Letters, numbers, underscores only.</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground">Headline</Label>
                                <Input 
                                    value={editHeadline} 
                                    onChange={e => setEditHeadline(e.target.value)} 
                                    placeholder="e.g. Urban Explorer, Tech Builder"
                                    className="bg-input border-border focus:border-primary/50"
                                    maxLength={40}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground">Bio</Label>
                                <textarea 
                                    value={editBio} 
                                    onChange={e => setEditBio(e.target.value)} 
                                    placeholder="Tell the community about yourself..."
                                    className="w-full h-24 p-3 bg-input border border-border rounded-xl text-sm focus:outline-none focus:border-primary/50 resize-none text-foreground placeholder:text-muted-foreground"
                                    maxLength={160}
                                />
                            </div>
                            
                            {isTrader && (
                                <>
                                    <div className="space-y-2 pt-2 border-t border-border/30">
                                        <Label className="text-foreground">Website URL</Label>
                                        <Input 
                                            value={editWebsite} 
                                            onChange={e => setEditWebsite(e.target.value)} 
                                            placeholder="https://yourwebsite.com"
                                            className="bg-input border-border focus:border-primary/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-foreground">Twitter / X URL</Label>
                                        <Input 
                                            value={editTwitter} 
                                            onChange={e => setEditTwitter(e.target.value)} 
                                            placeholder="https://twitter.com/yourhandle"
                                            className="bg-input border-border focus:border-primary/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-foreground">Instagram URL</Label>
                                        <Input 
                                            value={editInstagram} 
                                            onChange={e => setEditInstagram(e.target.value)} 
                                            placeholder="https://instagram.com/yourhandle"
                                            className="bg-input border-border focus:border-primary/50"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="p-4 border-t border-border/30 bg-secondary/30 flex gap-3">
                            <Button variant="outline" className="flex-1 border-border" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                            <Button 
                                className="flex-1 bg-primary text-primary-foreground font-bold" 
                                onClick={handleSaveProfile}
                                disabled={!editUsername || !editFullName || isSaving}
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SecurityCard({ icon, label, href }: { icon: any, label: string, href?: string }) {
    const Component = href ? Link : 'button';
    return (
        <Component
            href={href as string}
            disabled={!href}
            className={`bg-card border border-border/30 rounded-xl p-5 flex flex-col items-center justify-center gap-2 transition-all ${
                href 
                ? 'hover:bg-secondary hover:border-primary/20' 
                : 'opacity-50 cursor-not-allowed'
            }`}
        >
            <div className="text-muted-foreground">{icon}</div>
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </Component>
    );
}
