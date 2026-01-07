
export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    taxId?: string;
    role: 'Administrador' | 'Gerente' | 'Vendedor' | 'Técnico' | 'Aguardando';
    storeId?: string;
    storeName?: string;
    storeLogo?: string;
    lastAccess: string;
    status: 'Ativo' | 'Ausente' | 'Pendente';
    avatarUrl: string;
    subscriptionStatus?: 'ACTIVE' | 'PENDING' | 'CANCELED' | 'FREE' | 'TRIAL';
    trialEndsAt?: string;
    nextBillingAt?: string;
    memberSince: string;
    invoices?: PlatformInvoice[];
}

export interface PlatformInvoice {
    id: string;
    date: string;
    amount: number;
    status: 'PAID' | 'PENDING' | 'EXPIRED';
    url?: string;
    method?: string;
}

export enum TransactionType {
    INCOME = 'INCOME',
    EXPENSE = 'EXPENSE'
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    PAID = 'PAID',
    OVERDUE = 'OVERDUE',
    SCHEDULED = 'SCHEDULED'
}

export type PaymentMethod = 'Pix' | 'Dinheiro' | 'Crédito' | 'Débito' | 'Boleto' | 'Outro';

export interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    paymentMethod?: PaymentMethod;
    date: string;
    status: TransactionStatus;
    entity: string;
    items?: Array<{
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
    bankAccountId?: string;
}

export interface BankAccount {
    id: string;
    name: string;
    type: string;
    balance: number;
}

export interface CashClosing {
    id: string;
    date: string;
    totalRevenue: number;
    totalExpense: number;
    balance: number;
    breakdown: {
        pix: number;
        cash: number;
        card: number;
        other: number;
    };
    notes?: string;
    closedBy: string;
    closedAt: string;
}

export interface StoreSettings {
    storeName: string;
    theme: 'light' | 'dark';
    modules: {
        pos: boolean;
        crm: boolean;
        customerAccounts: boolean;
        services: boolean;
        inventory: boolean;
        suppliers: boolean;
        team: boolean;
        finance: boolean;
        reports: boolean;
    };
}

export interface FinancialSummary {
    revenue: number;
    expenses: number;
    profit: number;
}

export interface AiInsightResponse {
    title: string;
    executiveSummary: string;
    trendAnalysis: string;
    expenseAnalysis: string;
    recommendation: string;
}

export interface Product {
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
    costPrice: number;
    salePrice: number;
    stock: number;
    minStock: number;
    expiryDate?: string;
    taxData?: {
        taxOrigin: '0' | '1' | '2';
        ncm?: string;
        cest?: string;
        cfop?: string;
    };
}

export interface CustomerAccountItem {
    id: string;
    date: string;
    description: string;
    amount: number;
}

export interface CustomerAccount {
    id: string;
    name: string;
    phone?: string;
    balance: number;
    items: CustomerAccountItem[];
    lastUpdate: string;
    pipelineStage?: 'LEAD' | 'NEGOCIACAO' | 'FECHADO' | 'PERDIDO';
}

export interface Supplier {
    id: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    category?: string;
    notes?: string;
}

export interface ServiceOrder {
    id: string;
    customerId: string;
    customerName: string;
    device?: string;
    description: string;
    status: 'ABERTO' | 'EM_ANALISE' | 'AGUARDANDO_PECA' | 'CONCLUIDO' | 'ENTREGUE';
    partsTotal: number;
    laborTotal: number;
    total: number;
    openDate: string;
}
