'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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

interface PostCardProps {
    post: PostWithBusiness;
}

export function PostCard({ post }: PostCardProps) {
    const { profile } = useUser();
    const [isLiked, setIsLiked] = useState(post.is_liked ?? false);
    const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);
    const [showComments, setShowComments] = useState(false);
    const initialComments = Array.isArray(post.comments) && post.comments.length > 0 && 'id' in post.comments[0] 
        ? post.comments 
        : [];
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [commentsCount, setCommentsCount] = useState(post.comments_count ?? 0);
    const [commentsFetched, setCommentsFetched] = useState(
        (post.comments_count ?? 0) === 0 || initialComments.length > 0
    );

    // Analytics tracking
    const cardRef = useRef<HTMLDivElement>(null);
    const entry = useIntersectionObserver(cardRef, { threshold: 0.5, freezeOnceVisible: true });
    const { logPostView } = useAnalytics();

    useEffect(() => {
        if (entry?.isIntersecting) {
            logPostView(post.id);
        }
    }, [entry?.isIntersecting, post.id, logPostView]);

    // Check real like status from DB on mount
    useEffect(() => {
        if (!profile?.id) return;
        const supabase = getSupabaseClient();
        supabase
            .from('likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', profile.id)
            .maybeSingle()
            .then(({ data }: { data: { id: string } | null }) => {
                setIsLiked(!!data);
            });
    }, [post.id, profile?.id]);

    // Fetch comments from DB when section opens
    const fetchComments = useCallback(async () => {
        if (commentsFetched || commentsCount === 0) return;
        try {
            const supabase = getSupabaseClient();
            const { data } = await supabase
                .from('comments')
                .select(`
                    *,
                    user:profiles(full_name, username, avatar_url)
                `)
                .eq('post_id', post.id)
                .order('created_at', { ascending: true });

            if (data) {
                // Transform data to match Comment type expectations
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
    }, [post.id, commentsFetched]);

    const handleToggleComments = () => {
        const next = !showComments;
        setShowComments(next);
        if (next) fetchComments();
    };

    // Wire like to DB with optimistic update
    const handleLike = useCallback(async () => {
        if (!profile?.id) return;

        const wasLiked = isLiked;
        setIsLiked(!wasLiked);
        setLikesCount(wasLiked ? likesCount - 1 : likesCount + 1);

        try {
            const supabase = getSupabaseClient();
            if (wasLiked) {
                await supabase
                    .from('likes')
                    .delete()
                    .eq('post_id', post.id)
                    .eq('user_id', profile.id);
            } else {
                await supabase
                    .from('likes')
                    .insert({ post_id: post.id, user_id: profile.id });
            }
        } catch (err) {
            console.error('Like toggle failed:', err);
            // Revert on error
            setIsLiked(wasLiked);
            setLikesCount(wasLiked ? likesCount : likesCount - 1);
        }
    }, [isLiked, likesCount, post.id, profile?.id]);

    const handleCommentAdded = (newComment: Comment) => {
        setComments(prev => [...prev, newComment]);
        setCommentsCount(prev => prev + 1);
    };

    const business = post.business;

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg overflow-hidden bg-card/80 backdrop-blur-[30px] shadow-[0_0_32px_rgba(143,245,255,0.08)] border border-border/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(143,245,255,0.12)]"
        >
            <div className="flex flex-col bg-transparent">
                {/* Header */}
                <PostHeader
                    businessName={business?.business_name}
                    category={business?.category ?? undefined}
                    isPremium={business?.is_premium}
                    createdAt={post.created_at}
                    expiresAt={post.expires_at}
                    avatarUrl={(business as any)?.profile?.avatar_url}
                />

                {/* Content */}
                <PostBody
                    content={post.content}
                    imageUrl={post.image_url ?? undefined}
                    images={post.images}
                    link={post.link}
                    latitude={post.latitude}
                    longitude={post.longitude}
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
    );
}
