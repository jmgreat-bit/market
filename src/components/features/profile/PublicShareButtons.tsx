'use client';

import { useState } from 'react';
import { QrCode, Share2 } from 'lucide-react';
import ProfileQrModal from './ProfileQrModal';

interface PublicShareButtonsProps {
    profile: {
        id?: string;
        full_name?: string | null;
        username?: string | null;
        avatar_url?: string | null;
        trader_tier?: string | null;
        role?: string;
        bio?: string | null;
    };
    businessName?: string | null;
    category?: string | null;
    address?: string | null;
}

export default function PublicShareButtons({
    profile,
    businessName,
    category,
    address,
}: PublicShareButtonsProps) {
    const [isQrOpen, setIsQrOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsQrOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-foreground font-bold rounded-full hover:bg-secondary/80 border border-border/50 hover:border-primary/40 transition-all text-sm cursor-pointer shrink-0"
                title="View QR Code & Tabletop Stand"
            >
                <QrCode className="w-4 h-4 text-primary" />
                <span>QR Code</span>
            </button>

            <ProfileQrModal
                isOpen={isQrOpen}
                onClose={() => setIsQrOpen(false)}
                profile={profile}
                businessName={businessName}
                category={category}
                address={address}
            />
        </>
    );
}
