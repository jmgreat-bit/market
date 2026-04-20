'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Comment } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ChevronDown, ChevronUp } from 'lucide-react';
import { CommentItem } from './CommentItem';

interface CommentSectionProps {
    comments: Comment[];
    commentsCount: number;
    postId: string;
}

export function CommentSection({ comments, commentsCount, postId }: CommentSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [localComments, setLocalComments] = useState(comments);
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        // Add optimistic comment
        const optimisticComment: Comment = {
            id: `temp-${Date.now()}`,
            post_id: postId,
            user_id: 'current-user',
            user_name: 'You',
            content: newComment.trim(),
            created_at: new Date().toISOString(),
        };

        setLocalComments([...localComments, optimisticComment]);
        setNewComment('');
    };

    const displayComments = isExpanded ? localComments : localComments.slice(0, 2);

    return (
        <div className="flex flex-col">
            {/* Comments List */}
            <div className="px-4 py-4 space-y-1">
                <AnimatePresence>
                    {displayComments.map((comment, index) => (
                        <CommentItem key={comment.id} comment={comment} index={index} />
                    ))}
                </AnimatePresence>

                {/* Show More/Less Button */}
                {commentsCount > 2 && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground hover:text-primary transition-colors mt-4 pb-1 pl-1"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="w-3.5 h-3.5" />
                                Hide comments
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-3.5 h-3.5" />
                                View all {commentsCount} comments
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleSubmit} className="px-4 pb-4 pt-1 flex gap-3 relative">
                <div className={`flex-1 relative transition-all duration-300 border-b ${isFocused ? 'border-primary shadow-[0_1px_8px_-2px_rgba(143,245,255,0.4)]' : 'border-white/15'}`}>
                    <Input
                        type="text"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className="w-full h-10 text-[14px] bg-transparent border-0 rounded-none px-1 focus-visible:ring-0 placeholder:text-muted-foreground/50"
                    />
                </div>
                <Button
                    type="submit"
                    size="icon"
                    disabled={!newComment.trim()}
                    className={`h-10 w-10 flex-shrink-0 transition-all duration-300 rounded-full ${newComment.trim() ? 'bg-gradient-to-r from-primary to-accent text-on-primary-fixed shadow-geo-glow hover:scale-105' : 'bg-surface-container text-muted-foreground'}`}
                >
                    <Send className="w-4 h-4 ml-0.5" />
                </Button>
            </form>
        </div>
    );
}
