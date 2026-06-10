'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import TraderBadge from '@/components/ui/TraderBadge';

interface PostHeaderProps {
    businessName?: string;
    category?: string;
    isPremium?: boolean;
    traderTier?: 'free' | 'pro' | 'national';
    createdAt: string;
    expiresAt?: string | null;
    avatarUrl?: string | null;
    profileUsername?: string | null;
}

export function PostHeader({ businessName, category, isPremium, traderTier, createdAt, expiresAt, avatarUrl, profileUsername }: PostHeaderProps) {
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
                        <TraderBadge tier={traderTier} />
                    ) : isPremium ? (
                        <TraderBadge tier="pro" />
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
                <Link href={`/u/${profileUsername}`} className="flex-1 flex items-start gap-2.5">
                    {innerContent}
                </Link>
            ) : (
                <div className="flex-1 flex items-start gap-2.5">
                    {innerContent}
                </div>
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
        </div>
    );
}
