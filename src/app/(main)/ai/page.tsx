'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Send, Zap, Bot, User, AlertCircle, Loader2, History, X, Plus, MessageSquare
} from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { ROUTES } from '@/lib/constants';
import Link from 'next/link';
import { StandalonePageLayout } from '@/components/layout/StandalonePageLayout';
import { AiPostCard } from '@/components/features/ai/AiPostCard';
import { AiPostPreview } from '@/components/features/ai/AiPostPreview';
import { PostWithBusiness } from '@/types';

// ── Types ──────────────────────────────────────────────
interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

interface ChatSession {
    id: string;
    created_at: string;
    preview: string;
    messages: ChatMessage[];
}

// ── Constants ──────────────────────────────────────────
const MAX_CHARS = 200;

const SUGGESTIONS = [
    'Open restaurants near me',
    'Shoe discounts today',
    'Trending shops in Kigali',
    'Services nearby',
];

// ── Animation variants ─────────────────────────────────
const messageVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

// ── Typing indicator ───────────────────────────────────
function TypingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 max-w-[85%]"
        >
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3 border border-border/30">
                <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            className="w-2 h-2 rounded-full bg-purple-400/60"
                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                delay: i * 0.2,
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

// ── Page component ──────────────────────────────────────
export default function AiDiscoveryPage() {
    const { user, isLoading: authLoading } = useUser();
    const { coordinates } = useGeolocation();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [credits, setCredits] = useState<number | null>(null);
    const [creditsLoading, setCreditsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPost, setSelectedPost] = useState<PostWithBusiness | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [historySessions, setHistorySessions] = useState<ChatSession[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');

    // Initialize session ID
    useEffect(() => {
        setSessionId(crypto.randomUUID());
    }, []);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const supabase = getSupabaseClient();

    // ── Scroll to bottom ───────────────────────────────
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isSending, scrollToBottom]);

    // ── Load credits ───────────────────────────────────
    useEffect(() => {
        if (!user) {
            setCreditsLoading(false);
            return;
        }

        async function fetchCredits() {
            setCreditsLoading(true);
            const { data } = await supabase
                .from('ai_credits')
                .select('total_credits, used_credits')
                .eq('user_id', user!.id)
                .order('purchased_at', { ascending: false })
                .limit(10);

            if (data && data.length > 0) {
                const remaining = data.reduce(
                    (acc: number, row: { total_credits: number; used_credits: number }) =>
                        acc + (row.total_credits - row.used_credits),
                    0
                );
                setCredits(Math.max(0, remaining));
            } else {
                setCredits(0);
            }
            setCreditsLoading(false);
        }
        fetchCredits();
    }, [user]);

    // ── Load conversation history ──────────────────────
    useEffect(() => {
        if (!user) return;

        async function loadHistory() {
            const { data } = await supabase
                .from('ai_conversations')
                .select('id, role, content, created_at')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: true })
                .limit(50);

            if (data && data.length > 0) {
                setMessages(data);
            }
        }
        loadHistory();
    }, [user]);

    // ── Send message ───────────────────────────────────
    const sendMessage = useCallback(async (text?: string) => {
        const messageText = (text || input).trim();
        if (!messageText || !user || isSending) return;
        if (credits !== null && credits <= 0) return;
        if (messageText.length > MAX_CHARS) return;

        setError(null);
        setInput('');
        setIsSending(true);

        // Optimistic user message
        const userMsg: ChatMessage = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content: messageText,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);

        try {

            // Call AI API
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    userId: user.id,
                    sessionId: sessionId,
                    latitude: coordinates?.latitude,
                    longitude: coordinates?.longitude,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to get response');
            }

            const aiMsg: ChatMessage = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: data.response,
                created_at: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, aiMsg]);

            // Optimistically decrement credits locally (backend handles the actual DB reduction)
            if (credits !== null) {
                setCredits((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    }, [input, user, isSending, credits, coordinates, supabase]);

    // ── Handle key press ───────────────────────────────
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const charCount = input.length;
    const isOverLimit = charCount > MAX_CHARS;
    const noCredits = credits !== null && credits <= 0;
    const isInputDisabled = noCredits || !user || authLoading;

    const openHistory = async () => {
        setShowHistory(true);
        if (!user) return;
        setLoadingHistory(true);
        try {
            const res = await fetch(`/api/ai/history?userId=${user.id}`);
            const data = await res.json();
            if (data.sessions) setHistorySessions(data.sessions);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const startNewChat = () => {
        setSessionId(crypto.randomUUID());
        setMessages([]);
        setShowHistory(false);
        inputRef.current?.focus();
    };

    const loadSession = (session: ChatSession) => {
        setSessionId(session.id);
        setMessages(session.messages);
        setShowHistory(false);
    };

    // Credits badge and History button for the header
    const headerElements = (
        <div className="flex items-center gap-3">
            <button 
                onClick={openHistory}
                className="w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center hover:bg-secondary/80 transition-colors"
                title="View Chat History"
            >
                <History className="w-4 h-4" />
            </button>
            {!creditsLoading && credits !== null && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                    credits > 0
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-destructive/10 text-destructive border border-destructive/20'
                }`}>
                    <Zap className="w-3.5 h-3.5" />
                    <span>{credits} credit{credits !== 1 ? 's' : ''} left</span>
                </div>
            )}
        </div>
    );

    return (
        <StandalonePageLayout title="AI Discovery" rightElement={headerElements}>
            <div className="flex flex-col h-[100dvh] bg-background text-foreground">

            {/* ── Messages area ─────────────────────── */}
            <main className="flex-1 overflow-y-auto pt-4 pb-28 px-4">
                <div className="max-w-3xl mx-auto space-y-4">

                    {/* Empty state */}
                    {messages.length === 0 && !isSending && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
                                <Sparkles className="w-10 h-10 text-purple-400" />
                            </div>
                            <h2 className="font-display font-bold text-2xl tracking-tight text-foreground mb-2">
                                Ask me anything
                            </h2>
                            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mb-8">
                                Find restaurants, shops, deals, and services near you
                            </p>

                            {/* Suggestion chips */}
                            <div className="flex flex-wrap justify-center gap-2 max-w-md">
                                {SUGGESTIONS.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => sendMessage(suggestion)}
                                        disabled={isInputDisabled}
                                        className="glass-card px-4 py-2.5 rounded-full border border-purple-500/30 text-sm font-medium text-foreground/90 bg-purple-500/5 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Chat messages */}
                    <AnimatePresence mode="popLayout">
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                variants={messageVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                layout
                                className={`flex items-start gap-3 ${
                                    msg.role === 'user' ? 'flex-row-reverse' : ''
                                }`}
                            >
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                    msg.role === 'user'
                                        ? 'bg-primary/10'
                                        : 'bg-purple-500/10'
                                }`}>
                                    {msg.role === 'user'
                                        ? <User className="w-4 h-4 text-primary" />
                                        : <Bot className="w-4 h-4 text-purple-400" />
                                    }
                                </div>

                                {/* Bubble */}
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                    msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                        : 'glass-card border border-border/30 rounded-tl-sm'
                                }`}>
                                    {(() => {
                                        try {
                                            const parsed = JSON.parse(msg.content);
                                            if (parsed.text) {
                                                return (
                                                    <div>
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{parsed.text}</p>
                                                        {parsed.posts && parsed.posts.length > 0 && (
                                                            <div className="mt-3 flex flex-col gap-2">
                                                                {parsed.posts.map((post: any) => (
                                                                    <AiPostCard 
                                                                        key={post.id} 
                                                                        post={post} 
                                                                        onClick={() => setSelectedPost(post)}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }
                                        } catch (e) {
                                            // Fallback if not JSON
                                        }
                                        
                                        return (
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                {msg.content}
                                            </p>
                                        );
                                    })()}
                                </div>
                            </motion.div>
                        ))}

                        {/* Typing indicator */}
                        {isSending && <TypingIndicator key="typing" />}
                    </AnimatePresence>

                    {/* Error message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm max-w-md mx-auto"
                        >
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* ── Input bar ─────────────────────────── */}
            <div className="fixed bottom-0 w-full bg-background/80 backdrop-blur-2xl border-t border-border/10 safe-bottom z-40">
                <div className="max-w-3xl mx-auto px-4 py-3">

                    {/* No credits state */}
                    {noCredits && (
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <p className="text-sm text-muted-foreground">No credits remaining</p>
                            <Link
                                href={ROUTES.PREMIUM}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-sm font-bold hover:bg-purple-500/25 transition-colors"
                            >
                                <Zap className="w-3.5 h-3.5" />
                                Buy Credits
                            </Link>
                        </div>
                    )}

                    <div className="flex items-end gap-3">
                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isInputDisabled}
                                placeholder={
                                    noCredits
                                        ? 'No credits remaining...'
                                        : !user
                                            ? 'Sign in to chat...'
                                            : 'Ask about local businesses...'
                                }
                                className="w-full glass-card border border-border/50 rounded-2xl px-5 py-3.5 pr-16 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-transparent"
                                maxLength={MAX_CHARS + 20}
                            />

                            {/* Character count */}
                            {input.length > 0 && (
                                <span className={`absolute right-14 bottom-4 text-[10px] font-bold tracking-wider ${
                                    isOverLimit ? 'text-destructive' : 'text-muted-foreground'
                                }`}>
                                    {charCount}/{MAX_CHARS}
                                </span>
                            )}
                        </div>

                        {/* Send button */}
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isOverLimit || isInputDisabled || isSending}
                            className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                        >
                            {isSending
                                ? <Loader2 className="w-5 h-5 animate-spin" />
                                : <Send className="w-5 h-5" />
                            }
                        </button>
                    </div>

                    {/* Over limit warning */}
                    {isOverLimit && (
                        <motion.p
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-1.5 text-destructive text-xs mt-2 pl-1"
                        >
                            <AlertCircle className="w-3.5 h-3.5" />
                            Message exceeds {MAX_CHARS} character limit
                        </motion.p>
                    )}
                </div>
            </div>
        </div>
        <AiPostPreview post={selectedPost} onClose={() => setSelectedPost(null)} />

        {/* History Modal */}
        <AnimatePresence>
            {showHistory && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
                    onClick={() => setShowHistory(false)}
                >
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="w-full max-w-lg h-[80vh] bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-border/50 flex justify-between items-center bg-secondary/20">
                            <h2 className="font-display font-bold flex items-center gap-2">
                                <History className="w-5 h-5 text-primary" />
                                Chat History
                            </h2>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={startNewChat}
                                    className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center gap-1 hover:opacity-90 transition-opacity"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Chat
                                </button>
                                <button 
                                    onClick={() => setShowHistory(false)}
                                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loadingHistory ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : historySessions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2">
                                    <History className="w-12 h-12 opacity-20" />
                                    <p>No past conversations found.</p>
                                </div>
                            ) : (
                                historySessions.map((session) => (
                                    <button 
                                        key={session.id} 
                                        onClick={() => loadSession(session)}
                                        className={`w-full text-left flex flex-col gap-1 p-4 rounded-2xl border transition-all ${
                                            session.id === sessionId 
                                                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                                                : 'glass-card border-border/50 text-foreground hover:bg-secondary/50'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center w-full">
                                            <div className="flex items-center gap-2 truncate flex-1">
                                                <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                                                <span className="font-bold text-sm truncate">{session.preview}</span>
                                            </div>
                                            <span className="text-xs opacity-50 shrink-0 ml-4">
                                                {new Date(session.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs opacity-60 pl-6">
                                            {session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
        </StandalonePageLayout>
    );
}
