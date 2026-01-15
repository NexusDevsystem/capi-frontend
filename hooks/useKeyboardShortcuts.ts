import { useEffect } from 'react';

export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    description: string;
    category?: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[], enabled: boolean = true) => {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input/textarea
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                // Allow some shortcuts even in inputs (like Ctrl+K for command palette)
                const allowedInInputs = shortcuts.filter(s => s.ctrl && s.key.toLowerCase() === 'k');
                if (!allowedInInputs.some(s => matchesShortcut(e, s))) {
                    return;
                }
            }

            shortcuts.forEach(shortcut => {
                if (matchesShortcut(e, shortcut)) {
                    e.preventDefault();
                    e.stopPropagation();
                    shortcut.action();
                }
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, enabled]);
};

const matchesShortcut = (e: KeyboardEvent, shortcut: KeyboardShortcut): boolean => {
    const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
    const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
    const altMatch = shortcut.alt ? e.altKey : !e.altKey;
    const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

    return ctrlMatch && shiftMatch && altMatch && keyMatch;
};

export const formatShortcut = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    parts.push(shortcut.key.toUpperCase());

    return parts.join(' + ');
};
