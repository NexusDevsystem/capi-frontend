
import { User } from '../types';

// Chave fornecida
const API_KEY = "abc_dev_NARbx1crmcnReLfW31zws3RS";
const BASE_URL = "https://api.abacatepay.com/v1";

// --- SOLUÇÃO CORS ---
// Usamos o corsproxy.io. Se falhar, pode ser necessário tentar outro ou uma extensão.
// Codificamos a URL para garantir que parametros nao quebrem o proxy.
const PROXY_URL = "https://corsproxy.io/?";

const getHeaders = () => ({
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
});

const getUrl = (endpoint: string) => {
    const targetUrl = `${BASE_URL}${endpoint}`;
    return `${PROXY_URL}${encodeURIComponent(targetUrl)}`;
};

// Helper para limpar strings (apenas números)
const cleanString = (str: string | undefined) => str ? str.replace(/\D/g, '') : '';

export const abacatePayService = {
    /**
     * Cria uma sessão de checkout diretamente via API (via Proxy)
     */
    createCheckout: async (user: User): Promise<string> => {
        try {
            console.log("Iniciando checkout AbacatePay...");

            // 1. Sanitização de Dados (CRÍTICO PARA A API ACEITAR)
            const cleanCpf = cleanString(user.taxId || "00000000000");
            const cleanPhone = cleanString(user.phone || "11999999999");
            
            // Validar CPF básico
            if (cleanCpf.length < 11) {
                throw new Error(`CPF inválido ou incompleto: ${cleanCpf}`);
            }

            // 2. Tentar encontrar cliente existente
            let customerId = null;
            
            try {
                // Adicionamos timestamp para evitar cache na listagem também
                const listResponse = await fetch(getUrl(`/customer/list?ts=${Date.now()}`), {
                    method: 'GET',
                    headers: getHeaders()
                });
                
                if (listResponse.ok) {
                    const listData = await listResponse.json();
                    // Procura por email na raiz ou metadados
                    const found = listData.data?.find((c: any) => 
                        c.email === user.email || c.metadata?.email === user.email
                    );
                    if (found) customerId = found.id;
                }
            } catch (ignore) {
                console.warn("Falha na listagem (CORS ou Permissão), prosseguindo para criação.");
            }

            // 3. Se não encontrou, Cria Cliente
            if (!customerId) {
                console.log("Criando novo cliente para:", user.email);
                
                const customerPayload = {
                    name: user.name,
                    email: user.email,
                    cellphone: cleanPhone,
                    taxId: cleanCpf 
                };

                const createResponse = await fetch(getUrl('/customer/create'), {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(customerPayload)
                });
                
                const createData = await createResponse.json();
                
                if (!createResponse.ok) {
                    console.error("Erro API Criação Cliente:", JSON.stringify(createData, null, 2));
                    throw new Error(createData.error?.message || JSON.stringify(createData) || "Erro ao cadastrar cliente.");
                }
                customerId = createData.data.id;
            }

            console.log("Cliente ID definido:", customerId);

            // 4. Criar Cobrança (Billing)
            const billingPayload = {
                frequency: "ONE_TIME",
                methods: ["PIX"], 
                products: [{
                    externalId: "capi-pro-monthly",
                    name: "Assinatura CAPI Pro",
                    description: "Acesso ilimitado ao sistema.",
                    quantity: 1,
                    price: 4990 // R$ 49,90 (Centavos)
                }],
                returnUrl: window.location.href,
                completionUrl: window.location.href,
                customerId: customerId
            };

            const billingResponse = await fetch(getUrl('/billing/create'), {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(billingPayload)
            });

            const billingData = await billingResponse.json();

            if (!billingResponse.ok) {
                console.error("Erro API Criação Cobrança:", JSON.stringify(billingData, null, 2));
                throw new Error(billingData.error?.message || "Erro ao gerar link. Verifique o console.");
            }

            return billingData.data.url;

        } catch (error: any) {
            console.error("AbacatePay Service Fatal Error:", error);
            
            if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
                throw new Error("Erro de Conexão (CORS). Tente usar uma extensão CORS Unblock ou desativar bloqueadores.");
            }
            throw error;
        }
    },

    /**
     * Verifica status da assinatura
     */
    checkPaymentStatus: async (userEmail: string): Promise<'ACTIVE' | 'PENDING'> => {
        try {
            // FIX: Timestamp para forçar refresh e evitar cache do proxy
            const response = await fetch(getUrl(`/billing/list?_ts=${Date.now()}`), {
                method: 'GET',
                headers: getHeaders()
            });
            
            if (!response.ok) return 'PENDING';

            const data = await response.json();
            
            if (data.data && Array.isArray(data.data)) {
                // FIX: Verifica email em ambos os locais possíveis
                const myBills = data.data.filter((b: any) => {
                    const emailRoot = b.customer?.email === userEmail;
                    const emailMeta = b.customer?.metadata?.email === userEmail;
                    return emailRoot || emailMeta;
                });
                
                // Ordena do mais recente para o mais antigo
                myBills.sort((a: any, b: any) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                
                if (myBills.length > 0) {
                    const lastBill = myBills[0];
                    if (lastBill.status === 'PAID' || lastBill.status === 'COMPLETED') {
                        return 'ACTIVE';
                    }
                }
            }
            return 'PENDING';
        } catch (error) {
            console.error("Status Check Error:", error);
            return 'PENDING';
        }
    }
};
