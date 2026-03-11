'use client';

import { motion } from 'framer-motion';
import { PostWithBusiness } from '@/types';
import { PostCard } from './PostCard';
import { Loader2 } from 'lucide-react';

interface FeedListProps {
    posts: PostWithBusiness[];
    isLoading: boolean;
    error: string | null;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
    },
};

export function FeedList({ posts, isLoading, error }: FeedListProps) {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Loading shouts...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <span className="text-2xl">⚠️</span>
                </div>
                <p className="text-sm text-muted-foreground text-center max-w-xs">{error}</p>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                    <span className="text-3xl">📢</span>
                </div>
                <h3 className="font-semibold text-foreground mb-1">No Shouts Yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                    Businesses in your area haven&apos;t posted any shouts yet. Check back soon!
                </p>
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
        >
            {posts.map((post) => (
                <motion.div key={post.id} variants={itemVariants}>
                    <PostCard post={post} />
                </motion.div>
            ))}
        </motion.div>
    );
}
