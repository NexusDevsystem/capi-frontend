import { API_URL } from './apiConfig';
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getHeaders = () => ({
    'Content-Type': 'application/json',
});

export const dataService = {
    // Generic Fetcher
    fetch: async (storeId: string, resource: string) => {
        const response = await fetch(`${API_URL}/stores/${storeId}/${resource}`, { headers: getHeaders() });
        const data = await response.json();
        return data.data || [];
    },

    // Generic Creator
    create: async (storeId: string, resource: string, item: any) => {
        const response = await fetch(`${API_URL}/stores/${storeId}/${resource}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(item)
        });
        const data = await response.json();
        return data.data;
    },

    // Generic Updater
    update: async (resource: string, id: string, updates: any) => {
        const response = await fetch(`${API_URL}/${resource}/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error(`Update failed: ${response.statusText}`);
        const data = await response.json();
        return data.data;
    },

    // Generic Deleter
    delete: async (resource: string, id: string) => {
        const response = await fetch(`${API_URL}/${resource}/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`Delete failed: ${response.statusText}`);
    }
};
