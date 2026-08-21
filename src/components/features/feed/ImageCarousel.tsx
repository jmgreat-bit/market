'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PostImage } from '@/types';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ImageCarouselProps {
    images: PostImage[];
    postId?: string;
}

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
};

const variants = {
    enter: (direction: number) => {
        return {
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0,
            scale: 0.95
        };
    },
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
        scale: 1
    },
    exit: (direction: number) => {
        return {
            zIndex: 0,
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0,
            scale: 0.95
        };
    }
};

export function ImageCarousel({ images, postId }: ImageCarouselProps) {
    const [[page, direction], setPage] = useState([0, 0]);
    const router = useRouter();

    if (!images || images.length === 0) return null;

    const currentIndex = Math.abs(page % images.length);

    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    };

    const goToIndex = (index: number) => {
        const dir = index > currentIndex ? 1 : -1;
        setPage([page + (index - currentIndex), dir]);
    };

    return (
        <div className="relative aspect-video bg-[#0f172a] overflow-hidden group select-none">
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={page}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: 'spring', stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                    }}
                    drag={images.length > 1 ? 'x' : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }) => {
                        const swipe = swipePower(offset.x, velocity.x);

                        if (swipe < -swipeConfidenceThreshold) {
                            paginate(1);
                        } else if (swipe > swipeConfidenceThreshold) {
                            paginate(-1);
                        }
                    }}
                    onClick={() => {
                        if (postId) {
                            router.push(`/post/${postId}`);
                        }
                    }}
                    className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 backdrop-blur-3xl"
                >
                    {/* The image itself */}
                    <img
                        src={images[currentIndex].url}
                        alt={images[currentIndex].alt || `Media ${currentIndex + 1}`}
                        className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
                    />
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows (Desktop) */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/60 border border-white/10 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-10"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); paginate(1); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/60 border border-white/10 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-10"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}

            {/* Cyber-Glass Indicators */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-black/20 backdrop-blur-xl px-3 py-2 rounded-full border border-white/5">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => { e.stopPropagation(); goToIndex(index); }}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                index === currentIndex
                                    ? 'bg-cyan-400 w-6 shadow-[0_0_10px_rgba(34,211,238,0.6)]'
                                    : 'bg-white/40 w-1.5 hover:bg-white/70'
                            }`}
                        />
                    ))}
                </div>
            )}

            {/* Top Badge */}
            {images.length > 1 && (
                <div className="absolute top-3 right-3 z-10">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-lg">
                        <ImageIcon className="w-3 h-3 text-cyan-400" />
                        <span className="text-[10px] font-bold tracking-wider">
                            {currentIndex + 1} / {images.length}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
