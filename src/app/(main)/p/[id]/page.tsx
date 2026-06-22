'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { PostCard } from '@/components/features/feed/PostCard';
import { PostWithBusiness } from '@/types';

export default function PostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const postId = params.id as string;
    
    const [post, setPost] = useState<PostWithBusiness | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPost() {
            try {
                setIsLoading(true);
                const supabase = getSupabaseClient();
                const { data, error: fetchError } = await supabase
                    .from('posts')
                    .select(`
                        *,
                        business:business_details(
                            *,
                            profile:profiles(avatar_url, full_name, username, trader_tier)
                        ),
                        likes:likes(count),
                        comments:comments(
                            *,
                            user:profiles(full_name, username, avatar_url)
                        )
                    `)
                    .eq('id', postId)
                    .single();

                if (fetchError) throw fetchError;
                
                if (data) {
                    const transformedPost = {
                        ...data,
                        likes_count: data.likes?.[0]?.count ?? 0,
                        comments_count: data.comments?.length ?? 0,
                        comments: (data.comments || []).map((c: any) => ({
                            ...c,
                            user_name: c.user?.full_name || c.user?.username || 'User',
                            user_avatar: c.user?.avatar_url
                        })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    };
                    setPost(transformedPost as unknown as PostWithBusiness);
                }
            } catch (err) {
                console.error('Failed to fetch post:', err);
                setError('Post not found or has been removed');
            } finally {
                setIsLoading(false);
            }
        }
        
        if (postId) {
            fetchPost();
        }
    }, [postId]);

    return (
        <div className="min-h-screen bg-background pb-32">
            <header className="fixed top-[3.5rem] w-full z-50 bg-background/80 backdrop-blur-2xl px-4 h-16 flex items-center gap-4 border-b border-border/10">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full glass-card hover:bg-secondary transition-colors text-muted-foreground hover:text-primary">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="font-display font-bold text-lg">Post Details</h1>
            </header>

            <main className="pt-28 px-4 max-w-2xl mx-auto w-full">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-muted-foreground font-medium animate-pulse">Loading post...</p>
                    </div>
                ) : error || !post ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                            <span className="text-2xl">🔍</span>
                        </div>
                        <h2 className="text-xl font-bold font-display">{error || 'Post not found'}</h2>
                        <p className="text-muted-foreground mb-6">The post you are looking for might have been deleted.</p>
                        <button onClick={() => router.push('/explore')} className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-bold hover:opacity-90">
                            Go to Explore
                        </button>
                    </div>
                ) : (
                    <PostCard post={post} autoExpandComments={true} />
                )}
            </main>
        </div>
    );
}
