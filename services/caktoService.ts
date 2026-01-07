
const CAKTO_CHECKOUT_URL = import.meta.env.VITE_CAKTO_CHECKOUT_URL;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const caktoService = {
    /**
     * Retorna URL de checkout CAKTO pré-configurada
     * Não precisa criar checkout via API, usa URL fixa da oferta
     */
    getCheckoutUrl: (): string => {
        if (!CAKTO_CHECKOUT_URL || CAKTO_CHECKOUT_URL === 'PENDING') {
            throw new Error('URL de checkout CAKTO não configurada. Configure VITE_CAKTO_CHECKOUT_URL no .env');
        }
        return CAKTO_CHECKOUT_URL;
    },

    /**
     * Verifica status do pagamento via backend
     * O backend consulta o status da assinatura do usuário
     */
    checkPaymentStatus: async (userEmail: string): Promise<'ACTIVE' | 'PENDING'> => {
        try {
            const response = await fetch(`${API_URL}/check-payment-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });

            if (!response.ok) {
                console.error('Erro ao verificar status:', response.status);
                return 'PENDING';
            }

            const data = await response.json();
            return data.status === 'PAID' ? 'ACTIVE' : 'PENDING';
        } catch (error) {
            console.error('Status check error:', error);
            return 'PENDING';
        }
    }
};
