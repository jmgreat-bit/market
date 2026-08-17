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
                    {(comment.user_name || 'U').charAt(0)}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 bg-surface-container/30 px-3 py-2 rounded-xl rounded-tl-sm border border-transparent group-hover:border-white/5 transition-colors">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="font-semibold text-[13px] font-sans text-foreground drop-shadow-sm">
                        {comment.user_name || 'User'}
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-muted-foreground font-medium">
                            {comment.created_at && !isNaN(new Date(comment.created_at).getTime()) 
                                ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) 
                                : 'Just now'}
                        </span>
                        <a 
                            href={`/support?category=report&reference_type=comment&reference_id=${comment.id}`}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                            title="Report Comment"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
                        </a>
                    </div>
                </div>
                {comment.content && (
                    <p className="text-[13px] text-foreground/80 font-sans leading-relaxed">
                        {comment.content}
                    </p>
                )}
                {comment.image_url && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-border/20">
                        <img 
                            src={comment.image_url} 
                            alt="Comment attachment" 
                            className="max-h-48 w-auto object-cover rounded-lg"
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );
}
