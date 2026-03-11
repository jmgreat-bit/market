'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { PostWithBusiness } from '@/types';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageCarousel } from './ImageCarousel';
import { VideoPlayer } from './VideoPlayer';
import { LinkPreview } from './LinkPreview';
import { CommentSection } from './CommentSection';
import {
    Heart,
    MessageCircle,
    Share2,
    MapPin,
    Clock,
    Star,
    Bookmark
} from 'lucide-react';

interface PostCardProps {
    post: PostWithBusiness;
}

export function PostCard({ post }: PostCardProps) {
    const [isLiked, setIsLiked] = useState(post.is_liked ?? false);
    const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);
    const [showComments, setShowComments] = useState(false);

    const business = post.business;
    const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

    // Check if post is expiring soon (within 2 hours)
    const isExpiringSoon = post.expires_at ? (
        new Date(post.expires_at).getTime() - Date.now() < 2 * 60 * 60 * 1000 &&
        new Date(post.expires_at).getTime() > Date.now()
    ) : false;

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    };

    // Determine what media to show
    const hasImages = post.images && post.images.length > 0;
    const hasVideo = post.video;
    const hasLink = post.link;
    const hasLegacyImage = post.image_url && !hasImages && !hasVideo;
    const hasComments = post.comments && post.comments.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl overflow-hidden glass-card border-[0.5px] border-white/10 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500"
        >
            <Card className="border-none bg-transparent rounded-none">
                {/* Header */}
                <div className="p-3 pb-2">
                    <div className="flex items-start gap-2.5">
                        {/* Avatar */}
                        <Avatar className="w-10 h-10 ring-1 ring-primary/20">
                            <AvatarFallback className="geo-gradient text-white font-semibold">
                                {business?.business_name?.charAt(0) || 'B'}
                            </AvatarFallback>
                        </Avatar>

                        {/* Business info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <h3 className="text-[15px] font-semibold text-foreground truncate">
                                    {business?.business_name || 'Business'}
                                </h3>
                                {business?.is_premium && (
                                    <Star className="w-3.5 h-3.5 text-accent fill-accent flex-shrink-0" />
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mt-0.5">
                                {business?.category && (
                                    <span className="font-medium text-primary">
                                        {business.category}
                                    </span>
                                )}
                                <span>•</span>
                                <span>{timeAgo}</span>
                            </div>
                        </div>

                        {/* Expiring indicator */}
                        {isExpiringSoon && (
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs"
                            >
                                <Clock className="w-3 h-3" />
                                <span>Expiring</span>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="px-3 pb-2">
                    <p className="text-[15px] text-foreground leading-snug whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Legacy single image */}
                {hasLegacyImage && (
                    <div className="relative aspect-video bg-secondary overflow-hidden">
                        <img
                            src={post.image_url!}
                            alt="Post image"
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Image Carousel */}
                {hasImages && (
                    <ImageCarousel images={post.images!} />
                )}

                {/* Video Player */}
                {hasVideo && (
                    <VideoPlayer video={post.video!} />
                )}

                {/* Link Preview */}
                {hasLink && (
                    <div className="px-3 pb-2">
                        <LinkPreview link={post.link!} />
                    </div>
                )}

                {/* Location */}
                {post.latitude && post.longitude && (
                    <button className="w-full px-3 py-2 flex items-center gap-1.5 text-[12px] text-muted-foreground border-t border-border/50 hover:bg-secondary/50 transition-colors">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>View on map</span>
                    </button>
                )}

                {/* Actions */}
                <div className="px-2 py-1 flex items-center justify-between border-t border-border/50">
                    <div className="flex items-center gap-1">
                        {/* Like Button */}
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <button
                                onClick={handleLike}
                                className={`flex items-center gap-1.5 p-2 rounded-lg transition-colors ${isLiked ? 'text-red-500 hover:bg-red-500/10' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
                            >
                                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                                <span className="text-[13px] font-medium">{likesCount > 0 ? likesCount : ''}</span>
                            </button>
                        </motion.div>

                        {/* Comment Button */}
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <button
                                onClick={() => setShowComments(!showComments)}
                                className={`flex items-center gap-1.5 p-2 rounded-lg transition-colors ${showComments ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-[13px] font-medium">{post.comments_count ? post.comments_count : ''}</span>
                            </button>
                        </motion.div>
                    </div>

                    <div className="flex items-center gap-0.5">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors">
                                <Share2 className="w-5 h-5" />
                            </button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors">
                                <Bookmark className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </div>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="bg-secondary/30">
                        <CommentSection
                            comments={post.comments ?? []}
                            commentsCount={post.comments_count ?? 0}
                            postId={post.id}
                        />
                    </div>
                )}
            </Card>
        </motion.div>
    );
}
