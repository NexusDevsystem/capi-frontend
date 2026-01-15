import React from 'react';

interface KeyboardHintProps {
    keys: string[];
    className?: string;
}

export const KeyboardHint: React.FC<KeyboardHintProps> = ({ keys, className = '' }) => {
    const isMac = navigator.platform.includes('Mac');

    const formatKey = (key: string): string => {
        if (key === 'Ctrl' && isMac) return '⌘';
        if (key === 'Alt' && isMac) return '⌥';
        if (key === 'Shift') return '⇧';
        return key;
    };

    return (
        <div className={`inline-flex items-center gap-1 ${className}`}>
            {keys.map((key, index) => (
                <React.Fragment key={index}>
                    <kbd className="px-2 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded shadow-sm">
                        {formatKey(key)}
                    </kbd>
                    {index < keys.length - 1 && (
                        <span className="text-slate-400 text-xs">+</span>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
