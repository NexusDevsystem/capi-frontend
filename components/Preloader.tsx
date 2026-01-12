import React, { useState, useEffect, useRef } from 'react';

export const Preloader: React.FC<{ onLoadingComplete?: () => void }> = ({ onLoadingComplete }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleVideoEnd = () => {
        // Video ended, finish sequence
        setFadeOut(true);
        setTimeout(() => {
            setIsLoading(false);
            onLoadingComplete?.();
        }, 500);
    };

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const render = () => {
            if (!video.paused && !video.ended) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
            animationFrameId = requestAnimationFrame(render);
        };

        const onPlay = () => {
            render();
        };

        const onLoadedMetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        };

        video.addEventListener('play', onPlay);
        video.addEventListener('loadedmetadata', onLoadedMetadata);

        if (video.paused) {
            video.play().catch(() => { });
        }

        return () => {
            video.removeEventListener('play', onPlay);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    if (!isLoading) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] bg-white flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'
                }`}
        >
            {/* Hidden Source Video - Only Mascot Animation */}
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onEnded={handleVideoEnd}
                controls={false}
                src="/videos/mascote_animação_preloader.mp4"
                className="absolute opacity-0 pointer-events-none w-0 h-0"
            />

            {/* Canvas Display */}
            <canvas
                ref={canvasRef}
                className="w-64 h-64 object-contain"
            />
        </div>
    );
};
