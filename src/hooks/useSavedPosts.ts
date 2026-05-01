'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { PostWithBusiness } from '@/types';
import { useUser } from '@/hooks/useUser';

export function useSavedPosts() {
    const { profile } = useUser();
    const [posts, setPosts] = useState<PostWithBusiness[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSavedPosts = useCallback(async () => {
        if (!profile?.id) return;

        try {
            setIsLoading(true);
            setError(null);

            const supabase = getSupabaseClient();
            const { data, error: fetchError } = await supabase
                .from('bookmarks')
                .select(`
                    post_id,
                    posts (
                        *,
                        business:business_details(
                            *,
                            profile:profiles(avatar_url, full_name)
                        ),
                        likes:likes(count),
                        comments:comments(count)
                    )
                `)
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            if (data) {
                // Extract the "posts" relation from the junction table
                const extractedPosts = data
                    .map((bookmark: any) => {
                        const post = bookmark.posts;
                        if (!post) return null;
                        return {
                            ...post,
                            likes_count: post.likes?.[0]?.count ?? 0,
                            comments_count: post.comments?.[0]?.count ?? 0,
                        };
                    })
                    .filter(Boolean) as unknown as PostWithBusiness[];

                setPosts(extractedPosts);
            }
        } catch (err) {
            console.error('Could not fetch saved posts:', err);
            setError('Failed to fetch saved posts');
        } finally {
            setIsLoading(false);
        }
    }, [profile?.id]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSavedPosts();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchSavedPosts]);

    return { posts, isLoading, error, refetch: fetchSavedPosts };
}
