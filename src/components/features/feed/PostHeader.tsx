'use client';

import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, Star } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface PostHeaderProps {
    businessName?: string;
    category?: string;
    isPremium?: boolean;
    createdAt: string;
    expiresAt?: string | null;
}

export function PostHeader({ businessName, category, isPremium, createdAt, expiresAt }: PostHeaderProps) {
    const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    
    const isExpiringSoon = expiresAt ? (
        new Date(expiresAt).getTime() - Date.now() < 2 * 60 * 60 * 1000 &&
        new Date(expiresAt).getTime() > Date.now()
    ) : false;

    return (
        <div className="p-4 pb-3 flex items-start gap-3">
            <Avatar className="w-11 h-11 ring-2 ring-primary/20 shadow-geo-glow">
                <AvatarFallback className="bg-primary text-primary-foreground font-bold font-display">
                    {businessName?.charAt(0) || 'B'}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-foreground font-display truncate tracking-wide">
                        {businessName || 'Business'}
                    </h3>
                    {isPremium && (
                        <Star className="w-3.5 h-3.5 text-primary fill-primary flex-shrink-0" />
                    )}
                </div>
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground mt-0.5 font-sans">
                    {category && (
                        <span className="font-semibold text-primary">
                            {category}
                        </span>
                    )}
                    {category && <span className="opacity-50">•</span>}
                    <span>{timeAgo}</span>
                </div>
            </div>

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
