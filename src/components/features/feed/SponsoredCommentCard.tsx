'use client';

import { motion } from 'framer-motion';
import { Megaphone, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { AdWithDetails } from '@/hooks/useAds';

interface SponsoredCommentCardProps {
    ad: AdWithDetails;
}

export function SponsoredCommentCard({ ad }: SponsoredCommentCardProps) {
    const post = ad.post;
    const business = ad.business;

    if (!post) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="rounded-xl overflow-hidden bg-card/60 backdrop-blur-[20px] border border-amber-500/25 shadow-[0_0_16px_rgba(245,190,80,0.08)] mx-1"
        >
            <div className="p-3 flex gap-3">
                {/* Thumbnail */}
                {post.image_url && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
                        <img
                            src={post.image_url}
                            alt="Sponsored"
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    {/* Sponsored label + Business name */}
                    <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1 text-amber-400">
                            <Megaphone className="w-2.5 h-2.5" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Sponsored</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[11px] font-bold text-foreground truncate font-display">
                            {business?.business_name || 'Business'}
                        </span>
                    </div>

                    {/* Content preview (max 2 lines) */}
                    <p className="text-[12px] text-muted-foreground leading-snug line-clamp-2">
                        {post.content}
                    </p>
                </div>

                {/* View button */}
                {business?.profile_id && (
                    <Link
                        href={`/u/${business.profile_id}`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-bold uppercase tracking-wider hover:bg-amber-500/20 transition-all self-center flex-shrink-0"
                    >
                        <ExternalLink className="w-3 h-3" />
                        View
                    </Link>
                )}
            </div>
        </motion.div>
    );
}
