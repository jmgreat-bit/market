'use client';

import { useSavedPosts } from '@/hooks/useSavedPosts';
import { FeedList } from '@/components/features/feed/FeedList';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function SavedPage() {
    const { posts, isLoading, error } = useSavedPosts();
    const router = useRouter();

    return (
        <div className="min-h-screen pb-32">
            {/* Header */}
            <header className="sticky top-[4.5rem] md:top-20 z-40 bg-background/90 backdrop-blur-xl border-b border-[rgba(72,72,73,0.1)] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="font-display font-bold text-lg text-foreground">Saved Posts</h1>
                </div>
            </header>

            <div className="flex-1 px-6 md:px-10 pt-6 max-w-3xl mx-auto w-full pb-10">
                <p className="text-muted-foreground text-sm mb-8 max-w-lg">
                    A private collection of the posts and places you&apos;ve bookmarked.
                </p>
                <FeedList posts={posts} isLoading={isLoading} error={error} />
            </div>
        </div>
    );
}
