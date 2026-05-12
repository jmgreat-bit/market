import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import {
    MapPin,
    Store,
    Phone,
    Trophy,
    Globe,
    Twitter,
    Instagram,
    Sparkles,
    MessageCircle,
    Compass,
    Navigation
} from 'lucide-react';
import { FeedList } from '@/components/features/feed/FeedList';

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

    if (!profile) {
        notFound();
    }

    // 2. Fetch Business Details & Posts
    let businessInfo = null;
    let posts = [];
    let directionPhotos: any[] = [];

    if (profile.role === 'trader') {
        const { data: biz } = await supabase
            .from('business_details')
            .select('*')
            .eq('profile_id', profile.id)
            .single();
        businessInfo = biz;

        if (biz) {
            // Fetch posts with poll_options, sorted by pinned first
            const { data: postData } = await supabase
                .from('posts')
                .select(`
                    *,
                    business:business_details(
                        *,
                        profile:profiles(avatar_url, full_name)
                    ),
                    likes:likes(count),
                    comments:comments(count),
                    poll_options:poll_options(id, post_id, label, votes_count, created_at)
                `)
                .eq('business_id', biz.id)
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });
            posts = (postData || []).map((post: any) => ({
                ...post,
                likes_count: post.likes?.[0]?.count ?? 0,
                comments_count: post.comments?.[0]?.count ?? 0,
            }));

            // Fetch direction photos
            const { data: dirPhotos } = await supabase
                .from('direction_photos')
                .select('*')
                .eq('business_id', biz.id)
                .order('sort_order', { ascending: true });
            directionPhotos = dirPhotos || [];
        }
    }

    const isTrader = profile.role === 'trader';
    const displayName = profile.full_name || resolvedParams.username || 'Navigator';
    const displayRole = isTrader ? 'Verified Trader' : 'Urban Explorer';

    return (
        <div className="min-h-screen flex flex-col items-center pb-32 md:pb-12 bg-background">
            <div className="w-full max-w-2xl mx-auto px-6 pt-8 flex flex-col gap-8">
                
                {/* Profile Card */}
                <div className="flex flex-col items-center py-8 bg-card rounded-3xl border border-border/30 relative overflow-hidden shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                    
                    <div className="relative z-10 mb-4">
                        <div className="w-24 h-24 rounded-full geo-gradient p-[2.5px] shadow-lg">
                            <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-display text-4xl font-bold uppercase">
                                        {displayName.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <h2 className={`font-display text-2xl font-bold z-10 flex items-center gap-2 ${profile.is_premium ? 'text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-primary' : 'text-foreground'}`}>
                        {displayName}
                        {profile.is_premium && <Sparkles className="w-5 h-5 text-primary" />}
                    </h2>
                    <p className="text-muted-foreground text-sm z-10 mt-0.5">@{profile.username} • {displayRole}</p>
                    
                        <p className="text-muted-foreground text-sm z-10 mt-4 text-center max-w-xs px-4 leading-relaxed italic">
                            &quot;{profile.bio}&quot;
                        </p>
                </div>

                {/* Posts Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-display font-black text-xl tracking-tight flex items-center gap-2">
                            {isTrader ? <MessageCircle className="w-5 h-5 text-primary" /> : null}
                            {isTrader ? 'Live Pulses' : 'Recent Activity'}
                        </h3>
                        <span className="bg-secondary px-3 py-1 rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {posts.length} Posts
                        </span>
                    </div>

                    {posts.length > 0 ? (
                        <FeedList posts={posts as any} isLoading={false} error={null} />
                    ) : (
                        <div className="text-center py-16 bg-card/50 rounded-3xl border border-dashed border-border/50">
                            <p className="text-muted-foreground text-sm font-medium">No pulses broadcasted yet.</p>
                        </div>
                    )}
                </div>

                {/* How to Find Us — Directions */}
                {isTrader && businessInfo && (businessInfo.address || directionPhotos.length > 0) && (
                    <div className="bg-card rounded-2xl border border-border/30 p-6 space-y-4 shadow-geo-glow/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Compass className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-lg text-foreground">How to Find Us</h3>
                                <span className="text-xs text-muted-foreground">Step-by-step directions</span>
                            </div>
                        </div>

                        {businessInfo.address && (
                            <div className="bg-secondary/50 rounded-xl p-4 border border-border/20">
                                <div className="flex items-start gap-2">
                                    <Navigation className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{businessInfo.address}</p>
                                </div>
                            </div>
                        )}

                        {directionPhotos.length > 0 && (
                            <div className="space-y-3">
                                {directionPhotos.map((photo: any, idx: number) => (
                                    <div key={photo.id} className="rounded-xl overflow-hidden border border-border/20">
                                        <div className="relative">
                                            <img src={photo.image_url} alt={`Step ${idx + 1}`} className="w-full aspect-video object-cover" />
                                            <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest border border-primary/20">
                                                Step {idx + 1}
                                            </div>
                                        </div>
                                        {photo.caption && (
                                            <div className="px-4 py-2.5 bg-secondary/30">
                                                <p className="text-xs text-foreground/70">{photo.caption}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Business details */}
                {isTrader && businessInfo && (
                    <div className="bg-card rounded-2xl border border-border/30 p-6 space-y-4 shadow-geo-glow/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Store className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-lg text-foreground">{businessInfo.business_name}</h3>
                                <span className="text-xs text-primary font-medium">{businessInfo.category}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {businessInfo.website_url && (
                                <a href={businessInfo.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-foreground/80 hover:text-primary transition-colors">
                                    <Globe className="w-4 h-4 text-primary" />
                                    <span>{businessInfo.website_url.replace(/^https?:\/\//, '')}</span>
                                </a>
                            )}
                            {businessInfo.latitude && businessInfo.longitude && (
                                <Link href={`/map`} className="flex items-center gap-3 text-sm text-foreground/80 hover:text-primary transition-colors">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <span>View location on map</span>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
