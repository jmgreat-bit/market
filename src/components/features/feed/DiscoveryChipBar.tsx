'use client';

import { cn } from '@/lib/utils';
import { DISCOVERY_TOPICS, DiscoveryTopic } from '@/lib/constants';

interface DiscoveryChipBarProps {
    activeTopicId?: string;
    onSelectTopic: (topic: DiscoveryTopic) => void;
    className?: string;
    compact?: boolean;
}

export function DiscoveryChipBar({
    activeTopicId = 'all',
    onSelectTopic,
    className,
    compact = false,
}: DiscoveryChipBarProps) {
    return (
        <div className={cn("w-full overflow-x-auto scrollbar-hide py-1.5", className)}>
            <div className="flex items-center gap-2 px-1 min-w-max">
                {DISCOVERY_TOPICS.map((topic) => {
                    const isActive = activeTopicId === topic.id;
                    return (
                        <button
                            key={topic.id}
                            onClick={() => onSelectTopic(topic)}
                            type="button"
                            className={cn(
                                "flex items-center gap-1.5 rounded-full transition-all shrink-0 active:scale-95",
                                compact ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-xs md:text-sm",
                                isActive
                                    ? "bg-primary text-[#003f43] font-bold shadow-md shadow-primary/20 border border-primary scale-[1.02]"
                                    : "bg-secondary/70 hover:bg-secondary text-foreground/85 border border-border/40 font-medium hover:border-primary/40 hover:text-foreground"
                            )}
                        >
                            <span className="text-sm leading-none">{topic.icon}</span>
                            <span>{topic.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
