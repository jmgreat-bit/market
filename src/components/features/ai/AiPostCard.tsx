import { PostWithBusiness } from '@/types';
import { MapPin, Image as ImageIcon } from 'lucide-react';

interface AiPostCardProps {
    post: PostWithBusiness;
    onClick: () => void;
}

export function AiPostCard({ post, onClick }: AiPostCardProps) {
    const businessName = post.business?.business_name || 'MarketPLC Trader';
    const category = post.business?.category || 'General';
    const snippet = post.content.length > 60 ? post.content.substring(0, 60) + '...' : post.content;
    const hasImage = !!post.image_url || (post.images && post.images.length > 0);

    return (
        <div 
            onClick={onClick}
            className="group flex flex-col gap-2 p-3 mt-3 rounded-2xl border border-border/40 bg-card/40 hover:bg-card/80 hover:border-purple-500/30 transition-all cursor-pointer backdrop-blur-sm max-w-[280px]"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-bold text-sm text-foreground truncate">{businessName}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm">
                            {category}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">
                        {snippet}
                    </p>
                </div>
                {hasImage ? (
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-secondary/50 border border-border/50 overflow-hidden relative">
                        <img 
                            src={post.image_url || (post.images ? post.images[0].url : '')} 
                            alt="Post thumbnail" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-secondary/50 border border-border/50 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                )}
            </div>
        </div>
    );
}
