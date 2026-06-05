'use client';

import { BadgeCheck } from 'lucide-react';
import { TraderTier } from '@/types';

interface TraderBadgeProps {
    tier: TraderTier;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
} as const;

const tierConfig = {
    pro: {
        color: '#3b82f6',
        label: 'Pro',
        title: 'Verified Pro Trader',
    },
    national: {
        color: '#f59e0b',
        label: 'National',
        title: 'Verified National Trader',
    },
} as const;

export default function TraderBadge({ tier, size = 'sm', showLabel = false }: TraderBadgeProps) {
    if (tier === 'free') return null;

    const config = tierConfig[tier];
    const sizeClass = sizeMap[size];

    return (
        <span
            className="inline-flex items-center gap-1 shrink-0"
            title={config.title}
        >
            <BadgeCheck
                className={sizeClass}
                style={{ color: config.color }}
            />
            {showLabel && (
                <span
                    className="text-xs font-bold tracking-wide"
                    style={{ color: config.color }}
                >
                    {config.label}
                </span>
            )}
        </span>
    );
}
