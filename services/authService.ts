
import { User, PlatformInvoice } from '../types';

import { API_URL } from './apiConfig';
// const API_URL = 'http://localhost:3001/api'; // Legacy
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
    // --- HELPER: Sanitize User Data for Storage (Prevent Quota Exceeded) ---
    // Removes potentially large Base64 strings from valid storage session
    sanitizeUserForStorage: (user: User): User => {
        if (!user) return user;

        // Clone deeply to avoid mutating the in-memory object
        const cleanUser = JSON.parse(JSON.stringify(user));

        // 1. Clean main logos
        if (cleanUser.avatarUrl && cleanUser.avatarUrl.length > 500 && cleanUser.avatarUrl.startsWith('data:')) {
            cleanUser.avatarUrl = ''; // Remove massive base64 avatar
        }
        if (cleanUser.storeLogo && cleanUser.storeLogo.length > 500 && cleanUser.storeLogo.startsWith('data:')) {
            cleanUser.storeLogo = ''; // Remove massive base64 store logo
        }

        // 2. Clean stores array
        if (cleanUser.stores && Array.isArray(cleanUser.stores)) {
            cleanUser.stores = cleanUser.stores.map((s: any) => {
                if (s.storeLogo && s.storeLogo.length > 500 && s.storeLogo.startsWith('data:')) {
                    return { ...s, storeLogo: '' }; // Remove logo from list to save space
                }
                return s;
            });
        }

        return cleanUser;
    },

    register: async ({ name, email, password, phone, storeName, cnpj, storeLogo, googleId }: any): Promise<User> => {
        // Build Avatar URL (Use logo or generate initial generic avatar)
        const finalAvatar = storeLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ea580c&color=fff`;

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
                role: storeName ? 'Proprietário' : 'Aguardando',
                status: storeName ? 'Ativo' : 'Pendente',
                googleId // <--- Optional Google ID link
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao cadastrar.');

        const newUser: User = data.data;
        if (data.data.token) {
            localStorage.setItem(TOKEN_KEY, data.data.token);
            delete (newUser as any).token; // Remove token from user object before cleanup/usage
        }

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

        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authService.sanitizeUserForStorage(newUser)));
        return newUser;
    },

    hireEmployee: async (storeId: string, email: string, role: 'Vendedor' | 'Gerente' | 'Técnico', phone?: string, salary?: string, commission?: string): Promise<void> => {
        const response = await fetch(`${API_URL}/users/hire`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storeId, email, role, phone, salary, commission })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao contratar.');
    },

    removeEmployee: async (storeId: string, userId: string): Promise<void> => {
        const response = await fetch(`${API_URL}/stores/${storeId}/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao remover colaborador.');
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
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authService.sanitizeUserForStorage(updatedUser)));
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

        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authService.sanitizeUserForStorage(user)));
        return user;
    },

    // --- GOOGLE AUTH: CHECK/LOGIN ---
    googleLogin: async (googleData: { email: string, name: string, photoUrl: string | null, googleId: string }): Promise<User | { status: 'new_user', googleData: any }> => {
        const response = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(googleData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao autenticar com Google.');

        // If New User, return special object to trigger registration flow
        if (data.status === 'new_user') {
            return { status: 'new_user', googleData: data.googleData };
        }

        const user = data.data;
        if (user.token) {
            localStorage.setItem(TOKEN_KEY, user.token);
            delete user.token;
        }

        // Fetch user stores
        if (user.id) {
            try {
                const storesData = await fetch(`${API_URL}/users/${user.id}/stores`, {
                    headers: { 'Authorization': `Bearer ${data.data.token}` }
                });
                if (storesData.ok) {
                    const storesJson = await storesData.json();
                    user.stores = storesJson.data.stores || [];
                    user.activeStoreId = storesJson.data.activeStoreId;
                    user.ownedStores = storesJson.data.ownedStores || [];
                }
            } catch (err) {
                user.stores = [];
            }
        }

        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authService.sanitizeUserForStorage(user)));
        // Force Type Cast as we know it's a User here
        return user as User;
    },

    // --- GOOGLE AUTH: FINALIZE REGISTER ---
    registerWithGoogle: async (googleData: any, storeData: any, role: 'owner' | 'employee'): Promise<User> => {
        const response = await fetch(`${API_URL}/auth/google-register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ googleData, registerData: storeData, role })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao finalizar cadastro.');

        // Backend returns { user, token, store }
        const { user, token, store } = data.data;

        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        }

        // Add the newly created store to user's stores and ownedStores
        user.stores = [store];
        user.ownedStores = [store];
        user.activeStoreId = store.id;

        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authService.sanitizeUserForStorage(user)));
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
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authService.sanitizeUserForStorage(newData)));
        }
    },

    refreshSession: async (userId: string): Promise<User> => {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao atualizar sessão.');

        const updatedUser = data.data;

        // Preserve store info from current session if missing in refresh
        const currentSession = authService.getSession();
        if (currentSession) {
            updatedUser.storeName = updatedUser.storeName || currentSession.storeName;
            updatedUser.storeLogo = updatedUser.storeLogo || currentSession.storeLogo;
            updatedUser.stores = updatedUser.stores || currentSession.stores;
        }

        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authService.sanitizeUserForStorage(updatedUser)));
        return updatedUser;
    },

    getStoreTeam: async (storeId: string): Promise<User[]> => {
        const response = await fetch(`${API_URL}/stores/${storeId}/team`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (!response.ok) return [];
        return data.data;
    },

    createSession: (user: User) => {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authService.sanitizeUserForStorage(user)));
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
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authService.sanitizeUserForStorage(data.data)));
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

    logout: async () => {
        // Clear local storage immediately to update UI state
        localStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);

        // Clear Supabase session
        try {
            const { supabase } = await import('./supabaseClient');
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Erro ao fazer logout do Supabase:", error);
        }
    }
};
