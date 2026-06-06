'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { PostWithBusiness, Comment } from '@/types';
import { PostHeader } from '@/components/features/feed/PostHeader';
import { PostActions } from '@/components/features/feed/PostActions';
import { CommentSection } from '@/components/features/feed/CommentSection';
import { ImageCarousel } from '@/components/features/feed/ImageCarousel';
import { formatDistanceToNow } from 'date-fns';

export default function PostDetailPage() {
    const params = useParams<{ id: string }>();
    const postId = params.id;
    const { profile } = useUser();
    const supabase = useMemo(() => getSupabaseClient(), []);

    const [post, setPost] = useState<PostWithBusiness | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Interaction state
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [showComments, setShowComments] = useState(true);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentsCount, setCommentsCount] = useState(0);

    // Fetch the post
    useEffect(() => {
        if (!postId) return;

        async function fetchPost() {
            setIsLoading(true);
            setError(null);
            try {
                const { data, error: fetchError } = await supabase
                    .from('posts')
                    .select(`
                        *,
                        business:business_details(
                            *,
                            profile:profiles(avatar_url, full_name)
                        ),
                        likes:likes(count),
                        comments:comments(
                            *,
                            user:profiles(full_name, username, avatar_url)
                        )
                    `)
                    .eq('id', postId)
                    .single();

                if (fetchError) throw fetchError;
                if (!data) {
                    setError('Post not found');
                    return;
                }

                const enriched: any = {
                    ...data,
                    likes_count: data.likes?.[0]?.count ?? 0,
                    comments_count: data.comments?.length ?? 0,
                };

                setPost(enriched as PostWithBusiness);
                setLikesCount(enriched.likes_count);
                setCommentsCount(enriched.comments_count);

                // Transform comments
                if (data.comments && Array.isArray(data.comments)) {
                    const transformed = data.comments.map((c: any) => ({
                        ...c,
                        user_name: c.user?.full_name || c.user?.username || 'User',
                        user_avatar: c.user?.avatar_url,
                    }));
                    setComments(transformed as Comment[]);
                }
            } catch (err) {
                console.error('Failed to fetch post:', err);
                setError('Failed to load post');
            } finally {
                setIsLoading(false);
            }
        }

        fetchPost();
    }, [postId, supabase]);

    // Check like status
    useEffect(() => {
        if (!profile?.id || !postId) return;
        supabase
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', profile.id)
            .maybeSingle()
            .then(({ data }: { data: { id: string } | null }) => {
                setIsLiked(!!data);
            });
    }, [postId, profile?.id, supabase]);

    const handleLike = useCallback(async () => {
        if (!profile?.id || !postId) return;
        const wasLiked = isLiked;
        setIsLiked(!wasLiked);
        setLikesCount(wasLiked ? likesCount - 1 : likesCount + 1);

        try {
            if (wasLiked) {
                await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', profile.id);
            } else {
                await supabase.from('likes').insert({ post_id: postId, user_id: profile.id });
            }
        } catch (err) {
            console.error('Like toggle failed:', err);
            setIsLiked(wasLiked);
            setLikesCount(wasLiked ? likesCount : likesCount - 1);
        }
    }, [isLiked, likesCount, postId, profile?.id, supabase]);

    const handleCommentAdded = (newComment: Comment) => {
        setComments(prev => [...prev, newComment]);
        setCommentsCount(prev => prev + 1);
    };

    const business = post?.business;
    const hasImages = post?.images && post.images.length > 0;
    const hasLegacyImage = post?.image_url && !hasImages;

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Sticky Header */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link
                        href="/feed"
                        className="p-2 -ml-2 rounded-lg hover:bg-surface-container transition-colors text-foreground"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-sm font-bold font-display text-foreground">Post</h1>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto pt-14 pb-8">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading post...</p>
                    </div>
                )}

                {error && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <Link
                            href="/feed"
                            className="text-primary text-sm font-bold hover:underline"
                        >
                            Back to Feed
                        </Link>
                    </div>
                )}

                {post && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card/80 backdrop-blur-[30px] border-b border-border/30"
                    >
                        {/* Header */}
                        <PostHeader
                            businessName={business?.business_name}
                            category={business?.category ?? undefined}
                            isPremium={business?.is_premium}
                            createdAt={post.created_at}
                            expiresAt={post.expires_at}
                            avatarUrl={(business as any)?.profile?.avatar_url}
                        />

                        {/* Full Content */}
                        <div className="px-3 pb-3">
                            <p className="text-[14px] font-sans text-foreground/90 leading-relaxed whitespace-pre-wrap">
                                {post.content}
                            </p>
                        </div>

                        {/* Full-size Image (no max-height constraint) */}
                        {hasLegacyImage && (
                            <div className="px-2 pb-2">
                                <div className="rounded-lg overflow-hidden border border-border">
                                    <img
                                        src={post.image_url!}
                                        alt="Post image"
                                        className="w-full h-auto object-cover"
                                    />
                                </div>
                            </div>
                        )}

                        {hasImages && (
                            <div className="px-2 pb-2">
                                <div className="rounded-lg overflow-hidden border border-border">
                                    <ImageCarousel images={post.images!} />
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <PostActions
                            likesCount={likesCount}
                            isLiked={isLiked}
                            commentsCount={commentsCount}
                            showComments={showComments}
                            onLike={handleLike}
                            onToggleComments={() => setShowComments(!showComments)}
                            postId={post.id}
                            postContent={post.content}
                        />

                        {/* Comments Section — always visible by default */}
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
                    </motion.div>
                )}
            </div>
        </div>
    );
}
