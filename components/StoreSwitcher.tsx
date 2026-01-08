import React, { useState, useEffect } from 'react';
import { UserStore } from '../types';
import { useStore } from '../contexts/StoreContext';
import { storeStatusService } from '../services/storeStatusService';
import { authService } from '../services/authService';

interface StoreSwitcherProps {
    onCreateStore?: () => void;
}

export const StoreSwitcher: React.FC<StoreSwitcherProps> = ({ onCreateStore }) => {
    const { activeStore: contextActiveStore, userStores, switchStore, isLoading, refreshStores } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);
    // Local state to track active store with updated status
    const [localActiveStore, setLocalActiveStore] = useState<UserStore | null>(null);

    // Sync local state with context
    useEffect(() => {
        if (contextActiveStore) {
            setLocalActiveStore(contextActiveStore);
        }
    }, [contextActiveStore]);

    // Use local state if available, otherwise use context
    const activeStore = localActiveStore || contextActiveStore;

    // Create display stores list merging optimistic updates
    const displayStores = userStores.map(store =>
        (activeStore && store.storeId === activeStore.storeId) ? { ...store, ...activeStore } : store
    );

    const handleToggleStoreStatus = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent dropdown from opening
        if (!activeStore || isTogglingStatus) return;

        // Check if user has permission (owner or manager)
        if (activeStore.role !== 'owner' && activeStore.role !== 'manager') {
            alert('Apenas proprietários e gerentes podem abrir/fechar a loja');
            return;
        }

        setIsTogglingStatus(true);
        try {
            const user = authService.getSession();
            const userId = user?.id || '';

            if (!userId) {
                alert('Erro de sessão. Faça login novamente.');
                setIsTogglingStatus(false);
                return;
            }
            let response;

            if (activeStore.isOpen) {
                response = await storeStatusService.closeStore(activeStore.storeId, userId);
            } else {
                response = await storeStatusService.openStore(activeStore.storeId, userId);
            }

            if (response.status === 'success') {
                // Update local state ONLY if backend succeeds
                const updatedStore = { ...activeStore, isOpen: !activeStore.isOpen };
                setLocalActiveStore(updatedStore);
            } else {
                console.error('Failed to update store status:', response);
                alert(response.message || 'Erro ao atualizar status da loja');
            }
        } catch (error) {
            console.error('Error toggling store status:', error);
            alert('Erro ao atualizar status da loja');
        } finally {
            setIsTogglingStatus(false);
        }
    };

    if (!activeStore || userStores.length === 0) {
        return null;
    }

    return (
        <div className="relative">
            {/* Active Store Display */}
            <div className="w-full p-3 rounded-2xl bg-slate-100 dark:bg-slate-800">
                {/* Top Row: Logo + Info + Status + Dropdown */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center gap-3 hover:opacity-80 transition-opacity"
                    disabled={isLoading}
                >
                    {/* Store Logo */}
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {activeStore.storeLogo ? (
                            <img src={activeStore.storeLogo} alt={activeStore.storeName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="material-symbols-outlined text-primary text-xl">store</span>
                        )}
                    </div>

                    {/* Store Info */}
                    <div className="flex-1 text-left min-w-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {activeStore.storeName}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                            {activeStore.role === 'owner' ? 'Proprietário' :
                                activeStore.role === 'manager' ? 'Gerente' :
                                    activeStore.role === 'seller' ? 'Vendedor' :
                                        activeStore.role === 'technician' ? 'Técnico' : activeStore.role}
                        </div>
                    </div>

                    {/* Status Circle */}
                    <div className={`w-3 h-3 rounded-full shrink-0 ${activeStore.isOpen
                        ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]'
                        : 'bg-slate-400'
                        }`} />

                    {/* Dropdown Icon */}
                    <span className={`material-symbols-outlined text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                        expand_more
                    </span>
                </button>

                {/* Bottom Row: Open/Close Button */}
                {(activeStore.role === 'owner' || activeStore.role === 'manager') && (
                    <button
                        onClick={handleToggleStoreStatus}
                        disabled={isTogglingStatus}
                        className={`w-full mt-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeStore.isOpen
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isTogglingStatus ? '...' : (activeStore.isOpen ? 'Fechar Loja' : 'Abrir Loja')}
                    </button>
                )}
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                        <div className="p-2 max-h-80 overflow-y-auto">
                            {/* Store List */}
                            {displayStores.map((store) => (
                                <button
                                    key={store.storeId}
                                    onClick={() => {
                                        if (store.storeId !== activeStore.storeId) {
                                            switchStore(store.storeId);
                                        }
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${store.storeId === activeStore.storeId
                                        ? 'bg-primary/10 text-primary'
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                    disabled={isLoading}
                                >
                                    {/* Store Logo */}
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                                        {store.storeLogo ? (
                                            <img src={store.storeLogo} alt={store.storeName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-slate-400 text-xl">store</span>
                                        )}
                                    </div>

                                    {/* Store Info */}
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="text-sm font-bold truncate">
                                            {store.storeName}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                                {store.role === 'owner' ? 'Proprietário' :
                                                    store.role === 'manager' ? 'Gerente' :
                                                        store.role === 'seller' ? 'Vendedor' :
                                                            store.role === 'technician' ? 'Técnico' : store.role}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Circle */}
                                    <div className={`w-3 h-3 rounded-full shrink-0 ${store.isOpen
                                        ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]'
                                        : 'bg-slate-300 dark:bg-slate-600'
                                        }`} />
                                </button>
                            ))}
                        </div>

                        {/* Create New Store Button */}
                        {onCreateStore && (
                            <>
                                <div className="border-t border-slate-200 dark:border-slate-700" />
                                <div className="p-2">
                                    <button
                                        onClick={() => {
                                            onCreateStore();
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-primary font-bold transition-colors"
                                    >
                                        <span className="material-symbols-outlined">add_circle</span>
                                        <span>Criar Nova Loja</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
