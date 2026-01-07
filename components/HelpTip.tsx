
import React, { useState } from 'react';

interface HelpTipProps {
    title?: string;
    content: string;
    className?: string;
}

export const HelpTip: React.FC<HelpTipProps> = ({ title, content, className = '' }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className={`relative inline-block ml-2 ${className}`}>
            <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="text-orange-400 hover:text-orange-600 transition-colors cursor-help"
            >
                <span className="material-symbols-outlined text-lg">help</span>
            </button>

            {isVisible && (
                <div className="absolute z-50 w-64 p-3 mt-2 -left-28 sm:left-0 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-orange-100 dark:border-slate-700 text-left animate-fade-in">
                    {title && <h4 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase mb-1">{title}</h4>}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {content}
                    </p>
                    <div className="absolute -top-1.5 left-32 sm:left-2 w-3 h-3 bg-white dark:bg-slate-800 border-t border-l border-orange-100 dark:border-slate-700 transform rotate-45"></div>
                </div>
            )}
        </div>
    );
};
