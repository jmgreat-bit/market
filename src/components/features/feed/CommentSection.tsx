'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Comment } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { Send, ChevronDown, ChevronUp } from 'lucide-react';

interface CommentSectionProps {
    comments: Comment[];
    commentsCount: number;
    postId: string;
}

export function CommentSection({ comments, commentsCount, postId }: CommentSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [localComments, setLocalComments] = useState(comments);

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
        <div className="border-t border-border/50">
            {/* Comments List */}
            <div className="px-4 py-3">
                <AnimatePresence>
                    {displayComments.map((comment, index) => (
                        <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex gap-2 mb-3 last:mb-0"
                        >
                            <Avatar className="w-7 h-7 flex-shrink-0">
                                <AvatarFallback className="text-xs bg-secondary">
                                    {comment.user_name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-medium text-sm text-foreground">
                                        {comment.user_name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm text-foreground/90">{comment.content}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Show More/Less Button */}
                {commentsCount > 2 && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="w-3 h-3" />
                                Show less
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-3 h-3" />
                                View all {commentsCount} comments
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleSubmit} className="px-4 pb-3 flex gap-2">
                <Input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 h-9 text-sm bg-secondary/50 border-0"
                />
                <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    disabled={!newComment.trim()}
                    className="px-3"
                >
                    <Send className="w-4 h-4" />
                </Button>
            </form>
        </div>
    );
}
