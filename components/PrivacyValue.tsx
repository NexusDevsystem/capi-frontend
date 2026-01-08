import React, { useRef, useEffect } from 'react';
import { usePrivacy } from '../contexts/PrivacyContext';

interface PrivacyValueProps {
    value: React.ReactNode;
    blurContent?: React.ReactNode;
    className?: string; // To allow external styling (font size, color)
}

export const PrivacyValue: React.FC<PrivacyValueProps> = ({ value, blurContent, className = '' }) => {
    const { privacyMode, isAnimating } = usePrivacy();

    // While animating, we want to apply the displacement filter
    const style: React.CSSProperties = isAnimating ? {
        filter: 'url(#disintegration-filter)',
        willChange: 'filter, opacity'
    } : {};

    return (
        <span className={`inline-block transition-opacity duration-200 ${className}`} style={style}>
            {privacyMode ? (
                // Hidden State
                blurContent || <span className="blur-sm select-none opacity-50">••••••</span>
            ) : (
                // Visible State
                value
            )}
        </span>
    );
};
