'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Search,
    Store,
    Sparkles,
    ArrowRight,
    Loader2,
    CheckCircle2,
    Shield,
    Clock,
    User,
    Compass
} from 'lucide-react';
import Link from 'next/link';
import { useConversations } from '@/hooks/useConversations';
import { useUser } from '@/hooks/useUser';
import TraderBadge from '@/components/ui/TraderBadge';
import { formatDistanceToNow } from 'date-fns';

export default function InboxPage() {
    const { profile, isAuthenticated, isLoading: authLoading } = useUser();
    const { conversations, totalUnread, isLoading, error, refresh } = useConversations();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'businesses'>('all');

    // Filter conversations based on search and active tab
    const filteredConversations = useMemo(() => {
        return conversations.filter(c => {
            const otherName = c.other_participant?.full_name || c.other_participant?.username || '';
            const bizName = c.business?.business_name || '';
            const preview = c.last_message_preview || '';
            const matchesSearch = 
                otherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                bizName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                preview.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (activeFilter === 'unread') {
                return (c.unread_count || 0) > 0;
            }
            if (activeFilter === 'businesses') {
                return !!c.business || c.other_participant?.role === 'trader';
            }

            return true;
        });
    }, [conversations, searchQuery, activeFilter]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
                <p className="text-sm font-display text-muted-foreground tracking-widest uppercase">Loading Secure Inbox...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-geo-glow">
                    <MessageSquare className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-black font-display text-foreground mb-2">Direct Inquiries & Chat</h1>
                <p className="text-muted-foreground text-sm max-w-sm mb-6 leading-relaxed">
                    Sign in to message local businesses, ask about product availability, and manage inquiries in real-time.
                </p>
                <Link
                    href="/auth/login"
                    className="bg-primary text-primary-foreground font-display font-bold px-8 py-3.5 rounded-full hover:opacity-90 transition-all shadow-[0_0_24px_rgba(143,245,255,0.25)]"
                >
                    Sign In to Message
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface text-foreground pb-32 md:pb-16">
            <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-6">

                {/* ── Top Header HUD ── */}
                <motion.header
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40"
                >
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-geo-glow">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="font-display text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
                                    Direct Inquiries
                                    {totalUnread > 0 && (
                                        <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold animate-pulse">
                                            {totalUnread} new
                                        </span>
                                    )}
                                </h1>
                                <p className="text-xs text-muted-foreground font-medium">
                                    Real-time messaging with verified merchants & customers
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/explore"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/80 border border-border/50 text-xs font-bold text-foreground hover:border-primary/40 transition-all"
                        >
                            <Compass className="w-3.5 h-3.5 text-primary" />
                            <span>Discover Shops</span>
                        </Link>
                    </div>
                </motion.header>

                {/* ── Search & Filter Controls ── */}
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search conversations, business names, or messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-card/60 border border-border/50 rounded-2xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all backdrop-blur-md"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {(['all', 'unread', 'businesses'] as const).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide capitalize transition-all shrink-0 ${
                                    activeFilter === filter
                                        ? 'bg-primary text-primary-foreground shadow-[0_0_12px_rgba(143,245,255,0.2)]'
                                        : 'bg-secondary/60 border border-border/40 text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {filter === 'all' && `All (${conversations.length})`}
                                {filter === 'unread' && `Unread (${totalUnread})`}
                                {filter === 'businesses' && 'Merchants & Hubs'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Conversations List ── */}
                {filteredConversations.length > 0 ? (
                    <div className="space-y-2.5">
                        <AnimatePresence>
                            {filteredConversations.map((conv, index) => {
                                const other = conv.other_participant;
                                const biz = conv.business;
                                const isTrader = other?.role === 'trader' || !!biz;
                                const titleName = biz?.business_name || other?.full_name || other?.username || 'Trader';
                                const subText = other?.username ? `@${other.username}` : (biz?.category || 'Business');
                                const hasUnread = (conv.unread_count || 0) > 0;
                                const timeFormatted = conv.last_message_at
                                    ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
                                    : '';

                                return (
                                    <motion.div
                                        key={conv.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                    >
                                        <Link
                                            href={`/inbox/${conv.id}`}
                                            className={`group block p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden backdrop-blur-xl ${
                                                hasUnread
                                                    ? 'bg-card/90 border-primary/40 shadow-[0_0_24px_rgba(143,245,255,0.08)] hover:border-primary'
                                                    : 'bg-card/40 border-border/30 hover:bg-card/70 hover:border-border/60'
                                            }`}
                                        >
                                            {/* Glow Accent for Unread */}
                                            {hasUnread && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-blue-400 to-primary" />
                                            )}

                                            <div className="flex items-center gap-4">
                                                {/* Avatar HUD */}
                                                <div className="relative shrink-0">
                                                    <div className={`w-13 h-13 rounded-2xl p-[2px] ${isTrader ? 'geo-gradient' : 'bg-border/40'}`}>
                                                        <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center overflow-hidden">
                                                            {other?.avatar_url ? (
                                                                <img src={other.avatar_url} alt={titleName} className="w-full h-full object-cover" />
                                                            ) : isTrader ? (
                                                                <Store className="w-6 h-6 text-primary" />
                                                            ) : (
                                                                <User className="w-6 h-6 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                    </div>
                                                    {other?.is_premium && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 border border-card flex items-center justify-center shadow-sm">
                                                            <Sparkles className="w-2.5 h-2.5 text-white" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <h3 className={`font-display text-sm truncate font-bold ${hasUnread ? 'text-foreground font-black' : 'text-foreground/90'}`}>
                                                                {titleName}
                                                            </h3>
                                                            {other?.trader_tier && other.trader_tier !== 'free' && (
                                                                <TraderBadge tier={other.trader_tier} size="sm" />
                                                            )}
                                                            {biz?.category && (
                                                                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-secondary/80 text-primary border border-primary/20 shrink-0">
                                                                    {biz.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                                                            {timeFormatted}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className={`text-xs truncate ${hasUnread ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                                            {(() => {
                                                                const text = conv.last_message_preview;
                                                                if (!text) return 'Tap to send a message...';
                                                                let cleaned = text.replace(/\[Reference:\s*[^\]]*\]?/g, '').trim();
                                                                if (!cleaned && text.includes('[Reference:')) return 'Sent an attachment';
                                                                return cleaned || 'Tap to send a message...';
                                                            })()}
                                                        </p>
                                                        
                                                        {hasUnread && (
                                                            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(143,245,255,0.6)]">
                                                                {conv.unread_count}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 hidden sm:block" />
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                ) : (
                    /* ── Empty State ── */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card rounded-3xl border border-border/40 p-12 text-center flex flex-col items-center justify-center space-y-4"
                    >
                        <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-geo-glow">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <div className="space-y-1 max-w-sm">
                            <h3 className="font-display font-bold text-lg text-foreground">
                                {searchQuery ? 'No matching conversations' : 'No inquiries yet'}
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {searchQuery
                                    ? `Could not find any messages matching "${searchQuery}". Try a different keyword.`
                                    : 'When you ask questions about products or services from businesses on the map, your chats will appear here.'}
                            </p>
                        </div>
                        {!searchQuery && (
                            <Link
                                href="/explore"
                                className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-display font-bold text-xs hover:opacity-90 transition-all shadow-[0_0_16px_rgba(143,245,255,0.2)]"
                            >
                                <Compass className="w-3.5 h-3.5" />
                                <span>Explore Local Businesses</span>
                            </Link>
                        )}
                    </motion.div>
                )}

            </main>
        </div>
    );
}
