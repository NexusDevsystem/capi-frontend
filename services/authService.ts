
import { User, PlatformInvoice } from '../types';

// Force localhost for debugging
const API_URL = 'http://localhost:3001/api';
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const SESSION_STORAGE_KEY = 'storefinance_session';
const TOKEN_KEY = 'capi_auth_token';

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const authService = {
    register: async (name: string, email: string, phone: string, password: string, cnpj?: string, avatarUrl?: string, storeName?: string, storeLogo?: string): Promise<User> => {
        const finalAvatar = avatarUrl || storeLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ea580c&color=fff`;

        // 1. Create User
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                email,
                phone,
                password,
                taxId: cnpj,
                avatarUrl: finalAvatar,
                role: storeName ? 'Administrador' : 'Aguardando',
                status: storeName ? 'Ativo' : 'Pendente'
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao cadastrar.');

        const newUser: User = data.data;

        // 2. If storeName is provided, create Store
        if (storeName) {
            const storeResponse = await fetch(`${API_URL}/stores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: storeName,
                    ownerId: newUser.id,
                    phone: phone,
                    address: '',
                    logoUrl: storeLogo
                })
            });

            if (storeResponse.ok) {
                const storeData = await storeResponse.json();

                // Fetch updated user with stores array
                try {
                    const storesData = await fetch(`${API_URL}/users/${newUser.id}/stores`);
                    if (storesData.ok) {
                        const storesJson = await storesData.json();
                        newUser.stores = storesJson.data.stores || [];
                        newUser.activeStoreId = storesJson.data.activeStoreId;
                        newUser.ownedStores = storesJson.data.ownedStores || [];
                    }
                } catch (err) {
                    console.error("Erro ao buscar lojas após criação:", err);
                }

                // Legacy fields for backward compatibility
                newUser.storeId = storeData.data._id;
                newUser.storeName = storeName;
                newUser.storeLogo = storeLogo;
            }
        }

        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUser));
        return newUser;
    },

    hireEmployee: async (storeId: string, email: string, role: 'Vendedor' | 'Gerente' | 'Técnico'): Promise<void> => {
        const response = await fetch(`${API_URL}/users/hire`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storeId, email, role })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao contratar.');
    },

    activateSubscription: async (userId: string): Promise<User> => {
        const response = await fetch(`${API_URL}/users/${userId}/activate-subscription`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        const data = await response.json();
        if (!response.ok) {
            // Provide user-friendly error messages
            if (response.status === 402) {
                throw new Error('Pagamento não encontrado. Complete o pagamento via Pix primeiro.');
            }
            throw new Error(data.message || 'Erro ao ativar assinatura.');
        }

        const updatedUser = data.data;
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedUser));
        return updatedUser;
    },

    login: async (email: string, password: string): Promise<User> => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Email ou senha incorretos.');

        let user = data.data;
        if (user.token) {
            localStorage.setItem(TOKEN_KEY, user.token);
            delete user.token; // Don't store token in user object
        }

        // Fetch user stores (multi-store support)
        if (user.id) {
            try {
                // Need to use auth headers for this call too significantly
                const storesData = await fetch(`${API_URL}/users/${user.id}/stores`, {
                    headers: { 'Authorization': `Bearer ${data.data.token}` } // Use token from login response directly
                });
                if (storesData.ok) {
                    const storesJson = await storesData.json();
                    user.stores = storesJson.data.stores || [];
                    user.activeStoreId = storesJson.data.activeStoreId;
                    user.ownedStores = storesJson.data.ownedStores || [];
                }
            } catch (err) {
                console.error("Erro ao buscar lojas do usuário:", err);
                // Fallback to legacy single store if multi-store fails
                user.stores = [];
            }
        }

        // Legacy: Fetch store details for backward compatibility
        if (user.storeId && (!user.stores || user.stores.length === 0)) {
            try {
                const storeRes = await fetch(`${API_URL}/stores/${user.storeId}`); // Public endpoint? Or needs auth? Better to leave public for now or update
                if (storeRes.ok) {
                    const storeData = await storeRes.json();
                    user.storeName = storeData.data.name;
                    user.storeLogo = storeData.data.logoUrl;
                }
            } catch (err) {
                console.error("Erro ao buscar detalhes da loja no login:", err);
            }
        }

        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
        return user;
    },

    getSession: (): User | null => {
        const session = localStorage.getItem(SESSION_STORAGE_KEY);
        return session ? JSON.parse(session) : null;
    },

    updateProfile: async (updatedUser: User) => {
        const response = await fetch(`${API_URL}/users/${updatedUser.id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updatedUser)
        });

        if (response.ok) {
            const data = await response.json();
            // Preserve store info in session if update doesn't include it
            const currentSession = authService.getSession();
            const newData = {
                ...data.data,
                storeName: currentSession?.storeName,
                storeLogo: currentSession?.storeLogo
            };
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newData));
        }
    },

    getStoreTeam: async (storeId: string): Promise<User[]> => {
        const response = await fetch(`${API_URL}/stores/${storeId}/team`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!response.ok) return [];
        return data.data;
    },

    createSession: (user: User) => {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    },

    // --- MULTI-STORE FUNCTIONS ---

    getUserStores: async (userId: string): Promise<{ stores: any[], activeStoreId: string, ownedStores: string[] }> => {
        const response = await fetch(`${API_URL}/users/${userId}/stores`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao buscar lojas.');
        return data.data;
    },

    switchActiveStore: async (userId: string, storeId: string): Promise<void> => {
        const response = await fetch(`${API_URL}/users/${userId}/active-store`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ storeId })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao alternar loja.');

        // Update session
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.data));
    },

    createStore: async (storeData: { name: string, ownerId: string, phone?: string, address?: string, logoUrl?: string }) => {
        const response = await fetch(`${API_URL}/stores`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(storeData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao criar loja.');
        return data.data;
    },

    inviteToStore: async (storeId: string, email: string, role: string, invitedBy: string) => {
        const response = await fetch(`${API_URL}/stores/${storeId}/invite`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, role, invitedBy })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao convidar usuário.');
        return data.data;
    },

    getStoreUsers: async (storeId: string): Promise<any[]> => {
        const response = await fetch(`${API_URL}/stores/${storeId}/users`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!response.ok) return [];
        return data.data;
    },

    removeUserFromStore: async (storeId: string, userId: string): Promise<void> => {
        const response = await fetch(`${API_URL}/stores/${storeId}/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao remover usuário.');
    },

    logout: () => {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);
    }
};
