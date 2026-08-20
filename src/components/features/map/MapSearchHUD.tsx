'use client';

import { useState } from 'react';
import {
    Search,
    Filter,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DISCOVERY_TOPICS, DiscoveryTopic } from '@/lib/constants';

interface MapSearchHUDProps {
    onCategoryFilter?: (keyword: string | null) => void;
    onSearchSubmit?: (query: string) => void;
}

export function MapSearchHUD({ onCategoryFilter, onSearchSubmit }: MapSearchHUDProps) {
    const [query, setQuery] = useState('');
    const [activeTopicId, setActiveTopicId] = useState<string>('all');

    const handleTopicClick = (topic: DiscoveryTopic) => {
        if (activeTopicId === topic.id || topic.id === 'all') {
            setActiveTopicId('all');
            if (onCategoryFilter) onCategoryFilter(null);
        } else {
            setActiveTopicId(topic.id);
            // Send search keyword / category filter to map
            const filterValue = topic.categoryFilter || topic.keywords[0] || topic.id;
            if (onCategoryFilter) onCategoryFilter(filterValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (onSearchSubmit) onSearchSubmit(query);
            if (onCategoryFilter) onCategoryFilter(query.trim() || null);
        }
    };

    return (
        <div className="absolute top-0 left-0 w-full z-20 pointer-events-none p-3 md:p-6">
            <div className="max-w-lg mx-auto space-y-2 pointer-events-auto">
                {/* Search Bar HUD */}
                <div className="glass-card rounded-full border border-border/50 flex items-center px-4 py-2 shadow-2xl backdrop-blur-3xl bg-background/80">
                    <Search className="w-4 h-4 text-primary mr-2.5 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search area (e.g. Inzu, Imodoka, Isoko, MTN)..."
                        className="bg-transparent border-none focus:outline-none text-xs md:text-sm w-full placeholder:text-muted-foreground font-medium text-foreground"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (onCategoryFilter) onCategoryFilter(e.target.value.trim() || null);
                        }}
                        onKeyDown={handleKeyDown}
                    />
                    {query && (
                        <button 
                            onClick={() => {
                                setQuery('');
                                if (onCategoryFilter) onCategoryFilter(null);
                            }}
                            className="p-1 text-muted-foreground hover:text-foreground mr-1"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Quick Filters Scrollable Bar */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                    {DISCOVERY_TOPICS.map((topic) => {
                        const isActive = activeTopicId === topic.id;
                        return (
                            <button
                                key={topic.id}
                                onClick={() => handleTopicClick(topic)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all whitespace-nowrap backdrop-blur-xl shadow-md text-xs",
                                    isActive
                                        ? "bg-primary border-primary text-[#003f43] font-bold scale-[1.02]"
                                        : "glass-card border-border/40 text-foreground hover:border-primary/40 bg-background/70 hover:bg-background/90"
                                )}
                            >
                                <span>{topic.icon}</span>
                                <span>{topic.label}</span>
                                {isActive && topic.id !== 'all' && <X className="w-3 h-3 ml-0.5" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
