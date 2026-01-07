import React, { useState } from 'react';
import { UserStore } from '../types';
import { useStore } from '../contexts/StoreContext';

interface StoreSwitcherProps {
    onCreateStore?: () => void;
}

export const StoreSwitcher: React.FC<StoreSwitcherProps> = ({ onCreateStore }) => {
    const { activeStore, userStores, switchStore, isLoading } = useStore();
    const [isOpen, setIsOpen] = useState(false);

    if (!activeStore || userStores.length === 0) {
        return null;
    }

    return (
        <div className="relative">
            {/* Active Store Display */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group"
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
                    <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {activeStore.role === 'owner' ? 'Proprietário' :
                            activeStore.role === 'manager' ? 'Gerente' :
                                activeStore.role === 'seller' ? 'Vendedor' :
                                    activeStore.role === 'technician' ? 'Técnico' : activeStore.role}
                    </div>
                </div>

                {/* Dropdown Icon */}
                {userStores.length > 1 && (
                    <span className={`material-symbols-outlined text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                        expand_more
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && userStores.length > 1 && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-fade-in-up">
                        <div className="p-2 max-h-80 overflow-y-auto">
                            {/* Store List */}
                            {userStores.map((store) => (
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
                                        <div className="text-xs opacity-70 capitalize">
                                            {store.role === 'owner' ? 'Proprietário' :
                                                store.role === 'manager' ? 'Gerente' :
                                                    store.role === 'seller' ? 'Vendedor' :
                                                        store.role === 'technician' ? 'Técnico' : store.role}
                                        </div>
                                    </div>

                                    {/* Active Indicator */}
                                    {store.storeId === activeStore.storeId && (
                                        <span className="material-symbols-outlined icon-filled text-primary">
                                            check_circle
                                        </span>
                                    )}
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
