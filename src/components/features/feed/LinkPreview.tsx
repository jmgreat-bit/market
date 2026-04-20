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
            className="block bg-[#131314] rounded-md border border-[rgba(72,72,73,0.15)] overflow-hidden hover:border-primary/50 transition-colors group"
        >
            {/* Thumbnail */}
            {link.thumbnail_url && (
                <div className="h-24 w-full bg-[#1a191b] relative">
                    <img
                        src={link.thumbnail_url}
                        alt={link.title || 'Link preview'}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                </div>
            )}

            {/* Content */}
            <div className="p-3">
                {link.title && (
                    <h4 className="font-display font-medium text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                        {link.title}
                    </h4>
                )}
                {link.domain && (
                    <p className="text-xs text-muted-foreground truncate">
                        {link.domain}
                    </p>
                )}
            </div>
        </a>
    );
}
