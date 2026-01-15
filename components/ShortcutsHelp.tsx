import React, { useEffect } from 'react';

interface ShortcutItem {
    keys: string[];
    description: string;
}

interface ShortcutSection {
    title: string;
    items: ShortcutItem[];
}

interface ShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
}

const SHORTCUTS: ShortcutSection[] = [
    {
        title: "Globais",
        items: [
            { keys: ["Ctrl", "K"], description: "Abrir Command Palette" },
            { keys: ["Ctrl", "/"], description: "Ver Atalhos (Ajuda)" },
            { keys: ["Ctrl", "D"], description: "Ir para Dashboard" },
            { keys: ["Ctrl", "P"], description: "Ir para Produtos" },
            { keys: ["Ctrl", "V"], description: "Ir para Vendas (PDV)" },
            { keys: ["Ctrl", "C"], description: "Ir para Clientes" },
            { keys: ["Ctrl", "F"], description: "Ir para Financeiro" },
            { keys: ["Ctrl", "S"], description: "Ir para Configurações" },
            { keys: ["Ctrl", "B"], description: "Alternar Barra Lateral" },
            { keys: ["Ctrl", "T"], description: "Alternar Tema (Dark/Light)" },
            { keys: ["Ctrl", "L"], description: "Sair do Sistema" },
        ]
    },
    {
        title: "Vendas (PDV)",
        items: [
            { keys: ["F1"], description: "Buscar Produto" },
            { keys: ["F2"], description: "Adicionar Desconto" },
            { keys: ["F3"], description: "Finalizar Venda" },
            { keys: ["Esc"], description: "Cancelar Venda" },
        ]
    },
    {
        title: "Geral",
        items: [
            { keys: ["Esc"], description: "Fechar Modais" },
            { keys: ["Enter"], description: "Confirmar Ações" },
        ]
    }
];

export const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({ isOpen, onClose }) => {
    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="bg-white dark:bg-card-dark w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[85vh] animate-zoom-in border border-slate-200 dark:border-slate-700">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-md sticky top-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <span className="material-symbols-outlined text-2xl">keyboard</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Atalhos de Teclado</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Agilize seu fluxo de trabalho</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {SHORTCUTS.map((section) => (
                        <div key={section.title}>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                                {section.title}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                                {section.items.map((shortcut, idx) => (
                                    <div key={idx} className="flex items-center justify-between group">
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                            {shortcut.description}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            {shortcut.keys.map((key, keyIdx) => (
                                                <kbd
                                                    key={keyIdx}
                                                    className="px-2 py-1 min-w-[24px] text-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold text-slate-600 dark:text-slate-400 font-mono shadow-[0_2px_0_theme(colors.slate.200)] dark:shadow-[0_2px_0_theme(colors.slate.900)] translate-y-[0px] active:translate-y-[2px] active:shadow-none transition-all"
                                                >
                                                    {key}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-400">
                        Dica: Você pode personalizar esses atalhos nas Configurações futuramente.
                    </p>
                </div>
            </div>
        </div>
    );
};
