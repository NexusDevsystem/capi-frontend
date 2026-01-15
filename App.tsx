
import React, { useState, useEffect, useMemo } from 'react';
import { User, StoreSettings, Transaction, TransactionType, TransactionStatus, BankAccount, Product, ServiceOrder, CustomerAccount, CashClosing, PaymentMethod, CustomerAccountItem, Supplier } from './types';
import { authService } from './services/authService';
import { dataService } from './services/dataService';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ProfilePage } from './pages/ProfilePage';

import { FinancePage } from './pages/FinancePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';
import { ClosingsHistoryPage } from './pages/ClosingsHistoryPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { PaymentPage } from './pages/PaymentPage';
import { ChangelogPage } from './pages/ChangelogPage';
import { DocumentationPage } from './pages/DocumentationPage';

import { AiTransactionModal } from './components/AiTransactionModal';
import { EntrySelectionModal } from './components/EntrySelectionModal';
import { FloatingAIButton } from './components/FloatingAIButton';
import { Logo } from './components/Logo';
import { CreateStoreModal } from './components/CreateStoreModal';
import { ShortcutsHelp } from './components/ShortcutsHelp';
import { ConfirmationModal } from './components/ConfirmationModal';
import { TrialCountdown } from './components/TrialCountdown';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { CommandPalette } from './components/CommandPalette';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ToastProvider } from './contexts/ToastContext';

// Multi-store support
import { StoreProvider } from './contexts/StoreContext';
import { PrivacyProvider } from './contexts/PrivacyContext';

// Firebase Analytics
import { firebaseAnalytics } from './services/firebase';

// --- Imports das Páginas Comerciais ---
import { PosPage } from './pages/PosPage';
import { CRMPage } from './pages/CRMPage';
import { CustomerAccountsPage } from './pages/CustomerAccountsPage';
import { ServicesPage } from './pages/ServicesPage';
import { ProductsPage } from './pages/ProductsPage';

import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

const DEFAULT_SETTINGS: StoreSettings = {
    storeName: 'CAPI ERP',
    theme: 'light',
    modules: {
        pos: true,
        crm: true,
        customerAccounts: true,
        services: true,
        inventory: true,
        suppliers: true,
        team: true,
        finance: true,
        reports: true,
        closings: true
    }
};

const UnauthorizedPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="flex-1 flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50 dark:bg-slate-900">
        <span className="material-symbols-outlined text-red-500 text-6xl mb-4">lock</span>
        <h2 className="text-2xl font-bold mb-2 dark:text-white">Acesso Restrito</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Você não tem permissão para acessar esta área.</p>
        <button onClick={onBack} className="bg-primary text-white px-6 py-2 rounded-lg font-bold">Voltar</button>
    </div>
);

// --- TELA DE ESPERA PARA FUNCIONÁRIOS (DESIGN CAPI) ---
const WaitingApprovalPage: React.FC<{ user: User, onLogout: () => void }> = ({ user, onLogout }) => (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0c0a09] p-6 relative overflow-hidden font-display">

        {/* Background Decor (CAPI Style) */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-orange-200/20 dark:bg-orange-900/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-200/20 dark:bg-blue-900/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-md w-full bg-white dark:bg-[#1c1917] rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 animate-zoom-in relative z-10 flex flex-col items-center text-center">

            <div className="mb-10 scale-110">
                <Logo className="h-12" textClassName="text-3xl" />
            </div>

            <div className="w-24 h-24 bg-orange-50 dark:bg-orange-900/10 rounded-full flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 rounded-full border-4 border-orange-100 dark:border-orange-900/30 border-t-orange-500 animate-spin"></div>
                <span className="material-symbols-outlined text-4xl text-orange-500">hourglass_top</span>
            </div>

            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Aguardando Aprovação</h2>

            <p className="text-slate-500 dark:text-slate-400 text-base mb-8 leading-relaxed">
                Olá, <strong className="text-slate-900 dark:text-white">{user.name.split(' ')[0]}</strong>. <br />
                Sua conta foi criada com sucesso. Para acessar o sistema, você precisa ser vinculado a uma loja.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 w-full mb-8 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full"></div>

                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Instrução</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 font-medium">
                    Peça para o <strong>Gerente</strong> acessar a aba <strong>Equipe</strong> e adicionar este email:
                </p>
                <div
                    className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between group cursor-pointer hover:border-primary transition-colors shadow-sm"
                    onClick={() => {
                        navigator.clipboard.writeText(user.email);
                        alert("Email copiado!");
                    }}
                    title="Clique para copiar"
                >
                    <code className="text-sm font-bold text-primary truncate mr-2">{user.email}</code>
                    <span className="material-symbols-outlined text-slate-300 text-sm group-hover:text-primary transition-colors">content_copy</span>
                </div>
            </div>

            <button
                onClick={onLogout}
                className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2 group shadow-orange-500/20"
            >
                <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
                Sair / Voltar
            </button>
        </div>

        <p className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">CAPI System Security</p>
    </div>
);

// We define AppLayout to handle the Authenticated Application Logic
const AppLayout: React.FC<{ currentUser: User, onLogout: () => void }> = ({ currentUser: initialUser, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // We assume currentUser is already authenticated coming from App's ProtectedRoute logic, 
    // but we can fetch fresh data if needed or use what's passed.
    // However, AppLayout also manages state like transactions, so it needs to be stateful.

    // NOTE: In this refactor, we are trusting the 'currentUser' passed from props as the session user.
    // If we want to refresh 'currentUser', we should bubble that up or use a Context.
    // For simplicity, we'll use the prop but also keep local state for the User to allow updates (like subscription).
    const [currentUser, setCurrentUser] = useState<User>(initialUser);

    // UI Modal States
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isCreateStoreModalOpen, setIsCreateStoreModalOpen] = useState(false);

    // Sidebar States
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);


    // --- Data Persistence (via API) ---
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [customerAccounts, setCustomerAccounts] = useState<CustomerAccount[]>([]);
    const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
    const [cashClosings, setCashClosings] = useState<CashClosing[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

    // Estado da Equipe
    const [team, setTeam] = useState<User[]>([]);

    // Update page title based on current route
    useEffect(() => {
        const routeTitles: Record<string, string> = {
            '/app': 'Visão Geral',
            '/app/dashboard': 'Visão Geral',
            '/app/pos': 'Frente de Caixa',
            '/app/crm': 'CRM / Vendas',
            '/app/customer_accounts': 'Crediário',
            '/app/services': 'Serviços (OS)',
            '/app/products': 'Produtos',
            '/app/finance': 'Financeiro',
            '/app/invoices': 'Contas a Pagar',
            '/app/reports': 'Relatórios',
            '/app/closings': 'Fechamentos',
            '/app/users': 'Equipe',
            '/app/suppliers': 'Fornecedores',
            '/app/profile': 'Perfil',
            '/app/profile_billing': 'Faturas e Planos',
            '/app/settings': 'Configurações',
        };

        const title = routeTitles[location.pathname] || 'Visão Geral';
        document.title = `CAPI - ${title}`;
    }, [location.pathname]);

    // Global Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                setIsShortcutsHelpOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        if (currentUser.role === 'Aguardando') {
            return;
        }

        // Multi-store: Use activeStoreId, fallback to legacy storeId
        const storeId = currentUser.activeStoreId || currentUser.storeId;

        if (storeId) {
            const loadData = async () => {
                try {
                    const [txs, banks, prods, custs, servs, closings, supps, teamMembers] = await Promise.all([
                        dataService.fetch(storeId, 'transactions'),
                        dataService.fetch(storeId, 'bank-accounts'),
                        dataService.fetch(storeId, 'products'),
                        dataService.fetch(storeId, 'customers'),
                        dataService.fetch(storeId, 'service-orders'),
                        dataService.fetch(storeId, 'cash-closings'),
                        dataService.fetch(storeId, 'suppliers'),
                        authService.getStoreTeam(storeId)

                    ]);

                    setTransactions(txs);
                    setBankAccounts(banks);
                    setProducts(prods);
                    setCustomerAccounts(custs);
                    setServiceOrders(servs);
                    setCashClosings(closings);
                    setSuppliers(supps);
                    setTeam(teamMembers);
                } catch (error) {
                    console.error("Erro ao carregar dados:", error);
                }
            };
            loadData();
        }
    }, [currentUser]);
    // Added currentUser dependency to reload if user changes (e.g. initial load)

    // --- EFFECT: Subscription Enforcement ---
    useEffect(() => {
        if (currentUser) {
            if (currentUser.subscriptionStatus === 'ACTIVE' && currentUser.nextBillingAt) {
                const now = new Date();
                const billingDate = new Date(currentUser.nextBillingAt);
                if (now > billingDate) {
                    console.log("Assinatura expirada. Atualizando status...");
                    const updated = { ...currentUser, subscriptionStatus: 'PENDING' } as User;
                    authService.updateProfile(updated);
                    setCurrentUser(updated);
                }
            }

            if (currentUser.subscriptionStatus === 'PENDING' || currentUser.subscriptionStatus === 'CANCELED') {
                // Check if we are already on payment page to avoid loop?
                // No, AppLayout is INSIDE /app/*. Payment is /payment.
                // So if subscription is bad, Navigate to /payment.
                navigate('/payment');
            }
        }
    }, [currentUser, navigate]);

    // --- EFFECT: Global Microphone Permission Check REMOVED to avoid conflicts ---
    // Permission will be requested on-demand by components.

    // --- Global Keyboard Shortcuts ---
    useKeyboardShortcuts([
        // Command Palette
        { key: 'k', ctrl: true, action: () => setIsCommandPaletteOpen(true), description: 'Abrir busca rápida', category: 'global' },

        // Navigation
        { key: 'd', ctrl: true, action: () => navigate('/app/dashboard'), description: 'Dashboard', category: 'navigation' },
        { key: 'p', ctrl: true, action: () => navigate('/app/products'), description: 'Produtos', category: 'navigation' },
        { key: 'v', ctrl: true, action: () => navigate('/app/pos'), description: 'Vendas', category: 'navigation' },
        { key: 'c', ctrl: true, action: () => navigate('/app/crm'), description: 'Clientes', category: 'navigation' },
        { key: 'f', ctrl: true, action: () => navigate('/app/finance'), description: 'Financeiro', category: 'navigation' },
        { key: 's', ctrl: true, action: () => navigate('/app/settings'), description: 'Configurações', category: 'navigation' },

        // Toggle Actions
        { key: 'b', ctrl: true, action: () => setIsDesktopSidebarOpen(prev => !prev), description: 'Abrir/Fechar menu', category: 'toggle' },
        {
            key: 't', ctrl: true, action: () => {
                const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
                setSettings({ ...settings, theme: newTheme });
            }, description: 'Alternar tema', category: 'toggle'
        },

        // AI Assistant
        { key: ' ', ctrl: true, action: () => setIsAiModalOpen(true), description: 'Assistente IA', category: 'ai' },

        // Logout
        {
            key: 'l', ctrl: true, action: () => {
                if (confirm('Deseja realmente sair?')) onLogout();
            }, description: 'Sair', category: 'account'
        },
    ]);

    // Handlers
    const handleSaveTransaction = async (tx: Transaction) => {
        const storeId = currentUser?.activeStoreId || currentUser?.storeId;

        if (!storeId) {
            console.error("Erro: Usuário sem loja vinculada.");
            alert("Erro: Você não está vinculado a uma loja.");
            throw new Error("Usuário sem loja");
        }

        const isNew = !transactions.find(t => t.id === tx.id);
        const originalTransactions = [...transactions]; // Backup for rollback
        const tempId = `temp-${Date.now()}`;

        // OPTIMISTIC UPDATE
        if (isNew) {
            // Create temp transaction for UI
            const optimisticTx = { ...tx, id: tempId };
            setTransactions(prev => [optimisticTx, ...prev]);
        } else {
            // Update existing in UI
            setTransactions(prev => prev.map(t => t.id === tx.id ? tx : t));
        }

        // Close modal immediately for "instant" feel
        setIsTransactionModalOpen(false);
        setEditingTransaction(null);

        try {
            if (!isNew) {
                // Update existing
                await dataService.update('transactions', tx.id, tx);
                // No further state update needed as we already did it
            } else {
                // Create new
                const { id, ...txData } = tx;
                // Fix: Remove userId as it is not present in Prisma Transaction model
                const txPayload = { ...txData };
                const savedTx = await dataService.create(storeId, 'transactions', txPayload);

                if (!savedTx) {
                    throw new Error("Falha ao criar transação: Resposta vazia da API");
                }

                // Swap Temp ID with Real ID quietly
                setTransactions(prev => prev.map(t => t.id === tempId ? savedTx : t));

                // Debt Payment Deduction Logic (Keep server-side confirmation preferred, but could be optimistic too)
                if (tx.isDebtPayment && tx.entity) {
                    const customer = customerAccounts.find(c => c.name.toLowerCase() === tx.entity?.toLowerCase());
                    if (customer) {
                        const updatedCustomer = {
                            ...customer,
                            balance: Math.max(0, customer.balance - tx.amount),
                            items: [...customer.items, {
                                id: Date.now().toString(),
                                date: new Date().toISOString(),
                                description: `Pagamento: ${tx.description}`,
                                amount: -tx.amount // Negative to show payment
                            }],
                            lastUpdate: new Date().toISOString()
                        };
                        await dataService.update('customers', customer.id, updatedCustomer);
                        setCustomerAccounts(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
                    }
                }

                // Stock Update Logic
                if (tx.type === TransactionType.INCOME && tx.items && tx.items.length > 0) {
                    const currentProducts = [...products];
                    let stockUpdated = false;

                    for (const item of tx.items) {
                        const productIndex = currentProducts.findIndex(p =>
                            p.name.toLowerCase().trim() === item.productName.toLowerCase().trim() ||
                            p.name.toLowerCase().includes(item.productName.toLowerCase())
                        );

                        if (productIndex >= 0) {
                            const product = currentProducts[productIndex];
                            const newStock = Math.max(0, product.stock - item.quantity);
                            await dataService.update('products', product.id, { stock: newStock });
                            currentProducts[productIndex] = { ...product, stock: newStock };
                            stockUpdated = true;
                        }
                    }
                    if (stockUpdated) setProducts(currentProducts);
                }
            }
        } catch (error) {
            console.error("Erro ao salvar transação (Optimistic Revert):", error);
            // ROLLBACK
            setTransactions(originalTransactions);
            alert("Erro ao salvar transação. As alterações foram desfeitas.");
            // Re-open modal if needed? Or just let user try again.
        }
    };

    const getStoreId = () => {
        const id = currentUser?.activeStoreId || currentUser?.storeId;
        if (!id) throw new Error("Usuário sem loja vinculada.");
        return id;
    };

    const handleAiDebt = async (customerName: string, amount: number, description: string) => {
        try {
            const storeId = getStoreId();
            let target = customerAccounts.find(c => c.name.toLowerCase() === customerName.toLowerCase());
            const newItem: CustomerAccountItem = { id: Date.now().toString(), date: new Date().toISOString(), description, amount };

            if (target) {
                const updatedCustomer = {
                    ...target,
                    balance: target.balance + amount,
                    items: [...target.items, newItem],
                    lastUpdate: new Date().toISOString()
                };
                await dataService.update('customers', target.id, updatedCustomer);
                setCustomerAccounts(prev => prev.map(c => c.id === target!.id ? updatedCustomer : c));
            } else {
                const newAccData = {
                    name: customerName,
                    balance: amount,
                    items: [newItem],
                    lastUpdate: new Date().toISOString(),
                    // pipelineStage: undefined // Explicitly undefined for Crediário/Debt
                };
                const savedAcc = await dataService.create(storeId, 'customers', newAccData);
                setCustomerAccounts(prev => [savedAcc, ...prev]);
            }
        } catch (error) {
            console.error("Erro ao salvar dívida IA:", error);
            alert("Erro ao salvar dívida. Verifique sua loja ou conexão.");
            throw error;
        }
    };

    // --- POS Logic Update for Cashback ---
    const handleFinalizeSale = async (cart: { product: Product, quantity: number }[], total: number, method: PaymentMethod, customerId?: string, discount?: number, notes?: string, cashbackAmount?: number) => {
        try {
            const storeId = getStoreId();

            // 1. Create Transaction
            const newTxData = {
                description: notes || `Venda PDV (${cart.length} itens)`,
                amount: total,
                type: TransactionType.INCOME,
                category: 'Vendas',
                paymentMethod: method,
                date: new Date().toISOString(),
                status: TransactionStatus.COMPLETED,
                entity: customerId ? (customerAccounts.find(c => c.id === customerId)?.name || 'Cliente') : 'Consumidor Final',
                items: cart.map(i => ({
                    productId: i.product.id,
                    productName: i.product.name,
                    quantity: i.quantity,
                    unitPrice: i.product.salePrice,
                    total: i.product.salePrice * i.quantity
                }))
            };

            const savedTx = await dataService.create(storeId, 'transactions', newTxData);
            setTransactions(prev => [savedTx, ...prev]);

            // 2. Decrease Stock
            const newProducts = [...products];
            const stockUpdates = [];

            for (const item of cart) {
                const idx = newProducts.findIndex(p => p.id === item.product.id);
                if (idx >= 0) {
                    const newStock = newProducts[idx].stock - item.quantity;
                    newProducts[idx] = { ...newProducts[idx], stock: newStock };
                    stockUpdates.push(dataService.update('products', item.product.id, { stock: newStock }));
                }
            }

            await Promise.all(stockUpdates);
            setProducts(newProducts);

            // 3. Apply Cashback (Negative Balance implies Credit)
            if (customerId && cashbackAmount && cashbackAmount > 0) {
                const customer = customerAccounts.find(c => c.id === customerId);
                if (customer) {
                    const newItem: CustomerAccountItem = {
                        id: Date.now().toString() + "_cb",
                        date: new Date().toISOString(),
                        description: "Cashback Pix Fidelidade (Crédito)",
                        amount: -cashbackAmount
                    };

                    const updatedCustomer = {
                        ...customer,
                        balance: customer.balance - cashbackAmount,
                        items: [...customer.items, newItem],
                        lastUpdate: new Date().toISOString()
                    };

                    await dataService.update('customers', customerId, updatedCustomer);

                    setCustomerAccounts(prev => prev.map(acc => acc.id === customerId ? updatedCustomer : acc));
                }
            }
        } catch (error) {
            console.error("Erro ao finalizar venda:", error);
            alert("Erro ao processar venda. Verifique sua conexão.");
        }
    };

    // --- Global Delete Confirmation State ---
    const [pendingDeletion, setPendingDeletion] = useState<{ id: string, type: 'CUSTOMER' | 'PRODUCT' | 'SERVICE' | 'SUPPLIER' | 'TRANSACTION' | 'CLOSING' | 'BANK_ACCOUNT' } | null>(null);

    // --- Custom Logic Wrappers for Pages ---
    const handleAddCustomer = async (name: string, phone: string, origin: 'CRM' | 'CREDIARIO' = 'CREDIARIO') => {
        const storeId = getStoreId();
        const tempId = `temp-${Date.now()}`;
        const newCustomerData = {
            id: tempId,
            name,
            phone,
            balance: 0,
            items: [],
            lastUpdate: new Date().toISOString(),
            pipelineStage: origin === 'CRM' ? 'LEAD' : undefined
        };

        // Optimistic Update
        setCustomerAccounts(prev => [newCustomerData as CustomerAccount, ...prev]);

        try {
            // Remove ID before sending to server (it generates one)
            const { id, ...payload } = newCustomerData;
            const savedCustomer = await dataService.create(storeId, 'customers', payload);

            // Swap ID
            setCustomerAccounts(prev => prev.map(c => c.id === tempId ? savedCustomer : c));
        } catch (error) {
            console.error("Erro ao adicionar cliente (Optimistic Revert):", error);
            alert("Erro ao adicionar cliente.");
            setCustomerAccounts(prev => prev.filter(c => c.id !== tempId));
        }
    };

    // Solicita exclusão (abre modal)
    const requestDelete = (id: string, type: 'CUSTOMER' | 'PRODUCT' | 'SERVICE' | 'SUPPLIER' | 'TRANSACTION' | 'CLOSING' | 'BANK_ACCOUNT') => {
        setPendingDeletion({ id, type });
    };

    // Confirma exclusão (executa ação)
    const handleConfirmDelete = async () => {
        if (!pendingDeletion) return;
        const { id, type } = pendingDeletion;

        // Backup current state for rollback
        const backupTransactions = [...transactions];
        const backupCustomers = [...customerAccounts];
        const backupProducts = [...products];
        const backupServiceOrders = [...serviceOrders];
        const backupSuppliers = [...suppliers];
        const backupCashClosings = [...cashClosings];
        const backupBankAccounts = [...bankAccounts];

        // OPTIMISTIC UPDATE: Remove immediately
        setPendingDeletion(null); // Close modal

        try {
            switch (type) {
                case 'CUSTOMER':
                    setCustomerAccounts(prev => prev.filter(c => c.id !== id));
                    await dataService.delete('customers', id);
                    break;
                case 'PRODUCT':
                    setProducts(prev => prev.filter(p => p.id !== id));
                    await dataService.delete('products', id);
                    break;
                case 'SERVICE':
                    setServiceOrders(prev => prev.filter(s => s.id !== id));
                    await dataService.delete('service-orders', id);
                    break;
                case 'SUPPLIER':
                    setSuppliers(prev => prev.filter(s => s.id !== id));
                    await dataService.delete('suppliers', id);
                    break;
                case 'TRANSACTION':
                    setTransactions(prev => prev.filter(t => t.id !== id));
                    await dataService.delete('transactions', id);
                    break;
                case 'CLOSING':
                    setCashClosings(prev => prev.filter(c => c.id !== id));
                    await dataService.delete('cash-closings', id);
                    break;
                case 'BANK_ACCOUNT':
                    setBankAccounts(prev => prev.filter(b => b.id !== id));
                    await dataService.delete('bank-accounts', id);
                    break;
            }
        } catch (error) {
            console.error(`Erro ao excluir ${type} (Optimistic Revert):`, error);
            alert(`Erro ao excluir item. A operação foi desfeita.`);

            // ROLLBACK
            switch (type) {
                case 'CUSTOMER': setCustomerAccounts(backupCustomers); break;
                case 'PRODUCT': setProducts(backupProducts); break;
                case 'SERVICE': setServiceOrders(backupServiceOrders); break;
                case 'SUPPLIER': setSuppliers(backupSuppliers); break;
                case 'TRANSACTION': setTransactions(backupTransactions); break;
                case 'CLOSING': setCashClosings(backupCashClosings); break;
                case 'BANK_ACCOUNT': setBankAccounts(backupBankAccounts); break;
            }
        }
    };

    const handleCustomerAddItem = async (accountId: string, item: Omit<CustomerAccountItem, 'id' | 'date'>) => {
        const originalAccounts = [...customerAccounts];
        const account = customerAccounts.find(a => a.id === accountId);
        if (!account) return;

        // Create the updated object for State (complete)
        const updatedAccount = {
            ...account,
            balance: account.balance + item.amount,
            items: [...account.items, { ...item, id: Date.now().toString(), date: new Date().toISOString() }],
            lastUpdate: new Date().toISOString()
        };

        // OPTIMISTIC UPDATE
        setCustomerAccounts(prev => prev.map(acc => acc.id === accountId ? updatedAccount : acc));

        try {
            // PAYLOAD SANITIZATION: Only send what needs to change to avoid Prisma/Backend errors w/ Relations
            const updatePayload = {
                balance: updatedAccount.balance,
                items: updatedAccount.items,
                lastUpdate: updatedAccount.lastUpdate,
                pipelineStage: account.pipelineStage // Preserve stage
            };

            await dataService.update('customers', accountId, updatePayload);
        } catch (error) {
            console.error("Erro ao atualizar conta (Optimistic Revert):", error);
            alert("Erro ao atualizar conta. A operação foi desfeita.");
            // ROLLBACK
            setCustomerAccounts(originalAccounts);
        }
    };

    const handleSettleAccount = async (accountId: string, method: PaymentMethod) => {
        const storeId = getStoreId();
        const account = customerAccounts.find(a => a.id === accountId);
        if (!account) return;

        const originalState = {
            transactions: [...transactions],
            customers: [...customerAccounts]
        };

        // 1. Prepare Data
        const txData = {
            description: `Recebimento de Conta: ${account.name}`,
            amount: account.balance,
            type: TransactionType.INCOME,
            category: 'Vendas',
            paymentMethod: method,
            date: new Date().toISOString(),
            status: TransactionStatus.COMPLETED,
            entity: account.name
        };

        const updatedAccount = {
            ...account,
            balance: 0,
            items: [],
            lastUpdate: new Date().toISOString(),
            pipelineStage: 'FECHADO'
        };

        // 2. OPTIMISTIC UPDATE
        // Add fake transaction for immediate feedback
        const tempTx = { ...txData, id: `temp-${Date.now()}` } as Transaction;
        setTransactions(prev => [tempTx, ...prev]);
        setCustomerAccounts(prev => prev.map(acc => acc.id === accountId ? updatedAccount as CustomerAccount : acc));

        try {
            // 3. API Calls
            // A. Create Transaction
            const savedTx = await dataService.create(storeId, 'transactions', txData);

            // Swap temp transaction ID
            setTransactions(prev => prev.map(t => t.id === tempTx.id ? savedTx : t));

            // B. Update Customer (SANITIZED PAYLOAD)
            const updatePayload = {
                balance: 0,
                items: [],
                lastUpdate: new Date().toISOString(),
                pipelineStage: 'FECHADO'
            };
            await dataService.update('customers', accountId, updatePayload);

        } catch (error) {
            console.error("Erro ao fechar conta (Optimistic Revert):", error);
            alert("Erro ao fechar conta. Operação desfeita.");
            // ROLLBACK
            setTransactions(originalState.transactions);
            setCustomerAccounts(originalState.customers);
        }
    };

    const financialSummary = useMemo(() => {
        let revenue = 0, expenses = 0;
        transactions.forEach(t => {
            if (t.type === TransactionType.INCOME) revenue += t.amount;
            else expenses += t.amount;
        });
        return { revenue, expenses, profit: revenue - expenses };
    }, [transactions]);


    if (currentUser.role === 'Aguardando') {
        return <WaitingApprovalPage user={currentUser} onLogout={onLogout} />;
    }

    // FILTER: Separating CRM Leads from Crediário Accounts
    // CRM Page: Shows all customers (or specifically those with pipelineStage)
    // Crediário Page: Shows only customers who owe money OR are not specifically marked as just Leads
    // CRM Page: Shows all customers
    // Crediário Page: Shows customers with Debt/Credit OR those created explicitly in Crediário
    // Hides "Leads" from CRM unless they have a balance or moved to "FECHADO".
    const crediarioAccounts = customerAccounts.filter(c =>
        Math.abs(c.balance) > 0 || // Show if they owe money
        !c.pipelineStage || // Show if created in Crediário (no stage)
        c.pipelineStage !== 'LEAD' // Show if they are not just a Lead (e.g., Fechado)
    );

    return (
        <StoreProvider user={currentUser} onUserUpdate={setCurrentUser}>
            <PrivacyProvider>
                <div className="flex h-screen w-full bg-slate-50 dark:bg-background-dark text-text-main dark:text-white transition-colors duration-200 overflow-hidden">
                    <Sidebar
                        currentPage={location.pathname === '/app' || location.pathname === '/app/' ? 'dashboard' : location.pathname.substring(location.pathname.lastIndexOf('/') + 1)}
                        onNavigate={(page) => navigate(`/app/${page === 'dashboard' ? '' : page}`)}
                        settings={settings}
                        user={currentUser}
                        isOpen={isMobileMenuOpen}
                        onClose={() => setIsMobileMenuOpen(false)}
                        isDesktopOpen={isDesktopSidebarOpen}
                        onDesktopToggle={() => setIsDesktopSidebarOpen(prev => !prev)}
                        onLogout={onLogout}
                        onCreateStore={() => setIsCreateStoreModalOpen(true)}
                    />
                    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                        {/* Trial Countdown Timer */}
                        {currentUser.subscriptionStatus === 'TRIAL' && (
                            <TrialCountdown trialEndsAt={currentUser.trialEndsAt} />
                        )}

                        {/* Header Mobile */}
                        <header className="flex md:hidden items-center justify-between p-4 bg-white dark:bg-card-dark border-b border-slate-200 dark:border-slate-800 shrink-0">
                            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 dark:text-slate-300"><span className="material-symbols-outlined">menu</span></button>
                            <div className="flex items-center gap-2">
                                {currentUser.storeLogo ? (
                                    <img src={currentUser.storeLogo} alt="Store Logo" className="h-8 w-auto object-contain" />
                                ) : (
                                    <Logo className="h-8" showText={false} />
                                )}
                            </div>
                            <div className="w-8"></div>
                        </header>

                        <main className="flex-1 overflow-hidden relative flex flex-col">
                            <Routes>
                                <Route path="/" element={<Dashboard
                                    transactions={transactions}
                                    onAddClick={() => setIsSelectionModalOpen(true)}
                                    onEditClick={(tx) => { setEditingTransaction(tx); setIsTransactionModalOpen(true); }}
                                    onDeleteClick={async (id) => { await dataService.delete('transactions', id); setTransactions(p => p.filter(t => t.id !== id)); }}
                                    closings={cashClosings}
                                    onCloseRegister={async (c) => {
                                        if (!currentUser?.storeId) return;
                                        const { id, ...cData } = c;
                                        const saved = await dataService.create(currentUser.storeId, 'cash-closings', cData);
                                        setCashClosings(p => [saved, ...p]);
                                    }}
                                    currentUser={currentUser}
                                    storeName={settings.storeName}
                                />} />
                                <Route path="pos" element={<PosPage products={products} customers={customerAccounts} onFinalizeSale={handleFinalizeSale} />} />
                                <Route path="crm" element={<CRMPage
                                    customers={customerAccounts}
                                    onUpdateCustomer={async (c) => { await dataService.update('customers', c.id, c); setCustomerAccounts(prev => prev.map(x => x.id === c.id ? c : x)); }}
                                    onAddCustomer={(n, p) => handleAddCustomer(n, p, 'CRM')}
                                    onDeleteCustomer={(id) => requestDelete(id, 'CUSTOMER')}
                                />} />
                                <Route path="customer_accounts" element={<CustomerAccountsPage accounts={crediarioAccounts} onAddAccount={(n, p) => handleAddCustomer(n, p, 'CREDIARIO')} onAddItem={handleCustomerAddItem} onSettleAccount={handleSettleAccount} onDeleteAccount={(id) => requestDelete(id, 'CUSTOMER')} />} />
                                <Route path="services" element={<ServicesPage
                                    serviceOrders={serviceOrders}
                                    customers={customerAccounts}
                                    onUpdate={async (os) => {
                                        if (!currentUser?.storeId) return;
                                        if (serviceOrders.find(o => o.id === os.id)) {
                                            await dataService.update('service-orders', os.id, os);
                                            setServiceOrders(prev => prev.map(o => o.id === os.id ? os : o));
                                        } else {
                                            const { id, ...osData } = os;
                                            const saved = await dataService.create(currentUser.storeId, 'service-orders', osData);
                                            setServiceOrders(prev => [saved, ...prev]);
                                        }
                                    }}
                                />} />
                                <Route path="products" element={<ProductsPage
                                    products={products}
                                    onSave={async (p) => {
                                        const storeId = currentUser?.activeStoreId || currentUser?.storeId;
                                        if (!storeId) {
                                            alert("Erro: Nenhuma loja selecionada. Por favor, selecione uma loja.");
                                            return;
                                        }
                                        const { id, ...pData } = p;
                                        const saved = await dataService.create(storeId, 'products', pData);
                                        setProducts(prev => [saved, ...prev]);
                                    }}
                                    onUpdate={async (p) => { await dataService.update('products', p.id, p); setProducts(prev => prev.map(x => x.id === p.id ? p : x)); }}
                                    onDelete={(id) => requestDelete(id, 'PRODUCT')}
                                />} />
                                <Route path="profile" element={<ProfilePage user={currentUser} onUpdateUser={u => { authService.updateProfile(u); setCurrentUser(u) }} onLogout={onLogout} onGoToPayment={() => navigate('/payment')} initialTab={'PERSONAL'} />} />
                                <Route path="profile_billing" element={<ProfilePage user={currentUser} onUpdateUser={u => { authService.updateProfile(u); setCurrentUser(u) }} onLogout={onLogout} onGoToPayment={() => navigate('/payment')} initialTab={'BILLING'} />} />

                                <Route path="finance" element={<FinancePage
                                    transactions={transactions}
                                    bankAccounts={bankAccounts}
                                    onUpdateTransaction={handleSaveTransaction}
                                    onUpdateBank={async (acc) => { await dataService.update('bank-accounts', acc.id, acc); setBankAccounts(prev => prev.map(b => b.id === acc.id ? acc : b)); }}
                                />} />
                                <Route path="reports" element={<ReportsPage transactions={transactions} summary={financialSummary} storeName={settings.storeName} team={team} />} />
                                <Route path="users" element={<UsersPage users={team} currentUser={currentUser} onRefresh={() => authService.getStoreTeam(currentUser!.storeId!).then(setTeam)} />} />
                                <Route path="settings" element={<SettingsPage settings={settings} onUpdateSettings={setSettings} />} />
                                <Route path="suppliers" element={<SuppliersPage
                                    suppliers={suppliers}
                                    onAdd={async (s) => {
                                        if (!currentUser?.storeId) return;
                                        const { id, ...sData } = s;
                                        const saved = await dataService.create(currentUser.storeId, 'suppliers', sData);
                                        setSuppliers(p => [saved, ...p]);
                                    }}
                                    onUpdate={async (s) => { await dataService.update('suppliers', s.id, s); setSuppliers(p => p.map(x => x.id === s.id ? s : x)); }}
                                    onDelete={(id) => requestDelete(id, 'SUPPLIER')}
                                />} />
                                <Route path="invoices" element={
                                    (currentUser.role === 'Administrador' || currentUser.role === 'Gerente' || currentUser.role === 'Proprietário') ? (
                                        <InvoicesPage
                                            transactions={transactions}
                                            bankAccounts={bankAccounts}
                                            onUpdateTransaction={handleSaveTransaction}
                                            onUpdateBank={async (acc) => { await dataService.update('bank-accounts', acc.id, acc); setBankAccounts(prev => prev.map(b => b.id === acc.id ? acc : b)); }}
                                            onAddTransaction={handleSaveTransaction}
                                            onDeleteTransaction={(tx) => requestDelete(tx.id, 'TRANSACTION')}
                                            onOpenAI={() => setIsSelectionModalOpen(true)}
                                        />
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center p-8">
                                            <div className="text-center max-w-md">
                                                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-4xl">block</span>
                                                </div>
                                                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Acesso Restrito</h2>
                                                <p className="text-slate-500 dark:text-slate-400">Apenas Administradores e Gerentes podem acessar as Contas a Pagar.</p>
                                            </div>
                                        </div>
                                    )
                                } />
                                <Route path="closings" element={<ClosingsHistoryPage
                                    closings={cashClosings}
                                    onDelete={(id) => requestDelete(id, 'CLOSING')}
                                    storeName={settings.storeName}
                                />} />
                            </Routes>
                        </main>
                    </div>
                    <>
                        <EntrySelectionModal
                            isOpen={isSelectionModalOpen}
                            onClose={() => setIsSelectionModalOpen(false)}
                            onSelectManual={() => { }}
                            onSelectAI={() => setIsAiModalOpen(true)}
                        />
                        <AiTransactionModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} onSave={handleSaveTransaction} onSaveDebt={handleAiDebt} currentContext={'dashboard'} onNavigate={(p) => navigate(`/app/${p}`)} />
                        <CreateStoreModal
                            isOpen={isCreateStoreModalOpen}
                            onClose={() => setIsCreateStoreModalOpen(false)}
                            userId={currentUser.id}
                            onSuccess={async () => {
                                // Refresh user stores
                                const storesData = await authService.getUserStores(currentUser.id);
                                setCurrentUser({
                                    ...currentUser,
                                    stores: storesData.stores,
                                    activeStoreId: storesData.activeStoreId,
                                    ownedStores: storesData.ownedStores
                                });
                            }}
                        />
                        <ConfirmationModal
                            isOpen={!!pendingDeletion}
                            onClose={() => setPendingDeletion(null)}
                            onConfirm={handleConfirmDelete}
                            title={pendingDeletion?.type === 'CUSTOMER' ? "Excluir Cliente" : pendingDeletion?.type === 'PRODUCT' ? "Excluir Produto" : pendingDeletion?.type === 'SERVICE' ? "Excluir Serviço" : pendingDeletion?.type === 'SUPPLIER' ? "Excluir Fornecedor" : pendingDeletion?.type === 'TRANSACTION' ? "Excluir Transação" : pendingDeletion?.type === 'CLOSING' ? "Excluir Fechamento" : "Confirmar Exclusão"}
                            message={"Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."}
                            confirmText="Excluir"
                            cancelText="Cancelar"
                            isDestructive={true}
                        />
                        <CommandPalette
                            isOpen={isCommandPaletteOpen}
                            onClose={() => setIsCommandPaletteOpen(false)}
                            onNavigate={(page) => navigate(`/app/${page}`)}
                        />
                        <ShortcutsHelp
                            isOpen={isShortcutsHelpOpen}
                            onClose={() => setIsShortcutsHelpOpen(false)}
                        />
                    </>
                </div>
            </PrivacyProvider>
        </StoreProvider>
    );
    // End of App component
};


// Componente Wrapper para Rotas Protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const user = authService.getSession();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        // We inject the user into the children if they are capable of receiving it, 
        // OR we just rely on children fetching data themselves.
        // In our case, AppLayout expects currentUser.
        // So we clone the element if it's a valid element.
        React.isValidElement(children)
            ? React.cloneElement(children as React.ReactElement<any>, { currentUser: user })
            : <>{children}</>
    );
};

const App: React.FC = () => {
    // We lift state here to share between pages (like Landing Page needs to know if logged in)
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Initial check
    useEffect(() => {
        const user = authService.getSession();
        if (user) setCurrentUser(user);
    }, []);

    const handleLoginSuccess = (user: User) => {
        authService.createSession(user);
        setCurrentUser(user);
        // Track login event
        firebaseAnalytics.userLogin('email');
    };

    const handleLogout = () => {
        // Track logout event before clearing session
        firebaseAnalytics.userLogout();
        authService.logout();
        setCurrentUser(null);
    };

    return (
        <ToastProvider>
            <BrowserRouter>
                {/* <AnalyticsTracker /> */}
                <Routes>
                    <Route path="/" element={<LandingPage
                        currentUser={currentUser}
                        onLogout={handleLogout}
                    />} />

                    <Route path="/login" element={
                        currentUser
                            ? <Navigate to="/app" replace />
                            : <AuthPage initialMode="login" onSuccess={handleLoginSuccess} />
                    } />

                    <Route path="/register" element={
                        currentUser
                            ? <Navigate to="/app" replace />
                            : <AuthPage initialMode="register" onSuccess={handleLoginSuccess} />
                    } />

                    <Route path="/payment" element={<PaymentPage user={currentUser || undefined} />} />
                    <Route path="/updates" element={<ChangelogPage currentUser={currentUser} onLogout={handleLogout} />} />
                    <Route path="/docs" element={<DocumentationPage currentUser={currentUser} onLogout={handleLogout} />} />

                    {/* Protected Routes */}
                    <Route path="/app/*" element={
                        <ProtectedRoute>
                            <AppLayout currentUser={currentUser!} onLogout={handleLogout} />
                        </ProtectedRoute>
                    } />

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </ToastProvider>
    );
};

export default App;
