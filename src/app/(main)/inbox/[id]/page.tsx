'use client';

import { useState, useRef, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Send,
    Store,
    User,
    Check,
    CheckCheck,
    Phone,
    MessageCircle,
    MapPin,
    ExternalLink,
    Sparkles,
    ShieldCheck,
    Clock,
    ShoppingBag
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChat } from '@/hooks/useChat';
import { useUser } from '@/hooks/useUser';
import TraderBadge from '@/components/ui/TraderBadge';
import { format } from 'date-fns';
import { AiPostCard } from '@/components/features/ai/AiPostCard';
import { AiPostPreview } from '@/components/features/ai/AiPostPreview';

const QUICK_INQUIRIES = [
    '👋 Hi! Are you currently open today?',
    '📦 Is this item/service still available?',
    '💰 How much does this cost?',
    '📍 Where exactly in the hub are you located?',
    '🛵 Do you offer delivery or pickup?'
];

function ChatPostCard({ postId, onClick }: { postId: string, onClick: (post: any) => void }) {
    const [post, setPost] = useState<any>(null);
    useEffect(() => {
        if (!postId) return;
        const fetchPost = async () => {
            const { getSupabaseClient } = await import('@/lib/supabase/client');
            const supabase = getSupabaseClient();
            const { data } = await supabase
                .from('posts')
                .select('*, business:business_details(*)')
                .eq('id', postId)
                .single();
            if (data) {
                setPost(data);
            }
        };
        fetchPost();
    }, [postId]);

    if (!post) return (
         <div className="w-[280px] h-[72px] rounded-2xl border border-border/20 bg-black/10 animate-pulse mt-3" />
    );

    return (
        <div onClick={() => onClick(post)} className="mt-2">
            <AiPostCard post={post} onClick={() => {}} />
        </div>
    );
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const conversationId = resolvedParams.id;
    const router = useRouter();
    const { user, profile } = useUser();
    const {
        messages,
        conversation,
        otherParticipant,
        business,
        isLoading,
        isSending,
        sendMessage,
        messagesEndRef,
        scrollToBottom
    } = useChat(conversationId);
    
    const searchParams = useSearchParams();
    const refPostId = searchParams.get('refPostId');

    const [inputText, setInputText] = useState('');
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const [referencedPost, setReferencedPost] = useState<any>(null);
    const [previewPost, setPreviewPost] = useState<any>(null);

    // Fetch referenced post if any
    useEffect(() => {
        if (!refPostId) return;
        const fetchRefPost = async () => {
            const { getSupabaseClient } = await import('@/lib/supabase/client');
            const supabase = getSupabaseClient();
            const { data } = await supabase
                .from('posts')
                .select('id, content, image_url')
                .eq('id', refPostId)
                .single();
            if (data) {
                setReferencedPost(data);
            }
        };
        fetchRefPost();
    }, [refPostId]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!inputText.trim() && !referencedPost) || isSending) return;

        let text = inputText.trim();
        
        // If there's an attached post, append its link
        if (referencedPost) {
            const postLink = `${window.location.origin}/post/${referencedPost.id}`;
            text = text ? `${text}\n\n[Reference: ${postLink}]` : `[Reference: ${postLink}]`;
            setReferencedPost(null); // Clear after sending
            
            // Also remove the query param so refreshing doesn't bring it back
            router.replace(`/inbox/${conversationId}`, { scroll: false });
        }

        setInputText('');
        await sendMessage(text);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleQuickChip = (text: string) => {
        setInputText(text);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const isTrader = otherParticipant?.role === 'trader' || !!business;
    const displayName = business?.business_name || otherParticipant?.full_name || otherParticipant?.username || 'Trader';
    const displayCategory = business?.category || (isTrader ? 'Verified Merchant' : 'Customer');

    return (
        <div className="min-h-screen bg-surface text-foreground flex flex-col justify-between">
            
            {/* ── Fixed Chat Top Header HUD ── */}
            <header className="sticky top-0 md:top-[76px] z-40 bg-background/90 backdrop-blur-2xl border-b border-border/40 px-4 py-3 sm:px-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    
                    {/* Left: Back & Avatar Info */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => router.push('/inbox')}
                            className="p-2 rounded-xl bg-secondary/60 hover:bg-secondary border border-border/40 text-muted-foreground hover:text-foreground transition-all shrink-0"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>

                        <div className="relative shrink-0">
                            <div className={`w-10 h-10 rounded-xl p-[1.5px] ${isTrader ? 'geo-gradient' : 'bg-border/50'}`}>
                                <div className="w-full h-full rounded-xl bg-card flex items-center justify-center overflow-hidden">
                                    {otherParticipant?.avatar_url ? (
                                        <img src={otherParticipant.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                                    ) : isTrader ? (
                                        <Store className="w-5 h-5 text-primary" />
                                    ) : (
                                        <User className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                                {otherParticipant?.username ? (
                                    <Link
                                        href={`/u/${otherParticipant.username}`}
                                        className="font-display font-bold text-sm text-foreground truncate hover:text-primary hover:underline transition-colors flex items-center gap-1"
                                    >
                                        <span>{displayName}</span>
                                        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-50" />
                                    </Link>
                                ) : (
                                    <span className="font-display font-bold text-sm text-foreground truncate">
                                        {displayName}
                                    </span>
                                )}
                                {otherParticipant?.trader_tier && otherParticipant.trader_tier !== 'free' && (
                                    <TraderBadge tier={otherParticipant.trader_tier} size="sm" />
                                )}
                            </div>
                            <p className="text-[11px] text-muted-foreground font-medium truncate">
                                {displayCategory}
                            </p>
                        </div>
                    </div>

                    {/* Right: Quick External Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        {business?.phone && (
                            <a
                                href={`https://wa.me/${business.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-xs font-bold flex items-center gap-1.5"
                                title="Open WhatsApp"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                        )}

                        {otherParticipant?.username && (
                            <Link
                                href={`/u/${otherParticipant.username}`}
                                className="p-2 rounded-xl bg-secondary/80 border border-border/50 text-muted-foreground hover:text-foreground transition-all"
                                title="View Store Profile"
                            >
                                <Store className="w-4 h-4" />
                            </Link>
                        )}
                    </div>

                </div>
            </header>

            {/* ── Main Chat Stream ── */}
            <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 overflow-y-auto space-y-4">
                
                {/* Merchant Identity Card at Top */}
                {isTrader && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-2xl border border-primary/20 p-4 bg-primary/5 mb-6 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_24px_rgba(143,245,255,0.05)]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-geo-glow">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-display text-xs font-bold text-foreground flex items-center gap-1.5">
                                    Direct Verified Channel
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    Inquiries sent here reach {displayName} directly on MarketPLC.
                                </p>
                            </div>
                        </div>

                        {otherParticipant?.username && (
                            <Link
                                href={`/u/${otherParticipant.username}`}
                                className="px-3.5 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-all text-center"
                            >
                                Browse Catalogue
                            </Link>
                        )}
                    </motion.div>
                )}

                {/* Quick Inquiry Chips (Shown if conversation has fewer than 3 messages) */}
                {messages.length < 3 && (
                    <div className="space-y-2 mb-6">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                            Quick Inquiries:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_INQUIRIES.map((chip, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleQuickChip(chip)}
                                    className="text-xs px-3 py-1.5 rounded-full bg-secondary/80 border border-border/50 text-foreground/80 hover:text-primary hover:border-primary/40 hover:bg-secondary transition-all text-left"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Messages Stream */}
                {isLoading && messages.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-2">
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        <p className="text-xs text-muted-foreground font-display tracking-widest uppercase">
                            Establishing secure link...
                        </p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-secondary/60 border border-border/40 flex items-center justify-center mx-auto text-muted-foreground">
                            <MessageCircle className="w-6 h-6 text-primary" />
                        </div>
                        <h4 className="font-display font-bold text-sm text-foreground">Start the Conversation</h4>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                            Ask about prices, product stock, opening hours, or arrange a visit.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 mt-4">
                        {messages.map((msg, index) => {
                            const isMe = msg.sender_id === user?.id;
                            const isTemp = msg.id.startsWith('temp-');
                            const timeString = msg.created_at
                                ? format(new Date(msg.created_at), 'HH:mm')
                                : '';
                            
                            // To avoid repeating avatars in consecutive messages from the same sender
                            const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id;

                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.18 }}
                                    className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex gap-2 max-w-[85%] sm:max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        
                                        {/* Avatar */}
                                        <div className="shrink-0 w-6 h-6 sm:w-8 sm:h-8 flex flex-col justify-end">
                                            {showAvatar && (
                                                <div className="w-full h-full rounded-full overflow-hidden bg-secondary border border-border/50">
                                                    {isMe ? (
                                                        profile?.avatar_url ? (
                                                            <img src={profile.avatar_url} alt="Me" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-xs font-bold">
                                                                {profile?.full_name?.charAt(0) || 'U'}
                                                            </div>
                                                        )
                                                    ) : (
                                                        otherParticipant?.avatar_url ? (
                                                            <img src={otherParticipant.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground text-xs font-bold">
                                                                {displayName.charAt(0) || 'U'}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Bubble */}
                                        <div
                                            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm transition-all relative overflow-hidden ${
                                                isMe
                                                    ? 'bg-gradient-to-r from-cyan-600 via-primary to-blue-600 text-primary-foreground font-medium rounded-br-sm shadow-[0_0_20px_rgba(143,245,255,0.15)]'
                                                    : 'bg-card border border-border/50 text-foreground font-normal rounded-bl-sm backdrop-blur-xl'
                                            }`}
                                        >
                                            {(() => {
                                                const refMatch = msg.content.match(/\[Reference:\s*(.+?)\]/);
                                                const cleanContent = msg.content.replace(/\[Reference:\s*.+?\]/, '').trim();
                                                return (
                                                    <div className="flex flex-col gap-2">
                                                        {cleanContent && <p className="whitespace-pre-wrap break-words">{cleanContent}</p>}
                                                        {refMatch && (
                                                            <div className={`mt-2 ${isMe ? 'opacity-90 grayscale-[20%]' : ''}`}>
                                                                <ChatPostCard 
                                                                    postId={refMatch[1].split('/').pop() || ''}
                                                                    onClick={(post) => setPreviewPost(post)}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                            <div className={`flex items-center gap-1 mt-1.5 text-[10px] ${isMe ? 'justify-end text-primary-foreground/75' : 'justify-start text-muted-foreground'}`}>
                                                <span>{timeString}</span>
                                                {isMe && (
                                                    <span>
                                                        {isTemp ? (
                                                            <Clock className="w-3 h-3 animate-pulse opacity-70" />
                                                        ) : msg.is_read ? (
                                                            <CheckCheck className="w-3.5 h-3.5 text-white" />
                                                        ) : (
                                                            <Check className="w-3.5 h-3.5 opacity-70" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                )}

            </main>

            {/* ── Fixed Bottom Input Bar HUD ── */}
            <footer className="sticky bottom-0 z-40 bg-background/95 backdrop-blur-2xl border-t border-border/40 p-3 sm:p-4">
                <div className="max-w-4xl mx-auto flex flex-col gap-2">
                    
                    {/* Post Attachment Preview */}
                    <AnimatePresence>
                        {referencedPost && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative flex items-center gap-3 p-2.5 rounded-xl bg-secondary/50 border border-border/50 max-w-sm mr-12 backdrop-blur-md"
                            >
                                {referencedPost.image_url ? (
                                    <div className="w-12 h-12 rounded-lg bg-black/10 overflow-hidden shrink-0 border border-border/40">
                                        <img src={referencedPost.image_url} alt="Post preview" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 text-primary">
                                        <ShoppingBag className="w-5 h-5" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold tracking-wider uppercase text-primary mb-0.5">Replying to post</p>
                                    <p className="text-xs text-foreground truncate">{referencedPost.content || 'Attached post'}</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setReferencedPost(null);
                                        router.replace(`/inbox/${conversationId}`, { scroll: false });
                                    }}
                                    className="p-1.5 rounded-full hover:bg-black/10 text-muted-foreground hover:text-foreground transition-colors absolute -top-2 -right-2 bg-background border border-border shadow-sm"
                                    title="Remove attachment"
                                    type="button"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSend} className="flex items-end gap-2.5">
                        
                        <div className="flex-1 relative bg-card/80 border border-border/60 rounded-2xl overflow-hidden focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 transition-all backdrop-blur-xl shadow-inner">
                            <textarea
                                ref={inputRef}
                                rows={1}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={`Message ${displayName}...`}
                                className="w-full px-4 py-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none max-h-32 min-h-[44px]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={(!inputText.trim() && !referencedPost) || isSending}
                            className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                                (inputText.trim() || referencedPost) && !isSending
                                    ? 'bg-primary text-primary-foreground shadow-[0_0_18px_rgba(143,245,255,0.4)] hover:scale-105 active:scale-95'
                                    : 'bg-secondary border border-border/40 text-muted-foreground opacity-50 cursor-not-allowed'
                            }`}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </footer>

            <AiPostPreview post={previewPost} onClose={() => setPreviewPost(null)} />
        </div>
    );
}
