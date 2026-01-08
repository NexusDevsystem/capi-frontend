import React from 'react';
import { usePrivacy } from '../contexts/PrivacyContext';

interface PrivacyToggleProps {
    className?: string; // Allow custom styling for the button container
    iconSize?: string;
}

export const PrivacyToggle: React.FC<PrivacyToggleProps> = ({
    className = "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors",
    iconSize = "text-2xl"
}) => {
    const { privacyMode, togglePrivacy, isAnimating } = usePrivacy();

    return (
        <button
            onClick={togglePrivacy}
            disabled={isAnimating}
            className={`${className} ${isAnimating ? 'cursor-wait opacity-70' : ''}`}
            title={privacyMode ? "Exibir valores" : "Ocultar valores"}
        >
            <span className={`material-symbols-outlined ${iconSize}`}>
                {privacyMode ? 'visibility_off' : 'visibility'}
            </span>
        </button>
    );
};
