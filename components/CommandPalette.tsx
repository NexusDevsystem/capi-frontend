import React, { useState, useEffect, useMemo } from 'react';
import { KeyboardHint } from './KeyboardHint';

interface Command {
    id: string;
    label: string;
    icon: string;
    action: () => void;
    category: 'navigation' | 'actions' | 'search';
    keywords?: string[];
    shortcut?: string[];
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (page: string) => void;
    onNewProduct?: () => void;
    onNewSale?: () => void;
    onNewClient?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
    isOpen,
    onClose,
    onNavigate,
    onNewProduct,
    onNewSale,
    onNewClient
}) => {
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const commands: Command[] = useMemo(() => [
        // Navigation
        { id: 'nav-dashboard', label: 'Dashboard', icon: 'dashboard', action: () => onNavigate('dashboard'), category: 'navigation', shortcut: ['Ctrl', 'D'] },
        { id: 'nav-products', label: 'Produtos', icon: 'inventory_2', action: () => onNavigate('products'), category: 'navigation', shortcut: ['Ctrl', 'P'] },
        { id: 'nav-sales', label: 'Vendas', icon: 'shopping_cart', action: () => onNavigate('pos'), category: 'navigation', shortcut: ['Ctrl', 'V'] },
        { id: 'nav-clients', label: 'Clientes', icon: 'people', action: () => onNavigate('crm'), category: 'navigation', shortcut: ['Ctrl', 'C'] },
        { id: 'nav-finance', label: 'Financeiro', icon: 'payments', action: () => onNavigate('finance'), category: 'navigation', shortcut: ['Ctrl', 'F'] },
        { id: 'nav-settings', label: 'Configurações', icon: 'settings', action: () => onNavigate('settings'), category: 'navigation', shortcut: ['Ctrl', 'S'] },

        // Actions
        ...(onNewProduct ? [{ id: 'action-new-product', label: 'Novo Produto', icon: 'add_box', action: onNewProduct, category: 'actions' as const, keywords: ['criar', 'adicionar', 'produto'] }] : []),
        ...(onNewSale ? [{ id: 'action-new-sale', label: 'Nova Venda', icon: 'point_of_sale', action: onNewSale, category: 'actions' as const, keywords: ['criar', 'venda', 'vender'] }] : []),
        ...(onNewClient ? [{ id: 'action-new-client', label: 'Novo Cliente', icon: 'person_add', action: onNewClient, category: 'actions' as const, keywords: ['criar', 'adicionar', 'cliente'] }] : []),
    ], [onNavigate, onNewProduct, onNewSale, onNewClient]);

    const filteredCommands = useMemo(() => {
        if (!search.trim()) return commands;

        const searchLower = search.toLowerCase();
        return commands.filter(cmd =>
            cmd.label.toLowerCase().includes(searchLower) ||
            cmd.keywords?.some(k => k.includes(searchLower))
        );
    }, [search, commands]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    useEffect(() => {
        if (!isOpen) {
            setSearch('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                    onClose();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands, selectedIndex, onClose]);

    if (!isOpen) return null;

    const categoryLabels = {
        navigation: '🧭 Navegação',
        actions: '⚡ Ações Rápidas',
        search: '🔍 Buscar'
    };

    const groupedCommands = filteredCommands.reduce((acc, cmd) => {
        if (!acc[cmd.category]) acc[cmd.category] = [];
        acc[cmd.category].push(cmd);
        return acc;
    }, {} as Record<string, Command[]>);

    return (
        <div
            className="fixed inset-0 z-[200] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-20 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-zoom-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar comandos, navegar, criar..."
                            className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400 text-lg"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                        <KeyboardHint keys={['Esc']} />
                    </div>
                </div>

                {/* Commands List */}
                <div className="max-h-96 overflow-y-auto">
                    {filteredCommands.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                            <p>Nenhum comando encontrado</p>
                        </div>
                    ) : (
                        Object.entries(groupedCommands).map(([category, cmds]) => (
                            <div key={category} className="py-2">
                                <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {categoryLabels[category as keyof typeof categoryLabels]}
                                </div>
                                {(cmds as Command[]).map((cmd, idx) => {
                                    const globalIndex = filteredCommands.indexOf(cmd);
                                    const isSelected = globalIndex === selectedIndex;

                                    return (
                                        <button
                                            key={cmd.id}
                                            className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${isSelected
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                            onClick={() => {
                                                cmd.action();
                                                onClose();
                                            }}
                                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`material-symbols-outlined ${isSelected ? 'text-primary' : 'text-slate-400'}`}>
                                                    {cmd.icon}
                                                </span>
                                                <span className="font-medium">{cmd.label}</span>
                                            </div>
                                            {cmd.shortcut && (
                                                <KeyboardHint keys={cmd.shortcut} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <KeyboardHint keys={['↑', '↓']} /> Navegar
                            </span>
                            <span className="flex items-center gap-1">
                                <KeyboardHint keys={['Enter']} /> Selecionar
                            </span>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                            Command Palette
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
