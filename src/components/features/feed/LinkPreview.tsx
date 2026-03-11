'use client';

import { PostLink } from '@/types';
import { ExternalLink, Link as LinkIcon } from 'lucide-react';

interface LinkPreviewProps {
    link: PostLink;
}

export function LinkPreview({ link }: LinkPreviewProps) {
    return (
        <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors group"
        >
            <div className="flex">
                {/* Thumbnail */}
                {link.thumbnail_url && (
                    <div className="w-24 h-24 sm:w-32 sm:h-24 flex-shrink-0 bg-secondary">
                        <img
                            src={link.thumbnail_url}
                            alt={link.title || 'Link preview'}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 p-3 min-w-0">
                    {/* Domain */}
                    {link.domain && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <LinkIcon className="w-3 h-3" />
                            <span className="truncate">{link.domain}</span>
                        </div>
                    )}

                    {/* Title */}
                    {link.title && (
                        <h4 className="font-medium text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {link.title}
                        </h4>
                    )}

                    {/* Description */}
                    {link.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {link.description}
                        </p>
                    )}
                </div>

                {/* External Link Icon */}
                <div className="flex items-center pr-3">
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
            </div>
        </a>
    );
}
