'use client';

import { motion } from 'framer-motion';
import { Megaphone, Heart, MessageCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { AdWithDetails } from '@/hooks/useAds';

interface SponsoredPostCardProps {
    ad: AdWithDetails;
}

export function SponsoredPostCard({ ad }: SponsoredPostCardProps) {
    const post = ad.post;
    const business = ad.business;

    if (!post) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="rounded-lg overflow-hidden bg-card/80 backdrop-blur-[30px] shadow-[0_0_32px_rgba(245,190,80,0.12)] border border-amber-500/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(245,190,80,0.18)]"
        >
            <div className="flex flex-col bg-transparent">
                {/* Sponsored Badge */}
                <div className="px-4 pt-3 pb-0 flex items-center gap-1.5 text-amber-400">
                    <Megaphone className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Sponsored</span>
                </div>

                {/* Header */}
                <div className="p-4 pb-3 flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-amber-500/15 ring-2 ring-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-400 font-bold font-display text-base">
                            {business?.business_name?.charAt(0) || 'B'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h3 className="text-base font-bold text-foreground font-display truncate tracking-wide">
                            {business?.business_name || 'Business'}
                        </h3>
                        <div className="flex items-center gap-2 text-[13px] text-muted-foreground mt-0.5 font-sans">
                            {business?.category && (
                                <span className="font-semibold text-amber-400">
                                    {business.category}
                                </span>
                            )}
                            {business?.category && <span className="opacity-50">•</span>}
                            <span className="text-amber-400/70 text-[11px] font-medium">Ad</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-4 pb-3">
                    <p className="text-[15px] text-foreground font-sans leading-relaxed whitespace-pre-wrap break-words">
                        {post.content}
                    </p>
                </div>

                {/* Image */}
                {post.image_url && (
                    <div className="px-4 pb-3">
                        <div className="relative overflow-hidden rounded-lg">
                            <img
                                src={post.image_url}
                                alt="Sponsored content"
                                className="w-full h-auto max-h-80 object-cover rounded-lg"
                            />
                        </div>
                    </div>
                )}

                {/* Engagement Stats (read-only) */}
                <div className="px-4 py-2 flex items-center gap-4 text-muted-foreground border-t border-border/20">
                    <div className="flex items-center gap-1.5 text-[13px]">
                        <Heart className="w-4 h-4" />
                        <span>{post.likes_count ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[13px]">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments_count ?? 0}</span>
                    </div>
                </div>

                {/* View Button */}
                {business?.profile_id && (
                    <div className="px-4 pb-4 pt-2">
                        <Link
                            href={`/u/${business.profile_id}`}
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold font-display hover:bg-amber-500/20 transition-all"
                        >
                            <ExternalLink className="w-4 h-4" />
                            View Trader
                        </Link>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
