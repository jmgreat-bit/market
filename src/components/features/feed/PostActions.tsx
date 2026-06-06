'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';

interface PostActionsProps {
    likesCount: number;
    isLiked: boolean;
    commentsCount: number;
    showComments: boolean;
    onLike: () => void;
    onToggleComments: () => void;
    postId: string;
    postContent?: string;
}

export function PostActions({ likesCount, isLiked, commentsCount, showComments, onLike, onToggleComments, postId, postContent }: PostActionsProps) {
    const { profile } = useUser();
    const [isSaved, setIsSaved] = useState(false);
    const [isCheckingBookmark, setIsCheckingBookmark] = useState(true);
    const [showShareToast, setShowShareToast] = useState(false);
    const [showSaveToast, setShowSaveToast] = useState(false);

    // Check if this post is already bookmarked on mount
    useEffect(() => {
        if (!profile?.id) {
            const timer = setTimeout(() => {
                setIsCheckingBookmark(false);
            }, 0);
            return () => clearTimeout(timer);
        }

        const checkBookmark = async () => {
            try {
                const supabase = getSupabaseClient();
                const { data } = await supabase
                    .from('bookmarks')
                    .select('id')
                    .eq('user_id', profile.id)
                    .eq('post_id', postId)
                    .maybeSingle();

                setIsSaved(!!data);
            } catch {
                // Silent fail
            } finally {
                setIsCheckingBookmark(false);
            }
        };

        checkBookmark();
    }, [profile?.id, postId]);

    const handleShare = async () => {
        const shareData = {
            title: 'GeoPulse Post',
            text: postContent?.substring(0, 100) || 'Check out this post on GeoPulse!',
            url: `${window.location.origin}/feed?post=${postId}`,
        };

        try {
            if (navigator.share && navigator.canShare?.(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.url);
                setShowShareToast(true);
                setTimeout(() => setShowShareToast(false), 2000);
            }
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                try {
                    await navigator.clipboard.writeText(shareData.url);
                    setShowShareToast(true);
                    setTimeout(() => setShowShareToast(false), 2000);
                } catch { /* ignore */ }
            }
        }
    };

    const handleBookmark = useCallback(async () => {
        if (!profile?.id) return;

        // Optimistic toggle
        const wasSaved = isSaved;
        setIsSaved(!isSaved);

        if (!wasSaved) {
            setShowSaveToast(true);
            setTimeout(() => setShowSaveToast(false), 2000);
        }

        try {
            const supabase = getSupabaseClient();

            if (wasSaved) {
                // Remove bookmark
                await supabase
                    .from('bookmarks')
                    .delete()
                    .eq('user_id', profile.id)
                    .eq('post_id', postId);
            } else {
                // Add bookmark
                await supabase
                    .from('bookmarks')
                    .insert({
                        user_id: profile.id,
                        post_id: postId,
                    });
            }
        } catch (err) {
            console.error('Bookmark toggle failed:', err);
            // Revert on error
            setIsSaved(wasSaved);
        }
    }, [isSaved, profile?.id, postId]);

    return (
        <div className="relative px-3 py-1.5 flex items-center justify-between border-t border-[rgba(72,72,73,0.15)] mt-1 pt-2">
            <div className="flex items-center gap-1.5">
                {/* Like Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onLike}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-300 font-sans font-medium text-[13px]",
                        isLiked 
                            ? 'text-red-500 bg-red-500/10 border border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.15)]' 
                            : 'text-muted-foreground hover:bg-surface-container hover:text-foreground hover:border-white/5 border border-transparent'
                    )}
                >
                    <Heart className={cn("w-[18px] h-[18px]", isLiked && "fill-current")} />
                    <span>{likesCount > 0 ? likesCount : 'Like'}</span>
                </motion.button>

                {/* Comment Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onToggleComments}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-300 font-sans font-medium text-[13px]",
                        showComments 
                            ? 'text-primary bg-primary/10 border border-primary/20 shadow-geo-glow' 
                            : 'text-muted-foreground hover:bg-surface-container hover:text-foreground hover:border-white/5 border border-transparent'
                    )}
                >
                    <MessageCircle className="w-[18px] h-[18px]" />
                    <span>{commentsCount > 0 ? commentsCount : 'Comment'}</span>
                </motion.button>
            </div>

            <div className="flex items-center gap-1">
                {/* Share Button */}
                <motion.button 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-container transition-colors border border-transparent hover:border-white/5"
                >
                    <Share2 className="w-[18px] h-[18px]" />
                </motion.button>

                {/* Bookmark Button */}
                <motion.button 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBookmark}
                    className={cn(
                        "p-2 rounded-md transition-colors border border-transparent",
                        isSaved 
                            ? "text-primary bg-primary/10 border-primary/20" 
                            : "text-muted-foreground hover:text-foreground hover:bg-surface-container hover:border-white/5"
                    )}
                >
                    <Bookmark className={cn("w-[18px] h-[18px]", isSaved && "fill-current")} />
                </motion.button>
            </div>

            {/* Share Toast */}
            {showShareToast && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-10 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                >
                    Link copied!
                </motion.div>
            )}

            {/* Save Toast */}
            {showSaveToast && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-10 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                >
                    Saved to collection!
                </motion.div>
            )}
        </div>
    );
}
