import { BadgeCheck, Crown } from 'lucide-react';
import { TraderTier } from '@/types';

interface TierBadgeProps {
    tier?: TraderTier | null;
    className?: string;
    iconSize?: number;
}

export function TierBadge({ tier, className = '', iconSize = 16 }: TierBadgeProps) {
    if (!tier || tier === 'free') return null;

    if (tier === 'pro') {
        return (
            <div 
                className={`flex items-center gap-1 text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border border-blue-500/20 ${className}`}
                title="Pro Trader"
            >
                <BadgeCheck size={iconSize} />
                <span>Pro</span>
            </div>
        );
    }

    if (tier === 'national') {
        return (
            <div 
                className={`flex items-center gap-1 text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.2)] ${className}`}
                title="National Trader"
            >
                <Crown size={iconSize} />
                <span>National</span>
            </div>
        );
    }

    return null;
}
