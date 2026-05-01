'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Comment } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ChevronDown, ChevronUp, Image as ImageIcon, X } from 'lucide-react';
import { CommentItem } from './CommentItem';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { IMAGE_MIN_BYTES, IMAGE_MAX_BYTES, COMMENT_MAX_LENGTH } from '@/lib/constants';

interface CommentSectionProps {
    comments: Comment[];
    commentsCount: number;
    postId: string;
    onCommentAdded?: (comment: Comment) => void;
}

export function CommentSection({ comments, commentsCount, postId, onCommentAdded }: CommentSectionProps) {
    const { profile } = useUser();
    const [isExpanded, setIsExpanded] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Image attachment state
    const [commentImage, setCommentImage] = useState<File | null>(null);
    const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > IMAGE_MAX_BYTES) {
            alert('Image must be under 4MB');
            return;
        }

        if (file.size < IMAGE_MIN_BYTES) {
            alert('Image is too small (minimum 10KB)');
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Only image files are allowed. Videos are not supported.');
            return;
        }

        setCommentImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setCommentImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setCommentImage(null);
        setCommentImagePreview(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newComment.trim() && !commentImage) || isSubmitting) return;
        if (!profile?.id) return;

        setIsSubmitting(true);
        const content = newComment.trim();
        const userName = profile.full_name || profile.username || 'User';

        const savedImage = commentImage;
        const savedPreview = commentImagePreview;
        setNewComment('');
        removeImage();

        try {
            const supabase = getSupabaseClient();

            let imageUrl: string | null = null;

            // Upload comment image if present
            if (savedImage) {
                const fileExt = savedImage.name.split('.').pop();
                const fileName = `comments/${profile.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('post-media')
                    .upload(fileName, savedImage, { cacheControl: '3600', upsert: false });

                if (!uploadError) {
                    const { data: urlData } = supabase.storage
                        .from('post-media')
                        .getPublicUrl(fileName);
                    imageUrl = urlData.publicUrl;
                }
            }

            const { data: inserted, error: insertError } = await supabase
                .from('comments')
                .insert({
                    post_id: postId,
                    user_id: profile.id,
                    content,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Since the DB doesn't store the name in the comments table, 
            // we manually attach it for the optimistic update
            const commentWithUser = {
                ...inserted,
                user_name: userName,
                user_avatar: profile.avatar_url
            };

            // Bubble up the new comment to PostCard
            if (inserted && onCommentAdded) {
                onCommentAdded(commentWithUser as any);
            }
        } catch (error) {
            console.error('Failed to post comment:', error);
            // Restore the text so user doesn't lose it
            setNewComment(content);
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayComments = isExpanded ? comments : comments.slice(0, 2);

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
                {comments.length > 2 && (
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

            {/* Image Preview */}
            {commentImagePreview && (
                <div className="px-4 pb-2">
                    <div className="relative inline-block rounded-lg overflow-hidden border border-border/30">
                        <img src={commentImagePreview} alt="Attachment" className="h-20 w-auto object-cover rounded-lg" />
                        <button
                            onClick={removeImage}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}

            {/* Add Comment Input */}
            <form onSubmit={handleSubmit} className="px-4 pb-4 pt-1 flex gap-3 relative items-end">
                {/* Image attach button */}
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageSelect}
                />
                <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-primary/10 flex-shrink-0"
                >
                    <ImageIcon className="w-4 h-4" />
                </button>

                <div className={`flex-1 relative transition-all duration-300 border-b ${isFocused ? 'border-primary shadow-[0_1px_8px_-2px_rgba(143,245,255,0.4)]' : 'border-border/40'}`}>
                    <Input
                        type="text"
                        placeholder={profile?.id ? "Add a comment..." : "Sign in to comment"}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        disabled={!profile?.id}
                        maxLength={COMMENT_MAX_LENGTH}
                        className="w-full h-10 text-[14px] bg-transparent border-0 rounded-none px-1 focus-visible:ring-0 placeholder:text-muted-foreground/50"
                    />
                </div>
                <Button
                    type="submit"
                    size="icon"
                    disabled={(!newComment.trim() && !commentImage) || isSubmitting || !profile?.id}
                    className={`h-10 w-10 flex-shrink-0 transition-all duration-300 rounded-full ${(newComment.trim() || commentImage) ? 'bg-gradient-to-r from-primary to-accent text-on-primary-fixed shadow-geo-glow hover:scale-105' : 'bg-secondary text-muted-foreground'}`}
                >
                    <Send className="w-4 h-4 ml-0.5" />
                </Button>
            </form>
        </div>
    );
}
