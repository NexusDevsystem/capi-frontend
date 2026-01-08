
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, TransactionStatus, BankAccount, PaymentMethod } from '../types';


interface InvoicesPageProps {
    transactions: Transaction[];
    bankAccounts: BankAccount[];
    onUpdateTransaction: (tx: Transaction) => void;
    onUpdateBank: (account: BankAccount) => void;
    onAddTransaction?: (tx: Transaction) => void;
    onOpenAI?: () => void;
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({ transactions, bankAccounts, onUpdateTransaction, onUpdateBank, onAddTransaction, onOpenAI }) => {
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'PAID'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [settleTx, setSettleTx] = useState<Transaction | null>(null);
    const [selectedBankId, setSelectedBankId] = useState('');

    // Modal para Nova Conta
    const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Core Logic: Filter only EXPENSES (Invoices/Bills)
    const invoices = useMemo(() => {
        return transactions.filter(t => t.type === TransactionType.EXPENSE);
    }, [transactions]);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(t => {
            const tDate = new Date(t.date);
            tDate.setHours(0, 0, 0, 0);

            const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.entity.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            const isPaid = t.status === TransactionStatus.PAID || t.status === TransactionStatus.COMPLETED;

            if (statusFilter === 'ALL') return true;
            if (statusFilter === 'PAID') return isPaid;
            if (statusFilter === 'OVERDUE') return !isPaid && tDate < today;
            if (statusFilter === 'PENDING') return !isPaid && tDate >= today;

            return true;
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [invoices, statusFilter, searchTerm, today]);

    // Metrics
    const metrics = useMemo(() => {
        let totalPending = 0;
        let totalOverdue = 0;
        let totalPaid = 0;
        let countOverdue = 0;

        invoices.forEach(t => {
            const isPaid = t.status === TransactionStatus.PAID || t.status === TransactionStatus.COMPLETED;

            const tDate = new Date(t.date);
            tDate.setHours(0, 0, 0, 0);

            if (isPaid) {
                totalPaid += t.amount;
            } else if (tDate < today) {
                totalOverdue += t.amount;
                countOverdue++;
            } else {
                totalPending += t.amount;
            }
        });

        return { totalPending, totalOverdue, totalPaid, countOverdue };
    }, [invoices, today]);

    const handleSaveNewBill = (tx: Transaction) => {
        if (!onAddTransaction) return;

        const finalTx: Transaction = {
            ...tx,
            type: TransactionType.EXPENSE,
            entity: tx.entity || 'Fornecedor',
        };

        onAddTransaction(finalTx);
        setIsNewBillModalOpen(false);
    };

    const handleConfirmPayment = () => {
        if (!settleTx || !selectedBankId) return;

        const bank = bankAccounts.find(b => b.id === selectedBankId);
        if (!bank) return;

        onUpdateTransaction({
            ...settleTx,
            status: TransactionStatus.PAID,
            bankAccountId: selectedBankId,
            paymentMethod: 'OUTRO'
        });

        onUpdateBank({
            ...bank,
            balance: bank.balance - settleTx.amount
        });

        setSettleTx(null);
        setSelectedBankId('');
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-background-dark pb-32">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-rose-500 text-4xl">receipt_long</span>
                        Contas a Pagar
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie seus compromissos financeiros e evite juros.</p>
                </div>

                <button
                    onClick={() => setIsNewBillModalOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 border border-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                    <span className="material-symbols-outlined">add</span>
                    Nova Conta
                </button>
            </header>

            {/* Metrics Grid - Redesigned */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

                <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer" onClick={() => setStatusFilter('PENDING')}>
                    <div className="absolute -right-6 -bottom-6 opacity-[0.05] group-hover:opacity-10 transition-opacity">
                        <span className="material-symbols-outlined text-[120px] text-blue-600">schedule</span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">A Vencer</p>
                        <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400">{formatCurrency(metrics.totalPending)}</h3>
                        <div className={`mt-2 h-1 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden ${statusFilter === 'PENDING' ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                            <div className="h-full bg-blue-500 w-full"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer" onClick={() => setStatusFilter('OVERDUE')}>
                    <div className="absolute -right-6 -bottom-6 opacity-[0.05] group-hover:opacity-10 transition-opacity">
                        <span className="material-symbols-outlined text-[120px] text-red-600">warning</span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Atrasadas ({metrics.countOverdue})</p>
                        <h3 className="text-3xl font-black text-red-600 dark:text-red-400">{formatCurrency(metrics.totalOverdue)}</h3>
                        <div className={`mt-2 h-1 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden ${statusFilter === 'OVERDUE' ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                            <div className="h-full bg-red-500 w-full"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer" onClick={() => setStatusFilter('PAID')}>
                    <div className="absolute -right-6 -bottom-6 opacity-[0.05] group-hover:opacity-10 transition-opacity">
                        <span className="material-symbols-outlined text-[120px] text-emerald-600">check_circle</span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pagas (Hoje)</p>
                        <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(metrics.totalPaid)}</h3>
                        <div className={`mt-2 h-1 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden ${statusFilter === 'PAID' ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                            <div className="h-full bg-emerald-500 w-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-4 flex flex-col md:flex-row gap-4 items-center shadow-sm">
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full md:w-auto">
                    <button onClick={() => setStatusFilter('ALL')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === 'ALL' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>Todas</button>
                    <button onClick={() => setStatusFilter('PENDING')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === 'PENDING' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}>A Vencer</button>
                    <button onClick={() => setStatusFilter('OVERDUE')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === 'OVERDUE' ? 'bg-white dark:bg-slate-700 shadow text-red-600' : 'text-slate-500'}`}>Atrasadas</button>
                    <button onClick={() => setStatusFilter('PAID')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === 'PAID' ? 'bg-white dark:bg-slate-700 shadow text-green-600' : 'text-slate-500'}`}>Pagas</button>
                </div>

                <div className="relative w-full md:flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">search</span>
                    <input
                        type="text"
                        placeholder="Buscar fornecedor ou descrição..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Invoices List - Card Based */}
            <div className="space-y-3">
                {filteredInvoices.map(t => {
                    const tDate = new Date(t.date);
                    tDate.setHours(0, 0, 0, 0);
                    const isPaid = t.status === TransactionStatus.PAID || t.status === TransactionStatus.COMPLETED;
                    const isOverdue = !isPaid && tDate < today;
                    const isToday = tDate.getTime() === today.getTime();

                    return (
                        <div
                            key={t.id}
                            className={`bg-white dark:bg-card-dark rounded-2xl border-2 p-4 md:p-6 transition-all shadow-sm hover:shadow-md hover:-translate-y-1 ${isOverdue ? 'border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10' :
                                isToday ? 'border-amber-200 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/10' :
                                    isPaid ? 'border-green-200 dark:border-green-900/30 bg-green-50/20 dark:bg-green-900/10' :
                                        'border-slate-200 dark:border-slate-800'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                {/* Left: Info */}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isOverdue ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                                            isToday ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                                                isPaid ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                                                    'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                            }`}>
                                            <span className="material-symbols-outlined">
                                                {isPaid ? 'check_circle' : isOverdue ? 'warning' : 'schedule'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-black text-slate-900 dark:text-white text-lg">{t.entity}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{t.description}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase">
                                                    {t.category}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Center: Date & Amount */}
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Vencimento</p>
                                        <p className={`text-sm font-black ${isOverdue ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {tDate.toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Valor</p>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(t.amount)}</p>
                                    </div>
                                </div>

                                {/* Right: Action */}
                                <div className="flex items-center gap-3">
                                    {isPaid ? (
                                        <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-xl">
                                            <span className="material-symbols-outlined text-xl">check_circle</span>
                                            <span className="font-bold text-sm">Pago</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setSettleTx(t)}
                                            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1"
                                        >
                                            <span className="material-symbols-outlined">payments</span>
                                            Pagar Agora
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {
                filteredInvoices.length === 0 && (
                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-20 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 mb-4">
                            <span className="material-symbols-outlined text-5xl">receipt_long</span>
                        </div>
                        <p className="font-bold text-slate-500 text-lg">Nenhuma conta encontrada</p>
                        <p className="text-sm text-slate-400 mt-1">Tente ajustar os filtros ou adicione uma nova conta.</p>
                    </div>
                )
            }

            {/* Payment Modal */}
            {
                settleTx && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white dark:bg-card-dark w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-zoom-in">
                            <div className="p-6 bg-gradient-to-r from-primary to-orange-600 text-white flex justify-between items-center">
                                <h3 className="font-bold text-xl">Confirmar Pagamento</h3>
                                <button onClick={() => setSettleTx(null)} className="text-white/80 hover:text-white">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="text-center bg-slate-50 dark:bg-slate-900 rounded-2xl p-6">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Pagando para</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white mb-3">{settleTx.entity}</p>
                                    <p className="text-4xl font-black text-primary">{formatCurrency(settleTx.amount)}</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Conta Bancária</label>
                                    <select
                                        value={selectedBankId}
                                        onChange={(e) => setSelectedBankId(e.target.value)}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">Selecione a conta...</option>
                                        {bankAccounts.map(b => (
                                            <option key={b.id} value={b.id}>{b.name} ({formatCurrency(b.balance)})</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={handleConfirmPayment}
                                    disabled={!selectedBankId}
                                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">check_circle</span>
                                    Confirmar Pagamento
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }


        </div >
    );
};
