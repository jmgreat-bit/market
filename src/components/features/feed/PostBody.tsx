'use client';

import { MapPin } from 'lucide-react';
import { PostImage, PostLink } from '@/types';
import { ImageCarousel } from './ImageCarousel';
import { LinkPreview } from './LinkPreview';

interface PostBodyProps {
    content: string;
    imageUrl?: string | null;
    images?: PostImage[];
    link?: PostLink | null;
    latitude?: number | null;
    longitude?: number | null;
}

export function PostBody({ content, imageUrl, images, link, latitude, longitude }: PostBodyProps) {
    const hasImages = images && images.length > 0;
    const hasLegacyImage = imageUrl && !hasImages;

    return (
        <div className="flex flex-col">
            {/* Text Content */}
            <div className="px-4 pb-3">
                <p className="text-[15px] font-sans text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {content}
                </p>
            </div>

            {/* Media Block Layer */}
            <div className="relative w-full rounded-xl overflow-hidden px-2 pb-2">
                {hasLegacyImage && (
                    <div className="relative aspect-video bg-surface-container-lowest rounded-lg overflow-hidden border border-border">
                        <img
                            src={imageUrl!}
                            alt="Post image"
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {hasImages && (
                    <div className="rounded-lg overflow-hidden border border-border">
                        <ImageCarousel images={images!} />
                    </div>
                )}

                {link && (
                    <div className="mt-2 text-sm">
                        <LinkPreview link={link} />
                    </div>
                )}
            </div>

            {/* Location Tag */}
            {latitude && longitude && (
                <div className="px-2 pb-1">
                    <button className="w-full px-3 py-2.5 flex items-center gap-2 rounded-lg text-[13px] font-medium text-muted-foreground bg-surface-container-low/50 border border-white/5 hover:bg-surface-container/80 transition-all hover:text-primary active:scale-[0.98]">
                        <MapPin className="w-4 h-4" />
                        <span>View on map</span>
                    </button>
                </div>
            )}
        </div>
    );
}
