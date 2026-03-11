'use client';

import { useState, useRef, useEffect } from 'react';
import { PostVideo } from '@/types';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';

interface VideoPlayerProps {
    video: PostVideo;
}

export function VideoPlayer({ video }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(video.autoplay ?? false);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return;

        const handleTimeUpdate = () => {
            const progress = (videoEl.currentTime / videoEl.duration) * 100;
            setProgress(progress);
        };

        videoEl.addEventListener('timeupdate', handleTimeUpdate);
        return () => videoEl.removeEventListener('timeupdate', handleTimeUpdate);
    }, []);

    const togglePlay = () => {
        const videoEl = videoRef.current;
        if (!videoEl) return;

        if (isPlaying) {
            videoEl.pause();
        } else {
            videoEl.play();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        const videoEl = videoRef.current;
        if (!videoEl) return;

        videoEl.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleFullscreen = () => {
        const videoEl = videoRef.current;
        if (!videoEl) return;

        if (videoEl.requestFullscreen) {
            videoEl.requestFullscreen();
        }
    };

    return (
        <div className="relative aspect-video bg-black overflow-hidden group">
            <video
                ref={videoRef}
                src={video.url}
                poster={video.thumbnail_url}
                className="w-full h-full object-cover"
                autoPlay={video.autoplay}
                muted={isMuted}
                loop
                playsInline
                onClick={togglePlay}
            />

            {/* Play/Pause Overlay */}
            <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                onClick={togglePlay}
            >
                {!isPlaying && (
                    <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/30 rounded-full mb-2 cursor-pointer">
                    <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={togglePlay}
                            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                        >
                            {isPlaying ? (
                                <Pause className="w-4 h-4" />
                            ) : (
                                <Play className="w-4 h-4 ml-0.5" />
                            )}
                        </button>
                        <button
                            onClick={toggleMute}
                            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                        >
                            {isMuted ? (
                                <VolumeX className="w-4 h-4" />
                            ) : (
                                <Volume2 className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                    <button
                        onClick={handleFullscreen}
                        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
