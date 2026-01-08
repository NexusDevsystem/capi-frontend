// Force localhost for debugging
const API_URL = 'http://localhost:3001/api';
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface StoreStatusResponse {
    status: 'success' | 'error';
    message?: string;
    data?: {
        storeId: string;
        name: string;
        isOpen: boolean;
        lastOpenedAt?: string;
        lastClosedAt?: string;
        openedBy?: { _id: string; name: string };
        closedBy?: { _id: string; name: string };
    };
}

export interface AllStoresStatusResponse {
    status: 'success' | 'error';
    data?: Array<{
        _id: string;
        name: string;
        isOpen: boolean;
        lastOpenedAt?: string;
        lastClosedAt?: string;
        userRole: string;
    }>;
}

class StoreStatusService {
    private getHeaders() {
        const token = localStorage.getItem('capi_auth_token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    /**
     * Open a store (Manager/Owner only)
     */
    async openStore(storeId: string, userId: string): Promise<StoreStatusResponse> {
        try {
            const response = await fetch(`${API_URL}/stores/${storeId}/open`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ userId })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error opening store:', error);
            return {
                status: 'error',
                message: 'Erro ao abrir loja'
            };
        }
    }

    /**
     * Close a store (Manager/Owner only)
     */
    async closeStore(storeId: string, userId: string): Promise<StoreStatusResponse> {
        try {
            const response = await fetch(`${API_URL}/stores/${storeId}/close`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ userId })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error closing store:', error);
            return {
                status: 'error',
                message: 'Erro ao fechar loja'
            };
        }
    }

    /**
     * Get current status of a store
     */
    async getStoreStatus(storeId: string): Promise<StoreStatusResponse> {
        try {
            const response = await fetch(`${API_URL}/stores/${storeId}/status`, {
                headers: this.getHeaders()
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting store status:', error);
            return {
                status: 'error',
                message: 'Erro ao buscar status da loja'
            };
        }
    }

    /**
     * Get status of all user's stores
     */
    async getAllStoresStatus(userId: string): Promise<AllStoresStatusResponse> {
        try {
            const response = await fetch(`${API_URL}/stores/status/all?userId=${userId}`, {
                headers: this.getHeaders()
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting all stores status:', error);
            return {
                status: 'error',
                data: []
            };
        }
    }
}

export const storeStatusService = new StoreStatusService();
