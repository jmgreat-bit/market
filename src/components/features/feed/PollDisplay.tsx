'use client';

import { useState, useCallback } from 'react';
import { PollOption } from '@/types';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { CheckCircle, Loader2 } from 'lucide-react';

interface PollDisplayProps {
    postId: string;
    options: PollOption[];
}

export function PollDisplay({ postId, options: initialOptions }: PollDisplayProps) {
    const { profile } = useUser();
    const [options, setOptions] = useState(initialOptions);
    const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
    const [isVoting, setIsVoting] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    const totalVotes = options.reduce((sum, o) => sum + (o.votes_count || 0), 0);

    // Check if user already voted
    const checkVote = useCallback(async () => {
        if (!profile?.id || hasChecked) return;
        setHasChecked(true);
        try {
            const supabase = getSupabaseClient();
            const optionIds = options.map(o => o.id);
            const { data } = await supabase
                .from('poll_votes')
                .select('option_id')
                .eq('user_id', profile.id)
                .in('option_id', optionIds)
                .maybeSingle();
            if (data) setVotedOptionId(data.option_id);
        } catch (err) {
            console.warn('Failed to check poll vote:', err);
        }
    }, [profile?.id, options, hasChecked]);

    // Check on first render
    if (!hasChecked && profile?.id) checkVote();

    const handleVote = async (optionId: string) => {
        if (!profile?.id || votedOptionId || isVoting) return;
        setIsVoting(true);

        try {
            const supabase = getSupabaseClient();
            // Insert vote
            const { error } = await supabase
                .from('poll_votes')
                .insert({ option_id: optionId, user_id: profile.id });
            if (error) throw error;

            // Increment count locally + in DB
            await supabase
                .from('poll_options')
                .update({ votes_count: options.find(o => o.id === optionId)!.votes_count + 1 })
                .eq('id', optionId);

            setOptions(prev => prev.map(o => 
                o.id === optionId ? { ...o, votes_count: o.votes_count + 1 } : o
            ));
            setVotedOptionId(optionId);
        } catch (err) {
            console.error('Vote failed:', err);
        } finally {
            setIsVoting(false);
        }
    };

    const hasVoted = !!votedOptionId;

    return (
        <div className="space-y-2">
            {options.map(option => {
                const pct = totalVotes > 0 ? Math.round((option.votes_count / totalVotes) * 100) : 0;
                const isMyVote = votedOptionId === option.id;

                return (
                    <button
                        key={option.id}
                        onClick={() => handleVote(option.id)}
                        disabled={hasVoted || isVoting || !profile?.id}
                        className={`w-full relative overflow-hidden rounded-xl border transition-all text-left ${
                            hasVoted
                                ? isMyVote
                                    ? 'border-primary/50 bg-primary/5'
                                    : 'border-border/30 bg-secondary/30'
                                : 'border-border/50 bg-secondary/50 hover:border-primary/40 active:scale-[0.98]'
                        } ${!profile?.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                        {/* Progress bar */}
                        {hasVoted && (
                            <div 
                                className={`absolute inset-y-0 left-0 transition-all duration-500 ${isMyVote ? 'bg-primary/15' : 'bg-secondary/60'}`}
                                style={{ width: `${pct}%` }}
                            />
                        )}
                        <div className="relative px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                {isMyVote && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
                                {isVoting && !hasVoted && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
                                <span className={`text-sm truncate ${isMyVote ? 'font-bold text-foreground' : 'text-foreground/80'}`}>
                                    {option.label}
                                </span>
                            </div>
                            {hasVoted && (
                                <span className={`text-xs font-bold shrink-0 ${isMyVote ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {pct}%
                                </span>
                            )}
                        </div>
                    </button>
                );
            })}
            <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest">
                {totalVotes} vote{totalVotes !== 1 ? 's' : ''} {hasVoted ? '· You voted' : ''}
            </p>
        </div>
    );
}
