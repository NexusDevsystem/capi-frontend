
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface AiTransactionPrediction {
    action: 'TRANSACTION' | 'STOCK' | 'OS' | 'NAVIGATE';
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    paymentMethod: 'Pix' | 'Dinheiro' | 'Crédito' | 'Débito' | 'Outro';
    customerName?: string;
    debtAmount?: number;
    isDebtPayment?: boolean;
    productName?: string;
    costPrice?: number;
    salePrice?: number;
    stockQuantity?: number;
    device?: string;
    targetPage?: string;
    items?: Array<{ name: string; quantity: number; unitPrice: number; total: number }>;
}

export interface AiCommandResponse {
    action: 'TRANSACTION' | 'STOCK' | 'OS' | 'NAVIGATE';
    payload: any;
}

export interface AiCommandResult {
    action: string;
    targetPage?: string;
    data?: any;
}

// Helper para chamadas de API
const fetchAi = async (endpoint: string, body: any) => {
    try {
        const response = await fetch(`${API_URL}/ai/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error(`Erro na API de IA: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error(`Erro ao chamar endpoint ${endpoint}:`, error);
        throw error;
    }
};

export const extractTransactionsFromDocument = async (base64: string, mimeType: string, context: string) => {
    return await fetchAi('extract-doc', { base64, mimeType, context });
};

export const extractTransactionsFromText = async (text: string, context: string) => {
    return await fetchAi('predict-transaction', { input: text, context });
};

export const generateFinancialInsight = async (transactions: any[]): Promise<any> => {
    return await fetchAi('insight', { transactions });
};

export const extractProductsFromInvoice = async (base64: string, mimeType: string) => {
    return await fetchAi('extract-product', { base64, mimeType });
};

export const predictTransactionDetails = async (input: string, context: string): Promise<AiTransactionPrediction[]> => {
    return await fetchAi('predict-transaction', { input, context });
};

export const processTextCommand = async (text: string): Promise<AiCommandResult> => {
    return await fetchAi('command', { text });
};

export const processNaturalLanguageCommand = async (text: string): Promise<AiCommandResponse[]> => {
    const predictions = await predictTransactionDetails(text, 'chat');

    if (Array.isArray(predictions)) {
        return predictions.map(p => ({
            action: p.action,
            payload: p
        }));
    }
    return [];
};
