'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Star, MessageSquare, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface Review {
    id: string;
    rating: number;
    review: string;
    created_at: string;
    user_id: string;
    user?: {
        full_name?: string;
        username?: string;
        avatar_url?: string;
    };
}

interface ProfileReviewsProps {
    businessId: string;
    initialReviews: Review[];
    averageRating: number;
}

export default function ProfileReviews({ businessId, initialReviews, averageRating }: ProfileReviewsProps) {
    const { user, profile } = useUser();
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [isWriting, setIsWriting] = useState(false);
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch user details for initial reviews since the server query just gets the raw row
    useEffect(() => {
        if (initialReviews.length === 0) return;
        async function fetchUserDetails() {
            try {
                const supabase = getSupabaseClient();
                const userIds = initialReviews.map(r => r.user_id);
                const { data: users } = await supabase
                    .from('profiles')
                    .select('id, full_name, username, avatar_url')
                    .in('id', userIds);
                
                if (users) {
                    const userMap = new Map(users.map((user: any) => [user.id, user]));
                    const enriched = initialReviews.map(r => {
                        const u = userMap.get(r.user_id) as any;
                        return { ...r, user: u };
                    });
                    setReviews(enriched as any); // Cast entire array due to loose initial review types
                }
            } catch(e) {}
        }
        fetchUserDetails();
    }, [initialReviews]);

    const hasReviewed = reviews.some(r => r.user_id === user?.id);
    const canReview = user && !hasReviewed;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profile) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const supabase = getSupabaseClient();
            const { data, error: insertError } = await supabase
                .from('business_reviews')
                .insert({
                    business_id: businessId,
                    user_id: user.id,
                    rating,
                    review: reviewText.trim()
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Optimistic update
            const newReview: Review = {
                ...data,
                user: {
                    full_name: profile.full_name,
                    username: profile.username,
                    avatar_url: profile.avatar_url
                }
            };
            setReviews([newReview, ...reviews]);
            setIsWriting(false);
            setReviewText('');
        } catch (err: any) {
            setError(err.message || 'Failed to submit review. Make sure you have run the SQL script.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-display font-black text-xl tracking-tight flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    Customer Reviews
                </h3>
                {reviews.length > 0 && (
                    <span className="font-bold text-foreground">
                        {averageRating.toFixed(1)} <span className="text-muted-foreground text-sm font-normal">({reviews.length})</span>
                    </span>
                )}
            </div>

            {canReview && !isWriting && (
                <div className="bg-secondary/30 border border-border/50 rounded-2xl p-5 text-center">
                    <p className="text-sm text-muted-foreground mb-4">Been here? Share your experience with others.</p>
                    <Button onClick={() => setIsWriting(true)} className="bg-primary text-primary-foreground font-bold rounded-xl">
                        Write a Review
                    </Button>
                </div>
            )}

            {isWriting && (
                <form onSubmit={handleSubmit} className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold">Rate your experience</h4>
                        <button type="button" onClick={() => setIsWriting(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                    </div>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="focus:outline-none transition-transform hover:scale-110"
                            >
                                <Star className={`w-8 h-8 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        required
                        placeholder="What did you think of their products or services?"
                        className="w-full bg-secondary border border-border/50 rounded-xl p-3 text-sm focus:outline-none focus:border-primary/60 resize-none h-24"
                    />
                    {error && <p className="text-xs text-destructive">{error}</p>}
                    <Button type="submit" disabled={isSubmitting || !reviewText.trim()} className="w-full bg-primary text-primary-foreground font-bold rounded-xl">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
                    </Button>
                </form>
            )}

            <div className="space-y-4">
                {reviews.length === 0 ? (
                    !isWriting && (
                        <div className="text-center py-8 bg-secondary/20 rounded-2xl border border-dashed border-border/50">
                            <MessageSquare className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                            <p className="text-muted-foreground text-sm font-medium">No reviews yet.</p>
                        </div>
                    )
                ) : (
                    reviews.map((r) => (
                        <div key={r.id} className="bg-card border border-border/50 rounded-2xl p-5">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex gap-3 items-center">
                                    <Avatar className="w-10 h-10 ring-1 ring-border shadow-sm">
                                        <AvatarImage src={r.user?.avatar_url} />
                                        <AvatarFallback>{(r.user?.full_name || r.user?.username || 'U').charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-sm">{r.user?.full_name || r.user?.username || 'Anonymous User'}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-0.5 bg-amber-400/10 px-2 py-1 rounded-full border border-amber-400/20">
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                    <span className="text-xs font-bold text-amber-600">{r.rating}</span>
                                </div>
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed">{r.review}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
