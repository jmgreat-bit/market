import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { MapPin, Store, Compass, Navigation, CheckCircle2, MessageCircle, Star, Flag, AlertTriangle, ShieldAlert } from 'lucide-react';
import { FeedList } from '@/components/features/feed/FeedList';
import ProfileTracker from '@/components/features/profile/ProfileTracker';
import ContactButtons from '@/components/features/profile/ContactButtons';
import ProfileReviews from '@/components/features/profile/ProfileReviews';
import TraderBadge from '@/components/ui/TraderBadge';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 60;

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> | { username: string } }) {
    const resolvedParams = await params;
    
    // 1. Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', resolvedParams.username.toLowerCase())
        .single();

    if (!profile) notFound();

    // 2. Fetch Business Details & Posts
    let businessInfo = null;
    let posts = [];
    let directionPhotos: any[] = [];
    let reviews: any[] = [];
    let averageRating = 0;
    let isReviewsEnabled = false;

    if (profile.role === 'trader') {
        const { data: biz } = await supabase
            .from('business_details')
            .select('*, hub:commercial_hubs(name)')
            .eq('profile_id', profile.id)
            .single();
        businessInfo = biz;

        if (biz) {
            // Check if reviews are enabled (graceful fallback if column doesn't exist yet)
            isReviewsEnabled = biz.is_reviews_enabled === true || biz.is_reviews_enabled === undefined;

            // Try to fetch reviews
            if (isReviewsEnabled) {
                try {
                    const { data: revs, error } = await supabase
                        .from('business_reviews')
                        .select('rating')
                        .eq('business_id', biz.id);
                    
                    if (!error && revs) {
                        reviews = revs;
                        if (revs.length > 0) {
                            averageRating = revs.reduce((acc: number, curr: any) => acc + curr.rating, 0) / revs.length;
                        }
                    }
                } catch (e) {
                    console.log('Reviews table might not exist yet');
                }
            }

            const { data: postData } = await supabase
                .from('posts')
                .select(`
                    *,
                    business:business_details(*, profile:profiles(avatar_url, full_name, username, trader_tier)),
                    likes:likes(count),
                    comments:comments(count),
                    poll_options:poll_options(id, post_id, label, votes_count, created_at)
                `)
                .eq('business_id', biz.id)
                .eq('is_hidden', false)
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });
            
            posts = (postData || []).map((post: any) => ({
                ...post,
                likes_count: post.likes?.[0]?.count ?? 0,
                comments_count: post.comments?.[0]?.count ?? 0,
            }));

            const { data: dirPhotos } = await supabase
                .from('direction_photos')
                .select('*')
                .eq('business_id', biz.id)
                .order('sort_order', { ascending: true });
            directionPhotos = dirPhotos || [];
        }
    }

    const isTrader = profile.role === 'trader';
    const displayName = (isTrader && businessInfo?.business_name) 
        ? businessInfo.business_name 
        : (profile.full_name || resolvedParams.username || 'Navigator');
    
    let isVerifiedToday = false;
    let daysSinceVerified = null;

    if (businessInfo?.last_verified_at) {
        const verifiedAt = new Date(businessInfo.last_verified_at);
        const hoursDiff = (Date.now() - verifiedAt.getTime()) / (1000 * 60 * 60);
        if (hoursDiff <= 24) isVerifiedToday = true;
        else daysSinceVerified = Math.floor(hoursDiff / 24);
    }

    return (
        <div className="min-h-screen bg-background pb-32">
            {isTrader && businessInfo && <ProfileTracker businessId={businessInfo.id} />}
            
            {/* 1. Cover Banner Container */}
            <div className="max-w-3xl mx-auto sm:px-6 sm:pt-6">
                <div className="h-32 md:h-48 w-full bg-gradient-to-r from-slate-800 to-slate-900 relative sm:rounded-3xl overflow-hidden shadow-lg border border-border/20">
                    {/* Fallback pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent bg-[length:20px_20px]" />
                    
                    {/* Report Account Button */}
                    <div className="absolute top-4 right-4">
                        <Link 
                            href={`/support?category=report&reference_type=user&reference_id=${profile.username}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white/80 hover:text-red-400 hover:bg-black/60 transition-all text-xs font-bold uppercase tracking-wider border border-white/10"
                        >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Report
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                {/* 2. Profile Header Info */}
                <div className="relative -mt-12 sm:-mt-16 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        {/* Avatar & Name */}
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background bg-card overflow-hidden shadow-xl shrink-0">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-display text-4xl sm:text-5xl font-bold uppercase">
                                        {displayName.charAt(0)}
                                    </div>
                                )}
                            </div>
                            
                            <div className="pb-1">
                                <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
                                    {displayName}
                                    {isTrader && <TraderBadge tier={profile.trader_tier || 'free'} />}
                                </h1>
                                <p className="text-muted-foreground text-sm font-medium mt-1">
                                    @{profile.username} {isTrader && businessInfo?.category && `• ${businessInfo.category}`}
                                </p>
                            </div>
                        </div>

                        {/* Ratings & Hub (Desktop right-aligned, Mobile left-aligned) */}
                        {isTrader && businessInfo && (
                            <div className="flex flex-col gap-2 pb-1">
                                {isReviewsEnabled && reviews.length > 0 && (
                                    <div className="flex items-center gap-1.5 bg-secondary/50 border border-border/50 px-3 py-1.5 rounded-full w-fit">
                                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        <span className="font-bold text-sm text-foreground">{averageRating.toFixed(1)}</span>
                                        <span className="text-xs text-muted-foreground">({reviews.length} reviews)</span>
                                    </div>
                                )}
                                {businessInfo.hub && (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                                        <Store className="w-4 h-4 text-primary" />
                                        {businessInfo.hub.name} {businessInfo.hub_stall ? `• ${businessInfo.hub_stall}` : ''}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Bio & Verification */}
                <div className="mb-8 space-y-4">
                    {profile.bio && (
                        <p className="text-foreground/90 text-sm sm:text-base leading-relaxed max-w-2xl">
                            {profile.bio}
                        </p>
                    )}
                    
                    {isTrader && (
                        <div className="flex flex-wrap items-center gap-2">
                            {isVerifiedToday ? (
                                <div className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 border border-emerald-500/20">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Location Verified Today
                                </div>
                            ) : daysSinceVerified !== null ? (
                                <div className="text-[11px] font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 border border-amber-500/20">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified {daysSinceVerified}d ago
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                {/* 4. Action Buttons (Contact) */}
                {isTrader && businessInfo && (
                    <div className="flex flex-wrap gap-3 mb-10 pb-6 border-b border-border/30">
                        <ContactButtons 
                            businessId={businessInfo.id}
                            targetProfileId={profile.id}
                            phone={businessInfo.phone}
                            websiteUrl={businessInfo.website_url}
                        />
                        {businessInfo.latitude && businessInfo.longitude && (
                            <Link href="/map" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-foreground font-bold rounded-xl hover:bg-secondary/80 transition-all text-sm flex-1 sm:flex-none">
                                <MapPin className="w-4 h-4 text-primary" />
                                Map
                            </Link>
                        )}
                    </div>
                )}

                {/* 5. Main Content Grid (Posts & Directions) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left/Main Column: Posts */}
                    <div className="lg:col-span-2 space-y-6">
                        <h3 className="font-display font-black text-xl tracking-tight flex items-center gap-2">
                            {isTrader ? <MessageCircle className="w-5 h-5 text-primary" /> : null}
                            {isTrader ? 'Live Pulses' : 'Recent Activity'}
                        </h3>

                        {posts.length > 0 ? (
                            <FeedList posts={posts as any} isLoading={false} error={null} />
                        ) : (
                            <div className="text-center py-12 bg-secondary/20 rounded-2xl border border-dashed border-border/50">
                                <p className="text-muted-foreground text-sm font-medium">No activity yet.</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Sidebar (Directions) */}
                    {isTrader && businessInfo && (businessInfo.address || directionPhotos.length > 0) && (
                        <div className="space-y-6">
                            <div className="bg-card rounded-2xl border border-border/30 p-5 shadow-sm">
                                <div className="flex items-center gap-2.5 mb-4">
                                    <Compass className="w-5 h-5 text-primary" />
                                    <h3 className="font-display font-bold text-lg text-foreground">How to Find Us</h3>
                                </div>

                                {businessInfo.address && (
                                    <div className="bg-secondary/50 rounded-xl p-3 mb-4">
                                        <div className="flex items-start gap-2">
                                            <Navigation className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                            <p className="text-sm text-foreground/80 leading-relaxed">{businessInfo.address}</p>
                                        </div>
                                    </div>
                                )}

                                {directionPhotos.length > 0 && (
                                    <div className="space-y-3">
                                        {directionPhotos.map((photo: any, idx: number) => (
                                            <div key={photo.id} className="rounded-xl overflow-hidden relative">
                                                <img src={photo.image_url} alt={`Step ${idx + 1}`} className="w-full aspect-video object-cover" />
                                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-white uppercase">
                                                    Step {idx + 1}
                                                </div>
                                                {photo.caption && (
                                                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                                        <p className="text-xs text-white/90 truncate">{photo.caption}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {/* Reviews Component */}
                            {isReviewsEnabled && businessInfo.business_name && (
                                <div className="mt-6">
                                    <ProfileReviews 
                                        businessId={businessInfo.id}
                                        initialReviews={reviews}
                                        averageRating={averageRating}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
