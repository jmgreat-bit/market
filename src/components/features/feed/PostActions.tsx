'use client';

import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostActionsProps {
    likesCount: number;
    isLiked: boolean;
    commentsCount: number;
    showComments: boolean;
    onLike: () => void;
    onToggleComments: () => void;
}

export function PostActions({ likesCount, isLiked, commentsCount, showComments, onLike, onToggleComments }: PostActionsProps) {
    return (
        <div className="px-3 py-2 flex items-center justify-between border-t border-[rgba(72,72,73,0.15)] mt-2 pt-4">
            <div className="flex items-center gap-1.5">
                {/* Like Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onLike}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] transition-all duration-300 font-sans font-medium text-[13px]",
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
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] transition-all duration-300 font-sans font-medium text-[13px]",
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
                <motion.button 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-[10px] hover:bg-surface-container transition-colors border border-transparent hover:border-white/5"
                >
                    <Share2 className="w-[18px] h-[18px]" />
                </motion.button>
                <motion.button 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-[10px] hover:bg-surface-container transition-colors border border-transparent hover:border-white/5"
                >
                    <Bookmark className="w-[18px] h-[18px]" />
                </motion.button>
            </div>
        </div>
    );
}
