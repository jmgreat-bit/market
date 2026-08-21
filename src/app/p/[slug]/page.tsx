import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PostCard } from '@/components/features/feed/PostCard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PostPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createClient();

    // The slug might be a UUID if the user shared an old link, so we check both
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    let query = supabase
        .from('posts')
        .select(`
            content,
            image_url,
            business:business_details(business_name)
        `);

    if (isUuid) {
        query = query.eq('id', slug);
    } else {
        query = query.eq('slug', slug);
    }

    const { data: post } = await query.single();

    if (!post) {
        return {
            title: 'Post Not Found | SynchroMarket',
        };
    }

    const businessName = (post.business as any)?.[0]?.business_name || (post.business as any)?.business_name || 'SynchroMarket';
    const contentPreview = post.content ? `"${post.content.substring(0, 100)}..."` : 'Check out this post on SynchroMarket';

    return {
        title: `${businessName} on SynchroMarket`,
        description: contentPreview,
        openGraph: {
            title: `${businessName} on SynchroMarket`,
            description: contentPreview,
            images: post.image_url ? [{ url: post.image_url }] : [],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${businessName} on SynchroMarket`,
            description: contentPreview,
            images: post.image_url ? [post.image_url] : [],
        },
    };
}

export default async function PostPage({ params }: PostPageProps) {
    const { slug } = await params;
    const supabase = await createClient();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    let query = supabase
        .from('posts')
        .select(`
            *,
            business:business_details(
                *,
                profile:profiles(
                    username,
                    avatar_url,
                    trader_tier
                )
            ),
                        media:post_media(*),
            likes:likes(count),
            comments:comments(count),
            poll_options:poll_options(id, post_id, label, votes_count, created_at)
        `);

    if (isUuid) {
        query = query.eq('id', slug);
    } else {
        query = query.eq('slug', slug);
    }

    const { data, error } = await query.single();

    if (error || !data) {
        notFound();
    }

    // Transform the array response to an object 
    const post = {
        ...data,
        business: Array.isArray(data.business) ? data.business[0] : data.business
    };
    
    // Ensure nested profile is also an object
    if (post.business && Array.isArray(post.business.profile)) {
        post.business.profile = post.business.profile[0];
    }

    // Map counts from relations
    post.likes_count = (data.likes as any)?.[0]?.count ?? 0;
    post.comments_count = (data.comments as any)?.[0]?.count ?? 0;

    return (
        <div className="min-h-screen bg-background pb-32 pt-6">
            <main className="max-w-2xl mx-auto w-full px-4 md:px-8 space-y-6">
                <Link 
                    href="/feed" 
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Feed
                </Link>
                
                <PostCard 
                    post={post} 
                    autoExpandComments={true} 
                    isModalView={true} 
                />
            </main>
        </div>
    );
}
