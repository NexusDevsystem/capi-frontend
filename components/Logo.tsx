import React from 'react';

interface LogoProps {
    className?: string;
    showText?: boolean;
    textClassName?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-10", showText = true, textClassName = "text-3xl" }) => {
    return (
        <img
            src="/images/logo.png"
            alt="Capi Logo"
            className={`${className} w-auto object-contain scale-[1.5]`}
        />
    );
};