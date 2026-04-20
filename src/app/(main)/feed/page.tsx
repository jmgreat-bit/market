'use client';

import { usePosts } from '@/hooks/usePosts';
import { FeedList } from '@/components/features/feed/FeedList';

export default function FeedPage() {
    const { posts, isLoading, error } = usePosts({ limit: 20 });

    return (
        <div className="min-h-screen">
            {/* Feed content */}
            <div className="flex-1 px-6 md:px-10 pt-20 md:pt-28 max-w-3xl mx-auto w-full pb-32 md:pb-10">
                <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-2">
                    Following Feed
                </h1>
                <p className="text-muted-foreground text-lg mb-8 max-w-lg">
                    Latest pulses from businesses you follow and places you've visited.
                </p>
                <FeedList posts={posts} isLoading={isLoading} error={error} />
            </div>
        </div>
    );
}
