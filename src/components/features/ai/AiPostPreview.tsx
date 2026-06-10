import { PostWithBusiness } from '@/types';
import { X, MapPin, Store, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AiPostPreviewProps {
    post: PostWithBusiness | null;
    onClose: () => void;
}

export function AiPostPreview({ post, onClose }: AiPostPreviewProps) {
    if (!post) return null;

    const business = post.business;
    const hasImage = !!post.image_url || (post.images && post.images.length > 0);
    const primaryImage = post.image_url || (post.images ? post.images[0].url : '');

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="w-full max-w-md bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header Image */}
                    {hasImage ? (
                        <div className="w-full h-64 bg-secondary relative shrink-0">
                            <img src={primaryImage} alt="Post media" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            
                            <button 
                                onClick={onClose}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="absolute bottom-4 left-4 right-4">
                                <h3 className="text-xl font-bold text-white drop-shadow-md truncate">
                                    {business?.business_name || 'MarketPLC Trader'}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-bold text-black bg-[#ffcc00] px-2 py-0.5 rounded-full uppercase tracking-wide">
                                        {business?.category || 'General'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 border-b border-border/50 flex justify-between items-start shrink-0 relative">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">
                                    {business?.business_name || 'MarketPLC Trader'}
                                </h3>
                                <span className="text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full uppercase tracking-wide mt-2 inline-block">
                                    {business?.category || 'General'}
                                </span>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                    )}

                    {/* Content Scrollable */}
                    <div className="p-6 overflow-y-auto flex-1">
                        <p className="text-base text-foreground/90 whitespace-pre-wrap leading-relaxed">
                            {post.content}
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-border/50 bg-secondary/30 shrink-0 flex gap-3">
                        <button 
                            className="flex-1 h-12 rounded-xl bg-secondary text-foreground font-bold flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
                            onClick={() => {
                                // Navigate to profile
                                onClose();
                            }}
                        >
                            <Store className="w-5 h-5" />
                            Visit Profile
                        </button>
                        <button 
                            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                            onClick={() => {
                                // Navigate to post or show full map
                                onClose();
                            }}
                        >
                            <Navigation className="w-5 h-5" />
                            View Post
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
