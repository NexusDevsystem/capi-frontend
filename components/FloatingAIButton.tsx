import React from 'react';

interface FloatingAIButtonProps {
    onClick: () => void;
}

export const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center group"
            title="Assistente IA (Ctrl+Space)"
        >
            <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">
                smart_toy
            </span>

            {/* Pulse Animation */}
            <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20"></span>
        </button>
    );
};
