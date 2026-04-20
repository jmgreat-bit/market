'use client';

import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Comment } from '@/types';

interface CommentItemProps {
    comment: Comment;
    index: number;
}

export function CommentItem({ comment, index }: CommentItemProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.05 }}
            className="flex gap-3 mb-4 last:mb-0 items-start group"
        >
            <Avatar className="w-8 h-8 flex-shrink-0 ring-1 ring-white/5 shadow-geo-glow group-hover:ring-primary/20 transition-all">
                <AvatarFallback className="text-xs bg-surface-container font-medium text-foreground">
                    {comment.user_name.charAt(0)}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 bg-surface-container/30 px-3 py-2 rounded-xl rounded-tl-sm border border-transparent group-hover:border-white/5 transition-colors">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="font-semibold text-[13px] font-sans text-foreground drop-shadow-sm">
                        {comment.user_name}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                </div>
                <p className="text-[13px] text-foreground/80 font-sans leading-relaxed">
                    {comment.content}
                </p>
            </div>
        </motion.div>
    );
}
