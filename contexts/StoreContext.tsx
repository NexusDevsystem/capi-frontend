import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserStore } from '../types';
import { authService } from '../services/authService';

interface StoreContextType {
    activeStore: UserStore | null;
    userStores: UserStore[];
    switchStore: (storeId: string) => Promise<void>;
    refreshStores: () => Promise<void>;
    isLoading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore must be used within StoreProvider');
    }
    return context;
};

interface StoreProviderProps {
    children: React.ReactNode;
    user: User;
    onUserUpdate: (user: User) => void;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children, user, onUserUpdate }) => {
    const [userStores, setUserStores] = useState<UserStore[]>([]);
    const [activeStore, setActiveStore] = useState<UserStore | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize active store
    useEffect(() => {
        // Multi-store: Use stores array
        if (user.stores && user.stores.length > 0) {
            const active = user.stores.find(s => s.storeId === user.activeStoreId) || user.stores[0];
            setActiveStore(active);
            setUserStores(user.stores);
        }
        // Legacy: Create temporary store from old fields
        else if (user.storeId) {
            const legacyStore: UserStore = {
                storeId: user.storeId,
                storeName: user.storeName || 'Minha Loja',
                storeLogo: user.storeLogo,
                role: user.role === 'Administrador' ? 'owner' :
                    user.role === 'Gerente' ? 'manager' :
                        user.role === 'Vendedor' ? 'seller' :
                            user.role === 'Técnico' ? 'technician' : 'seller',
                joinedAt: user.memberSince || new Date().toISOString(),
                permissions: []
            };
            setActiveStore(legacyStore);
            setUserStores([legacyStore]);
        }
    }, [user]);

    // Auto-refresh stores from backend to get latest status (isOpen, etc)
    useEffect(() => {
        if (user.id && (user.stores?.length > 0 || user.storeId)) {
            refreshStores();
        }
    }, [user.id]); // Only run when user.id changes (on login)

    const refreshStores = async () => {
        try {
            setIsLoading(true);
            console.log('[StoreContext] Refreshing stores for user:', user.id);
            const data = await authService.getUserStores(user.id);
            console.log('[StoreContext] Received stores data:', data);
            setUserStores(data.stores);

            // Update active store
            const active = data.stores.find(s => s.storeId === data.activeStoreId) || data.stores[0];
            console.log('[StoreContext] Setting active store:', active);
            setActiveStore(active);

            // Update user in parent
            onUserUpdate({
                ...user,
                stores: data.stores,
                activeStoreId: data.activeStoreId,
                ownedStores: data.ownedStores
            });
        } catch (error) {
            console.error('[StoreContext] Error refreshing stores:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const switchStore = async (storeId: string) => {
        try {
            setIsLoading(true);
            await authService.switchActiveStore(user.id, storeId);

            const newActiveStore = userStores.find(s => s.storeId === storeId);
            if (newActiveStore) {
                setActiveStore(newActiveStore);

                // Update user
                const updatedUser = {
                    ...user,
                    activeStoreId: storeId
                };
                onUserUpdate(updatedUser);

                // Reload page to refresh all data for new store
                window.location.reload();
            }
        } catch (error) {
            console.error('Error switching store:', error);
            alert('Erro ao alternar loja. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <StoreContext.Provider value={{
            activeStore,
            userStores,
            switchStore,
            refreshStores,
            isLoading
        }}>
            {children}
        </StoreContext.Provider>
    );
};
