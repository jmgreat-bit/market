'use client';

import { useMemo, useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, MoreHorizontal, Flag, Zap, Pin, Loader2 } from 'lucide-react';
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
    isOwner?: boolean;
    isPinned?: boolean;
    onTogglePin?: () => void;
    pinLoading?: boolean;
}

export function PostHeader({ 
    postId, 
    businessName, 
    category, 
    isPremium, 
    traderTier, 
    createdAt, 
    expiresAt, 
    avatarUrl, 
    profileUsername, 
    isEligibleForBoost, 
    onBoostClick,
    isOwner,
    isPinned,
    onTogglePin,
    pinLoading
}: PostHeaderProps) {
    const [mounted, setMounted] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    
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

    return (
        <div className="p-3 pb-2 flex items-start gap-2.5">
            <div className="flex-1 min-w-0 flex items-start gap-2.5">
                {profileUsername ? (
                    <Link 
                        href={`/u/${profileUsername}`} 
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0"
                    >
                        <Avatar className="w-9 h-9 ring-1 ring-primary/20 shadow-geo-glow hover:ring-primary/50 transition-all">
                            {avatarUrl && (
                                <AvatarImage src={avatarUrl} alt={businessName || 'Business'} />
                            )}
                            <AvatarFallback className="bg-primary text-primary-foreground font-bold font-display">
                                {businessName?.charAt(0) || 'B'}
                            </AvatarFallback>
                        </Avatar>
                    </Link>
                ) : (
                    <Avatar className="w-9 h-9 ring-1 ring-primary/20 shadow-geo-glow shrink-0">
                        {avatarUrl && (
                            <AvatarImage src={avatarUrl} alt={businessName || 'Business'} />
                        )}
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold font-display">
                            {businessName?.charAt(0) || 'B'}
                        </AvatarFallback>
                    </Avatar>
                )}

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5">
                        {profileUsername ? (
                            <Link 
                                href={`/u/${profileUsername}`} 
                                onClick={(e) => e.stopPropagation()}
                                className="truncate"
                            >
                                <h3 className="text-sm font-bold text-foreground font-display truncate tracking-wide hover:underline hover:text-primary transition-colors">
                                    {businessName || 'Business'}
                                </h3>
                            </Link>
                        ) : (
                            <h3 className="text-sm font-bold text-foreground font-display truncate tracking-wide">
                                {businessName || 'Business'}
                            </h3>
                        )}
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
            </div>

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
                    <div className="relative">
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setMenuOpen(!menuOpen);
                            }}
                            className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            title="More options"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        
                        {menuOpen && (
                            <>
                                <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setMenuOpen(false);
                                    }} 
                                />
                                <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border/50 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-border/30 animate-in fade-in zoom-in-95 duration-150">
                                    {isOwner && onTogglePin && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setMenuOpen(false);
                                                onTogglePin();
                                            }}
                                            disabled={pinLoading}
                                            className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-foreground hover:bg-secondary/70 hover:text-primary transition-colors text-left"
                                        >
                                            {pinLoading ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                                            ) : (
                                                <Pin className={`w-3.5 h-3.5 shrink-0 ${isPinned ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                                            )}
                                            <span>{isPinned ? 'Unpin Post' : 'Pin to Profile'}</span>
                                        </button>
                                    )}
                                    <Link
                                        href={`/support?category=report&reference_type=post&reference_id=${postId}`}
                                        onClick={() => setMenuOpen(false)}
                                        className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
                                    >
                                        <Flag className="w-3.5 h-3.5 shrink-0" />
                                        <span>Report Post</span>
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
