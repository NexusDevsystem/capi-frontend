import React, { useState, useEffect, useRef } from 'react';

export const Preloader: React.FC<{ onLoadingComplete?: () => void }> = ({ onLoadingComplete }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);
    const [videoStep, setVideoStep] = useState(0); // 0: loading, 1: mascot
    const [contentOpacity, setContentOpacity] = useState(1); // Control canvas opacity for transitions

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleVideoEnd = () => {
        if (videoStep === 0) {
            // First video ended, start transition
            setContentOpacity(0); // Fade out canvas

            setTimeout(() => {
                setVideoStep(1);
                // Note: Content opacity will be set back to 1 when the new video starts playing
            }, 300); // Wait for fade out
        } else {
            // Second video ended, finish sequence
            setFadeOut(true);
            setTimeout(() => {
                setIsLoading(false);
                onLoadingComplete?.();
            }, 500);
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Configuration per step
        if (videoStep === 0) {
            video.playbackRate = 2.5; // Faster loading as requested
        } else {
            video.playbackRate = 1.0; // Normal speed for mascot
        }

        let animationFrameId: number;

        const render = () => {
            if (!video.paused && !video.ended) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
            animationFrameId = requestAnimationFrame(render);
        };

        const onPlay = () => {
            render();
            // Fade in canvas when video starts playing (smooth transition)
            setContentOpacity(1);
        };

        const onLoadedMetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            // Draw initial frame if possible
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        };

        video.addEventListener('play', onPlay);
        video.addEventListener('loadedmetadata', onLoadedMetadata);

        // Ensure video plays
        if (video.paused) {
            video.play().catch(() => { });
        }

        return () => {
            video.removeEventListener('play', onPlay);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            cancelAnimationFrame(animationFrameId);
        };
    }, [videoStep]);

    if (!isLoading) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] bg-white flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'
                }`}
        >
            {/* Hidden Source Video */}
            <video
                key={videoStep}
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onEnded={handleVideoEnd}
                controls={false}
                src={videoStep === 0 ? "/videos/loading.mp4" : "/videos/mascote_animação_preloader.mp4"}
                className="absolute opacity-0 pointer-events-none w-0 h-0"
            />

            {/* Canvas Display with internal opacity transition */}
            <canvas
                ref={canvasRef}
                className="w-64 h-64 object-contain transition-opacity duration-300 ease-in-out"
                style={{ opacity: contentOpacity }}
            />
        </div>
    );
};
