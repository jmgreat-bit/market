'use client';

import { useMemo, useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, MoreHorizontal, Flag, Zap } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import TraderBadge from '@/components/ui/TraderBadge';

interface PostHeaderProps {
    postId?: string;
    businessName?: string;
    category?: string;
    isPremium?: boolean;
    traderTier?: 'free' | 'pro' | 'national';
    createdAt: string;
    expiresAt?: string | null;
    avatarUrl?: string | null;
    profileUsername?: string | null;
    isEligibleForBoost?: boolean;
    onBoostClick?: () => void;
}

export function PostHeader({ postId, businessName, category, isPremium, traderTier, createdAt, expiresAt, avatarUrl, profileUsername, isEligibleForBoost, onBoostClick }: PostHeaderProps) {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);

    const timeAgo = mounted 
        ? formatDistanceToNow(new Date(createdAt), { addSuffix: true })
        : '';
    
    const isExpiringSoon = useMemo(() => {
        if (!expiresAt) return false;
        // In React 19 / Compiler, we should use a stable time or handle impurity
        const expireTime = new Date(expiresAt).getTime();
        const now = new Date().getTime(); 
        return expireTime - now < 2 * 60 * 60 * 1000 && expireTime > now;
    }, [expiresAt]);

    const innerContent = (
        <>
            <Avatar className="w-9 h-9 ring-1 ring-primary/20 shadow-geo-glow">
                {avatarUrl && (
                    <AvatarImage src={avatarUrl} alt={businessName || 'Business'} />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground font-bold font-display">
                    {businessName?.charAt(0) || 'B'}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-foreground font-display truncate tracking-wide hover:underline">
                        {businessName || 'Business'}
                    </h3>
                    {(traderTier && traderTier !== 'free') ? (
                        <TraderBadge tier={traderTier} showLabel />
                    ) : isPremium ? (
                        <TraderBadge tier="pro" showLabel />
                    ) : null}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 font-sans">
                    {category && (
                        <span className="font-semibold text-primary">
                            {category}
                        </span>
                    )}
                    {category && <span className="opacity-50">•</span>}
                    <span>{timeAgo}</span>
                </div>
            </div>
        </>
    );

    return (
        <div className="p-3 pb-2 flex items-start gap-2.5">
            {profileUsername ? (
                <Link href={`/u/${profileUsername}`} className="flex-1 min-w-0 flex items-start gap-2.5">
                    {innerContent}
                </Link>
            ) : (
                <div className="flex-1 min-w-0 flex items-start gap-2.5">
                    {innerContent}
                </div>
            )}

            <div className="flex items-center gap-2">
                {isEligibleForBoost && onBoostClick && (
                    <button 
                        onClick={onBoostClick}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                        <Zap className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Boost</span>
                    </button>
                )}

                {isExpiringSoon && (
                    <motion.div
                        animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/15 text-destructive text-xs border border-destructive/30 font-medium"
                    >
                        <Clock className="w-3 h-3" />
                        <span>Expiring</span>
                    </motion.div>
                )}
                
                {/* Options Menu */}
                {postId && (
                    <div className="relative group">
                        <button className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border/50 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                            <Link
                                href={`/support?category=report&reference_type=post&reference_id=${postId}`}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                            >
                                <Flag className="w-3.5 h-3.5" />
                                Report Post
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
