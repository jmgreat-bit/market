'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PostWithBusiness } from '@/types';
import { CommentSection } from './CommentSection';
import { PostHeader } from './PostHeader';
import { PostBody } from './PostBody';
import { PostActions } from './PostActions';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useAnalytics } from '@/hooks/useAnalytics';

interface PostCardProps {
    post: PostWithBusiness;
}

export function PostCard({ post }: PostCardProps) {
    const [isLiked, setIsLiked] = useState(post.is_liked ?? false);
    const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);
    const [showComments, setShowComments] = useState(false);
    
    // Analytics tracking
    const cardRef = useRef<HTMLDivElement>(null);
    const entry = useIntersectionObserver(cardRef, { threshold: 0.5, freezeOnceVisible: true });
    const { logPostView } = useAnalytics();

    useEffect(() => {
        if (entry?.isIntersecting) {
            logPostView(post.id);
        }
    }, [entry?.isIntersecting, post.id, logPostView]);

    const business = post.business;

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    };

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl overflow-hidden bg-[#1a191b]/50 backdrop-blur-[30px] shadow-[0_0_32px_rgba(143,245,255,0.08)] transition-all duration-500 hover:shadow-[0_0_40px_rgba(143,245,255,0.12)]"
        >
            <div className="flex flex-col bg-transparent">
                {/* Header */}
                <PostHeader 
                    businessName={business?.business_name}
                    category={business?.category ?? undefined}
                    isPremium={business?.is_premium}
                    createdAt={post.created_at}
                    expiresAt={post.expires_at}
                />

                {/* Content */}
                <PostBody 
                    content={post.content}
                    imageUrl={post.image_url ?? undefined}
                    images={post.images}
                    video={post.video}
                    link={post.link}
                    latitude={post.latitude}
                    longitude={post.longitude}
                />

                {/* Actions */}
                <PostActions 
                    likesCount={likesCount}
                    isLiked={isLiked}
                    commentsCount={post.comments_count ?? 0}
                    showComments={showComments}
                    onLike={handleLike}
                    onToggleComments={() => setShowComments(!showComments)}
                />

                {/* Comments Section */}
                <AnimatePresence>
                    {showComments && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-surface-container-low/40 border-t border-border/30 overflow-hidden"
                        >
                            <CommentSection
                                comments={post.comments ?? []}
                                commentsCount={post.comments_count ?? 0}
                                postId={post.id}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
