'use client';

import { MessageCircle, Globe } from 'lucide-react';

interface ContactButtonsProps {
    businessId: string;
    phone?: string | null;
    websiteUrl?: string | null;
    viewerId?: string;
}

export default function ContactButtons({ businessId, phone, websiteUrl, viewerId }: ContactButtonsProps) {
    const trackClick = (type: 'whatsapp' | 'website') => {
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessId, type, viewerId }),
        }).catch(() => {
            // Silently ignore tracking failures
        });
    };

    if (!phone && !websiteUrl) return null;

    return (
        <div className="flex gap-3">
            {phone && (
                <a
                    href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick('whatsapp')}
                    className="rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors"
                >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                </a>
            )}
            {websiteUrl && (
                <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick('website')}
                    className="rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors"
                >
                    <Globe className="w-4 h-4" />
                    Website
                </a>
            )}
        </div>
    );
}
