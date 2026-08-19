'use client';

import { useState } from 'react';
import { MessageSquare, Globe, Phone, MessageCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useConversations } from '@/hooks/useConversations';

interface ContactButtonsProps {
    businessId: string;
    targetProfileId?: string | null;
    phone?: string | null;
    websiteUrl?: string | null;
    viewerId?: string;
}

export default function ContactButtons({ businessId, targetProfileId, phone, websiteUrl, viewerId }: ContactButtonsProps) {
    const router = useRouter();
    const { user, isAuthenticated } = useUser();
    const { getOrCreateConversation } = useConversations();
    const [isStartingChat, setIsStartingChat] = useState(false);

    const trackClick = (type: 'whatsapp' | 'website' | 'phone' | 'message') => {
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessId, type, viewerId }),
        }).catch(() => {
            // Silently ignore tracking failures
        });
    };

    const handleInAppMessage = async () => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }

        if (!targetProfileId) return;
        if (user?.id === targetProfileId) return;

        try {
            setIsStartingChat(true);
            trackClick('message');
            const convId = await getOrCreateConversation(targetProfileId, businessId);
            router.push(`/inbox/${convId}`);
        } catch (err: any) {
            console.error('Failed to start chat:', err);
            alert(err.message || 'Could not open chat with this merchant.');
        } finally {
            setIsStartingChat(false);
        }
    };

    const isOwner = user?.id === targetProfileId;

    return (
        <div className="flex flex-wrap gap-2.5">
            {/* Direct In-App Message Button */}
            {!isOwner && targetProfileId && (
                <button
                    onClick={handleInAppMessage}
                    disabled={isStartingChat}
                    className="rounded-full bg-primary text-primary-foreground font-display font-bold px-5 py-2.5 text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-[0_0_18px_rgba(143,245,255,0.2)] shrink-0"
                >
                    {isStartingChat ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <MessageSquare className="w-4 h-4" />
                    )}
                    <span>Message</span>
                </button>
            )}

            {phone && (
                <a
                    href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick('whatsapp')}
                    className="rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors shrink-0"
                >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                </a>
            )}
            {phone && (
                <a
                    href={`tel:${phone}`}
                    onClick={() => trackClick('phone')}
                    className="rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors shrink-0"
                >
                    <Phone className="w-4 h-4" />
                    Call
                </a>
            )}
            {websiteUrl && (
                <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick('website')}
                    className="rounded-full bg-secondary/80 border border-border/50 text-foreground hover:border-primary/40 px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors shrink-0"
                >
                    <Globe className="w-4 h-4 text-primary" />
                    Website
                </a>
            )}
        </div>
    );
}

