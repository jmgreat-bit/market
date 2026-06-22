'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PostWithBusiness, Comment } from '@/types';
import { CommentSection } from './CommentSection';
import { PostHeader } from './PostHeader';
import { PostBody } from './PostBody';
import { PostActions } from './PostActions';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { Pin, Bell, BellOff, Loader2, Zap, X } from 'lucide-react';
import { BoostModal } from './BoostModal';

interface PostCardProps {
    post: PostWithBusiness;
    autoExpandComments?: boolean;
    isModalView?: boolean;
}

export function PostCard({ post, autoExpandComments = false, isModalView = false }: PostCardProps) {
    const { profile } = useUser();
    const supabase = useMemo(() => getSupabaseClient(), []);
    const [isLiked, setIsLiked] = useState(post.is_liked ?? false);
    const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);
    const [showComments, setShowComments] = useState(autoExpandComments);
    const initialComments = Array.isArray(post.comments) && post.comments.length > 0 && 'id' in post.comments[0] 
        ? post.comments 
        : [];
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [commentsCount, setCommentsCount] = useState(post.comments_count ?? 0);
    const [commentsFetched, setCommentsFetched] = useState(
        (post.comments_count ?? 0) === 0 || initialComments.length > 0
    );
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subLoading, setSubLoading] = useState(false);
    const [showBoostModal, setShowBoostModal] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Boost Eligibility
    const isOwner = profile?.id === post.business?.profile_id;
    const isEligibleForBoost = isOwner && (profile?.trader_tier === 'pro' || profile?.trader_tier === 'national');

    // Analytics tracking
    const cardRef = useRef<HTMLDivElement>(null);
    const entry = useIntersectionObserver(cardRef, { threshold: 0.5, freezeOnceVisible: true });
    const { logPostView } = useAnalytics();

    useEffect(() => {
        if (entry?.isIntersecting) {
            logPostView(post.id);
        }
    }, [entry?.isIntersecting, post.id, logPostView]);

    // Check like status
    useEffect(() => {
        if (!profile?.id) return;
        supabase
            .from('likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', profile.id)
            .maybeSingle()
            .then(({ data }: { data: { id: string } | null }) => {
                setIsLiked(!!data);
            });
    }, [post.id, profile?.id, supabase]);

    // Check subscription status for pinned posts
    useEffect(() => {
        if (!profile?.id || !post.is_pinned) return;
        supabase
            .from('post_subscriptions')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', profile.id)
            .maybeSingle()
            .then(({ data }: { data: { id: string } | null }) => {
                setIsSubscribed(!!data);
            });
    }, [post.id, post.is_pinned, profile?.id, supabase]);

    const fetchComments = useCallback(async () => {
        if (commentsFetched || commentsCount === 0) return;
        try {
            const { data } = await supabase
                .from('comments')
                .select(`
                    *,
                    user:profiles(full_name, username, avatar_url)
                `)
                .eq('post_id', post.id)
                .order('created_at', { ascending: true });

            if (data) {
                const transformedComments = data.map((c: any) => ({
                    ...c,
                    user_name: c.user?.full_name || c.user?.username || 'User',
                    user_avatar: c.user?.avatar_url
                }));
                setComments(transformedComments as Comment[]);
                setCommentsCount(data.length);
                setCommentsFetched(true);
            }
        } catch (err) {
            console.warn('Failed to fetch comments:', err);
        }
    }, [post.id, commentsFetched, supabase]);

    const handleToggleComments = () => {
        const next = !showComments;
        setShowComments(next);
        if (next) fetchComments();
    };

    const handleLike = useCallback(async () => {
        if (!profile?.id) return;
        const wasLiked = isLiked;
        setIsLiked(!wasLiked);
        setLikesCount(wasLiked ? likesCount - 1 : likesCount + 1);

        try {
            if (wasLiked) {
                await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', profile.id);
            } else {
                await supabase.from('likes').insert({ post_id: post.id, user_id: profile.id });
            }
        } catch (err) {
            console.error('Like toggle failed:', err);
            setIsLiked(wasLiked);
            setLikesCount(wasLiked ? likesCount : likesCount - 1);
        }
    }, [isLiked, likesCount, post.id, profile?.id, supabase]);

    const handleToggleSubscription = async () => {
        if (!profile?.id || subLoading) return;
        setSubLoading(true);
        try {
            if (isSubscribed) {
                await supabase
                    .from('post_subscriptions')
                    .delete()
                    .eq('post_id', post.id)
                    .eq('user_id', profile.id);
                setIsSubscribed(false);
            } else {
                await supabase
                    .from('post_subscriptions')
                    .insert({ post_id: post.id, user_id: profile.id });
                setIsSubscribed(true);
            }
        } catch (err) {
            console.error('Subscription toggle failed:', err);
        } finally {
            setSubLoading(false);
        }
    };

    const handleCommentAdded = (newComment: Comment) => {
        setComments(prev => [...prev, newComment]);
        setCommentsCount(prev => prev + 1);
    };

    const handleCardClick = (e: React.MouseEvent) => {
        if (isModalView) return;
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) {
            return;
        }
        setIsModalOpen(true);
    };

    const business = post.business;

    return (
        <>
            <motion.div
                ref={cardRef}
                onClick={handleCardClick}
                initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg overflow-hidden bg-card/80 backdrop-blur-[30px] shadow-[0_0_32px_rgba(143,245,255,0.08)] border border-border/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(143,245,255,0.12)] ${!isModalView ? 'cursor-pointer hover:border-primary/50' : ''}`}
        >
            <div className="flex flex-col bg-transparent">
                {/* Pinned Badge */}
                {post.is_pinned && (
                    <div className="px-4 pt-3 pb-0 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-primary">
                            <Pin className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Pinned</span>
                        </div>
                        {profile?.id && (
                            <button
                                onClick={handleToggleSubscription}
                                disabled={subLoading}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                    isSubscribed
                                        ? 'bg-primary/10 border-primary/30 text-primary'
                                        : 'bg-secondary border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary'
                                }`}
                            >
                                {subLoading ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : isSubscribed ? (
                                    <><BellOff className="w-3 h-3" /> Following</>
                                ) : (
                                    <><Bell className="w-3 h-3" /> Follow</>
                                )}
                            </button>
                        )}
                    </div>
                )}

                {/* Ad Badge */}
                {(post as any).is_ad && (
                    <div className="px-4 pt-3 pb-0 flex items-center gap-1.5 text-primary">
                        <Zap className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Sponsored</span>
                    </div>
                )}

                {/* Header Container */}
                <div className="relative">
                    <PostHeader
                        businessName={business?.business_name}
                        category={business?.category ?? undefined}
                        isPremium={business?.is_premium}
                        traderTier={(business as any)?.profile?.trader_tier}
                        createdAt={post.created_at}
                        expiresAt={post.expires_at}
                        avatarUrl={(business as any)?.profile?.avatar_url}
                        profileUsername={(business as any)?.profile?.username}
                    />
                    
                    {/* Boost Button for Owner */}
                    {isEligibleForBoost && (
                        <button 
                            onClick={() => setShowBoostModal(true)}
                            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                        >
                            <Zap className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Boost</span>
                        </button>
                    )}
                </div>

                {/* Content */}
                <PostBody
                    content={post.content}
                    imageUrl={post.image_url ?? undefined}
                    images={post.images}
                    link={post.link}
                    latitude={post.latitude}
                    longitude={post.longitude}
                    postType={post.post_type || 'standard'}
                    postId={post.id}
                    counterValue={post.counter_value}
                    counterLabel={post.counter_label}
                    pollOptions={post.poll_options}
                    businessProfileId={business?.profile_id}
                />

                {/* Actions */}
                <PostActions
                    likesCount={likesCount}
                    isLiked={isLiked}
                    commentsCount={commentsCount}
                    showComments={showComments}
                    onLike={handleLike}
                    onToggleComments={handleToggleComments}
                    postId={post.id}
                    postContent={post.content}
                />

                {/* Comments Section */}
                <AnimatePresence>
                    {showComments && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-secondary/20 border-t border-border/30 overflow-hidden"
                        >
                            <CommentSection
                                comments={comments}
                                commentsCount={commentsCount}
                                postId={post.id}
                                onCommentAdded={handleCommentAdded}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>

        {/* Boost Modal */}
        {showBoostModal && profile?.trader_tier && business && (
            <BoostModal
                postId={post.id}
                businessId={business.id}
                tier={profile.trader_tier}
                onClose={() => setShowBoostModal(false)}
                onSuccess={() => {
                    // Optionally handle success visually (e.g. show a "Boosted" tag on the post)
                }}
            />
        )}

        {/* Post Detail Modal Overlay */}
        {isModalOpen && !isModalView && (
            <div 
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsModalOpen(false)}
            >
                <div 
                    className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl relative shadow-2xl ring-1 ring-border/50 bg-background"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        className="absolute top-3 right-3 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-md border border-border/50 text-foreground hover:bg-secondary transition-all"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <X className="w-4 h-4" />
                    </button>
                    {/* We render the card inside itself with isModalView=true so it doesn't nest infinitely */}
                    <PostCard post={post} autoExpandComments={true} isModalView={true} />
                </div>
            </div>
        )}
        </>
    );
}
