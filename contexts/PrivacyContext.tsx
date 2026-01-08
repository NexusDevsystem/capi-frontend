import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

interface PrivacyContextType {
    privacyMode: boolean;
    togglePrivacy: () => void;
    isAnimating: boolean;
}

const PrivacyContext = createContext<PrivacyContextType>({
    privacyMode: false,
    togglePrivacy: () => { },
    isAnimating: false,
});

export const usePrivacy = () => useContext(PrivacyContext);

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initial state from local storage
    const [privacyMode, setPrivacyMode] = useState(() => localStorage.getItem('capi_privacy') === 'true');
    const [isAnimating, setIsAnimating] = useState(false);

    const togglePrivacy = () => {
        if (isAnimating) return; // Prevent double clicks during animation

        setIsAnimating(true);
        const scaleElement = document.getElementById('disintegration-scale');

        if (scaleElement) {
            // Timeline for the disintegration effect
            const tl = gsap.timeline({
                onComplete: () => {
                    setIsAnimating(false);
                    // Update state in the middle or end?
                    // To look good: 
                    // 1. Disintegrate (Scale 0 -> 50)
                    // 2. Switch Content
                    // 3. Reintegrate (Scale 50 -> 0) (Optional, or just fade in)
                }
            });

            // If we are currently VISIBLE (privacyMode = false), we want to HIDE.
            // Animation: Disintegrate Value -> Switch to Hidden -> Fade In Hidden
            if (!privacyMode) {
                // Hiding: Disintegrate
                tl.to(scaleElement, {
                    attr: { scale: 100 },
                    duration: 0.5,
                    ease: "power2.in"
                })
                    .call(() => {
                        setPrivacyMode(true);
                        localStorage.setItem('capi_privacy', 'true');
                    })
                    .to(scaleElement, {
                        attr: { scale: 0 },
                        duration: 0.5,
                        ease: "power2.out"
                    });
            } else {
                // Showing: Switch to Value -> Reintegrate (Reverse Disintegration)
                // Or: Disintegrate Dots -> Switch -> Reintegrate Value

                // Let's try: Disintegrate Dots -> Show Value (Disintegrated) -> Reintegrate
                tl.to(scaleElement, {
                    attr: { scale: 60 },
                    duration: 0.4,
                    ease: "power2.in"
                })
                    .call(() => {
                        setPrivacyMode(false);
                        localStorage.setItem('capi_privacy', 'false');
                    })
                    .to(scaleElement, {
                        attr: { scale: 0 },
                        duration: 0.5,
                        ease: "power2.out"
                    });
            }
        } else {
            // Fallback if SVG not found
            const newState = !privacyMode;
            setPrivacyMode(newState);
            localStorage.setItem('capi_privacy', String(newState));
            setIsAnimating(false);
        }
    };

    return (
        <PrivacyContext.Provider value={{ privacyMode, togglePrivacy, isAnimating }}>
            {children}
        </PrivacyContext.Provider>
    );
};
