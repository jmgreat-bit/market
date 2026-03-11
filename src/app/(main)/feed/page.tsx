'use client';

import { usePosts } from '@/hooks/usePosts';
import { FeedList } from '@/components/features/feed/FeedList';
import { Sparkles } from 'lucide-react';

export default function FeedPage() {
    const { posts, isLoading, error } = usePosts({ limit: 20 });

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 md:top-16 z-40 glass-card border-b border-border px-4 py-4">
                <div className="container mx-auto max-w-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg geo-gradient flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h1 className="text-[17px] font-semibold text-foreground">Latest Shouts</h1>
                            <p className="text-[12px] text-muted-foreground mt-0.5">
                                Discover what&apos;s happening nearby
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feed content */}
            <div className="container mx-auto max-w-lg px-4 py-6">
                <FeedList posts={posts} isLoading={isLoading} error={error} />
            </div>
        </div>
    );
}
