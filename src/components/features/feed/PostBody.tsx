'use client';

import { MapPin, Hash } from 'lucide-react';
import { PostImage, PostLink, PostType, PollOption } from '@/types';
import { ImageCarousel } from './ImageCarousel';
import { LinkPreview } from './LinkPreview';
import { PollDisplay } from './PollDisplay';
import { CounterControls } from './CounterControls';
import { useUser } from '@/hooks/useUser';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PostBodyProps {
    content: string;
    imageUrl?: string | null;
    images?: PostImage[];
    link?: PostLink | null;
    latitude?: number | null;
    longitude?: number | null;
    // New post type fields
    postType?: PostType;
    postId?: string;
    counterValue?: number | null;
    counterLabel?: string | null;
    pollOptions?: PollOption[];
    businessProfileId?: string;
}

export function PostBody({ 
    content, imageUrl, images, link, latitude, longitude,
    postType = 'standard', postId, counterValue, counterLabel, pollOptions, businessProfileId
}: PostBodyProps) {
    const { profile } = useUser();
    const router = useRouter();
    const hasImages = images && images.length > 0;
    const hasLegacyImage = imageUrl && !hasImages;
    const isOwner = profile?.id === businessProfileId;
    const [liveCounterValue, setLiveCounterValue] = useState(counterValue ?? 0);

    const handleViewOnMap = () => {
        if (latitude && longitude) {
            router.push(`/map?lat=${latitude}&lng=${longitude}`);
        }
    };

    return (
        <div className="flex flex-col">
            {/* Text Content — always shown for all post types */}
            <div className="px-3 pb-2">
                <p className="text-[13px] font-sans text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {content}
                </p>
            </div>

            {/* Counter Display */}
            {postType === 'counter' && (
                <div className="px-4 pb-4">
                    <div className="bg-secondary/50 rounded-2xl p-6 border border-border/30 text-center space-y-2">
                        {counterLabel && (
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-1.5">
                                <Hash className="w-3.5 h-3.5" />
                                {counterLabel}
                            </p>
                        )}
                        <div className="flex items-center justify-center gap-4">
                            {isOwner && postId && (
                                <CounterControls 
                                    postId={postId} 
                                    currentValue={liveCounterValue} 
                                    label={counterLabel || ''} 
                                    onUpdate={setLiveCounterValue} 
                                />
                            )}
                            {!isOwner && (
                                <p className="text-6xl font-black text-foreground tabular-nums">
                                    {liveCounterValue}
                                </p>
                            )}
                        </div>
                        {isOwner && (
                            <p className="text-6xl font-black text-foreground tabular-nums">
                                {liveCounterValue}
                            </p>
                        )}
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            Live Counter
                        </p>
                    </div>
                </div>
            )}

            {/* Poll Display */}
            {postType === 'poll' && pollOptions && pollOptions.length > 0 && postId && (
                <div className="px-4 pb-4">
                    <PollDisplay postId={postId} options={pollOptions} />
                </div>
            )}

            {/* Media Block Layer */}
            <div className="relative w-full rounded-xl overflow-hidden px-2 pb-1">
                {hasLegacyImage && (
                    <div className="relative max-h-[350px] bg-surface-container-lowest rounded-lg overflow-hidden border border-border">
                        <img
                            src={imageUrl!}
                            alt="Post image"
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {hasImages && (
                    <div className="rounded-lg overflow-hidden border border-border">
                        <ImageCarousel images={images!} postId={postId} />
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
                <div className="px-3 pb-1">
                    <button 
                        onClick={handleViewOnMap}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all active:scale-[0.98]"
                    >
                        <MapPin className="w-3 h-3" />
                        <span>View on map</span>
                    </button>
                </div>
            )}
        </div>
    );
}
