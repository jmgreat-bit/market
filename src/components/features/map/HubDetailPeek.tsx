import { motion } from 'framer-motion';
import { X, Building2, MapPin, Navigation, ArrowRight } from 'lucide-react';
import { CommercialHub } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface HubDetailPeekProps {
    hub: CommercialHub;
    onClose: () => void;
    businessCount?: number;
}

export function HubDetailPeek({ hub, onClose, businessCount = 0 }: HubDetailPeekProps) {
    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40"
        >
            <div className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
                <div className="h-32 bg-secondary relative shrink-0">
                    {hub.image_url ? (
                        <img src={hub.image_url} alt={hub.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full geo-gradient opacity-30" />
                    )}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors z-10"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                </div>
                
                <div className="p-5 flex-1 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                            Commercial Hub
                        </span>
                    </div>
                    <h3 className="text-2xl font-black font-display text-foreground leading-tight mb-1">
                        {hub.name}
                    </h3>
                    <p className="text-muted-foreground text-sm flex items-center gap-1.5 mb-4">
                        <MapPin className="w-3.5 h-3.5" /> {hub.address || 'Kigali'}
                    </p>
                    
                    {hub.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-6">
                            {hub.description}
                        </p>
                    )}

                    <Link href={`/explore/hub/${hub.id}`} className="block">
                        <Button className="w-full bg-primary text-primary-foreground font-bold rounded-xl h-12 shadow-[0_0_20px_rgba(143,245,255,0.2)] hover:scale-[1.02] transition-transform">
                            Enter Directory <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
