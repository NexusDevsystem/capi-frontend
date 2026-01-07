import React from 'react';

interface EntrySelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectManual: () => void;
    onSelectAI: () => void;
}

export const EntrySelectionModal: React.FC<EntrySelectionModalProps> = ({ isOpen, onClose, onSelectManual, onSelectAI }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Simple Dark Overlay */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Card */}
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-8 overflow-hidden animate-fade-in-up">

                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
                        Novo Lançamento
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Escolha o método de registro
                    </p>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Automatic/Voice Option */}
                    <button
                        onClick={() => {
                            onSelectAI();
                            onClose();
                        }}
                        className="group relative p-6 bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-100 dark:border-orange-900/20 rounded-2xl hover:border-orange-500 dark:hover:border-orange-500 transition-all duration-200"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl">mic</span>
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1">
                                    Automático
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    Voz ou Texto
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Manual Option */}
                    <button
                        disabled
                        className="group relative p-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl opacity-60 cursor-not-allowed"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl">edit_note</span>
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-slate-600 dark:text-slate-400 text-lg mb-1">
                                    Manual
                                </h3>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                    Em breve
                                </p>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm font-semibold transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};
