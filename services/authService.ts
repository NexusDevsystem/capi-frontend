
import { User, PlatformInvoice } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const SESSION_STORAGE_KEY = 'storefinance_session';

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
                // Update user with storeId and storeName in session
                await fetch(`${API_URL}/users/${newUser.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ storeId: storeData.data._id })
                });
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
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subscriptionStatus: 'ACTIVE',
                trialEndsAt: null,
                nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao ativar assinatura.');

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

        // Fetch store details to include storeName and storeLogo in session
        if (user.storeId) {
            try {
                const storeRes = await fetch(`${API_URL}/stores/${user.storeId}`);
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
            headers: { 'Content-Type': 'application/json' },
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
        const response = await fetch(`${API_URL}/stores/${storeId}/team`);
        const data = await response.json();
        if (!response.ok) return [];
        return data.data;
    },

    createSession: (user: User) => {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    },

    logout: () => {
        localStorage.removeItem(SESSION_STORAGE_KEY);
    }
};
