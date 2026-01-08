
import React, { useState, useMemo } from 'react';
import { usePrivacy } from '../contexts/PrivacyContext';
import { PrivacyToggle } from '../components/PrivacyToggle';
import { PrivacyValue } from '../components/PrivacyValue';
import { Transaction, TransactionType, TransactionStatus, BankAccount } from '../types';
import { HelpTip } from '../components/HelpTip';

interface FinancePageProps {
    transactions: Transaction[];
    bankAccounts?: BankAccount[];
    onUpdateTransaction: (tx: Transaction) => void;
    onUpdateBank?: (account: BankAccount) => void;
    onTransfer?: (fromId: string, toId: string, amount: number) => void;
}

export const FinancePage: React.FC<FinancePageProps> = ({ transactions, bankAccounts = [], onUpdateTransaction, onUpdateBank, onTransfer }) => {
    const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    const [statusFilter, setStatusFilter] = useState<'PENDING' | 'OVERDUE' | 'COMPLETED'>('PENDING');
    const [viewMode, setViewMode] = useState<'TRANSACTIONS' | 'ACCOUNTS' | 'TRANSFERS'>('TRANSACTIONS');

    // Transfer State
    const [transferAmount, setTransferAmount] = useState('');
    const [transferFrom, setTransferFrom] = useState('');
    const [transferTo, setTransferTo] = useState('');

    // Settle Modal State
    const [settleTx, setSettleTx] = useState<Transaction | null>(null);
    const [settleAccountId, setSettleAccountId] = useState('');

    // Privacy Mode (Persisted)
    const { privacyMode } = usePrivacy();



    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // --- Core Logic for Financial Health ---
    const financialState = useMemo(() => {
        let overdueTotal = 0;
        let pendingIncome = 0;
        let pendingExpense = 0;
        let balance = 0;

        transactions.forEach(t => {
            const tDate = new Date(t.date);
            tDate.setHours(0, 0, 0, 0);
            const isCompleted = t.status === TransactionStatus.COMPLETED || t.status === TransactionStatus.PAID;

            if (isCompleted) {
                if (t.type === TransactionType.INCOME) balance += t.amount;
                else balance -= t.amount;
            } else {
                if (t.type === TransactionType.INCOME) pendingIncome += t.amount;
                else pendingExpense += t.amount;

                if (tDate < today) overdueTotal += t.amount;
            }
        });

        return { overdueTotal, pendingIncome, pendingExpense, balance };
    }, [transactions, today]);

    // --- Filtered List for Display ---
    const displayTransactions = useMemo(() => {
        return transactions.filter(t => {
            const tDate = new Date(t.date);
            tDate.setHours(0, 0, 0, 0);
            if (filter !== 'ALL' && t.type !== filter) return false;
            const isCompleted = t.status === TransactionStatus.COMPLETED || t.status === TransactionStatus.PAID;
            if (statusFilter === 'COMPLETED') return isCompleted;
            if (statusFilter === 'OVERDUE') return !isCompleted && tDate < today;
            if (statusFilter === 'PENDING') return !isCompleted && tDate >= today;
            return true;
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [transactions, filter, statusFilter, today]);

    const handleConfirmSettle = () => {
        if (!settleTx || !settleAccountId) return;

        // Update Transaction
        onUpdateTransaction({
            ...settleTx,
            status: TransactionStatus.COMPLETED,
            paymentMethod: 'OUTRO',
            bankAccountId: settleAccountId
        });

        // Update Bank Balance
        if (onUpdateBank) {
            const account = bankAccounts.find(b => b.id === settleAccountId);
            if (account) {
                const newBalance = settleTx.type === TransactionType.INCOME
                    ? account.balance + settleTx.amount
                    : account.balance - settleTx.amount;
                onUpdateBank({ ...account, balance: newBalance });
            }
        }

        setSettleTx(null);
        setSettleAccountId('');
    };

    const handleConfirmTransfer = () => {
        if (!onTransfer || !transferFrom || !transferTo || !transferAmount) return;
        if (transferFrom === transferTo) return alert("Origem e destino devem ser diferentes.");

        onTransfer(transferFrom, transferTo, parseFloat(transferAmount));

        setTransferAmount('');
        setTransferFrom('');
        setTransferTo('');
        alert("Transferência realizada com sucesso!");
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-[1200px] mx-auto w-full pb-32">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight flex items-center gap-3">
                        Tesouraria & Contas

                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base mt-1">Fluxo de caixa, transferências e previsões.</p>
                </div>
                <div className="flex items-center gap-3">
                    <PrivacyToggle className="flex items-center justify-center w-10 h-10 bg-white dark:bg-card-dark text-slate-400 hover:text-primary border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm" iconSize="text-xl" />
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto max-w-full">
                        <button onClick={() => setViewMode('TRANSACTIONS')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${viewMode === 'TRANSACTIONS' ? 'bg-white dark:bg-slate-600 shadow text-primary' : 'text-slate-500'}`}>Lançamentos</button>
                        <button onClick={() => setViewMode('ACCOUNTS')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${viewMode === 'ACCOUNTS' ? 'bg-white dark:bg-slate-600 shadow text-primary' : 'text-slate-500'}`}>Minhas Contas</button>
                        <button onClick={() => setViewMode('TRANSFERS')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${viewMode === 'TRANSFERS' ? 'bg-white dark:bg-slate-600 shadow text-primary' : 'text-slate-500'}`}>Transferências</button>
                    </div>
                </div>
            </header>

            {viewMode === 'ACCOUNTS' && (
                <div className="animate-fade-in">
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50 flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-600">info</span>
                        <div>
                            <h4 className="font-bold text-blue-700 dark:text-blue-300 text-sm">Organize seu dinheiro</h4>
                            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">Crie contas para representar onde o dinheiro fica fisicamente (Ex: "Gaveta do Caixa", "Cofre", "Banco Inter"). Isso ajuda a saber exatamente quanto tem em cada lugar.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Add New Card */}
                        <div
                            onClick={() => {
                                if (onUpdateBank) onUpdateBank({ id: Date.now().toString(), name: 'Nova Conta', type: 'CORRENTE', balance: 0 });
                            }}
                            className="h-40 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-primary hover:text-primary transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                            <span className="material-symbols-outlined text-4xl mb-2">add_circle</span>
                            <span className="font-bold">Adicionar Conta</span>
                        </div>

                        {bankAccounts.map(acc => (
                            <div className="bg-white dark:bg-card-dark rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 relative z-10 transition-all duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                        <span className="material-symbols-outlined text-2xl">
                                            {acc.name.toLowerCase().includes('caixa') ? 'point_of_sale' : 'account_balance'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">
                                        {acc.type}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{acc.name}</h3>
                                <p className="text-xs text-slate-500 mb-6">Saldo Disponível</p>
                                <p className={`text-3xl font-black ${acc.balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
                                    <PrivacyValue value={formatCurrency(acc.balance)} blurContent={<span className="blur-sm select-none opacity-50">R$ •••••</span>} />
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {viewMode === 'TRANSFERS' && (
                <div className="max-w-xl mx-auto animate-fade-in">
                    <div className="bg-white dark:bg-card-dark rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 relative z-10">
                        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-orange-500">swap_horiz</span>
                                Nova Transferência
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">Mova dinheiro entre suas contas internas (ex: Sangria de caixa).</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4 items-center">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">De (Origem)</label>
                                    <select
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                                        value={transferFrom}
                                        onChange={e => setTransferFrom(e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name} ({privacyMode ? '•••' : formatCurrency(b.balance)})</option>)}
                                    </select>
                                </div>
                                <div className="flex justify-center pt-6">
                                    <span className="material-symbols-outlined text-3xl text-slate-300">arrow_right_alt</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Para (Destino)</label>
                                <select
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                                    value={transferTo}
                                    onChange={e => setTransferTo(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    {bankAccounts.filter(b => b.id !== transferFrom).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Valor (R$)</label>
                                <input
                                    type="number"
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-2xl font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="0,00"
                                    value={transferAmount}
                                    onChange={e => setTransferAmount(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleConfirmTransfer}
                                disabled={!transferFrom || !transferTo || !transferAmount}
                                className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirmar Transferência
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'TRANSACTIONS' && (
                <div className="flex flex-col gap-6 animate-fade-in">
                    {/* Financial Health Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-6 rounded-xl bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                    A Pagar (Pendente)
                                    <HelpTip content="Contas lançadas mas ainda não pagas. Mantenha isso baixo." />
                                </p>
                                <h3 className="text-2xl font-black text-red-600">
                                    {privacyMode ? <span className="blur-sm select-none opacity-50">R$ •••••</span> : formatCurrency(financialState.pendingExpense)}
                                </h3>
                            </div>
                        </div>
                        <div className="p-6 rounded-xl bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                    A Receber (Pendente)
                                    <HelpTip content="Vendas ou receitas futuras que ainda não caíram na conta." />
                                </p>
                                <h3 className="text-2xl font-black text-green-600">
                                    {privacyMode ? <span className="blur-sm select-none opacity-50">R$ •••••</span> : formatCurrency(financialState.pendingIncome)}
                                </h3>
                            </div>
                        </div>
                        <div className="p-6 rounded-xl bg-primary text-white shadow-2xl relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-xs font-bold text-orange-100 uppercase flex items-center gap-1">
                                    Saldo Geral
                                    <HelpTip content="A soma de todas as suas contas bancárias e caixas." className="text-white/70 hover:text-white" />
                                </p>
                                <h3 className="text-2xl font-black">
                                    {privacyMode ? <span className="blur-sm select-none opacity-50">R$ •••••</span> : formatCurrency(financialState.balance)}
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* Filter & List */}
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                        <div className="flex flex-col sm:flex-row border-b border-slate-200 dark:border-slate-800">
                            <div className="flex p-2 gap-1 bg-slate-50 dark:bg-slate-900/50 flex-1 overflow-x-auto">
                                <button onClick={() => setStatusFilter('PENDING')} className={`px-4 py-2 rounded-lg text-sm font-bold ${statusFilter === 'PENDING' ? 'bg-white dark:bg-card-dark shadow text-primary' : 'text-slate-500'}`}>A Vencer</button>
                                <button onClick={() => setStatusFilter('OVERDUE')} className={`px-4 py-2 rounded-lg text-sm font-bold ${statusFilter === 'OVERDUE' ? 'bg-white dark:bg-card-dark shadow text-red-500' : 'text-slate-500'}`}>Atrasado</button>
                                <button onClick={() => setStatusFilter('COMPLETED')} className={`px-4 py-2 rounded-lg text-sm font-bold ${statusFilter === 'COMPLETED' ? 'bg-white dark:bg-card-dark shadow text-green-600' : 'text-slate-500'}`}>Realizado</button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4">Vencimento</th>
                                        <th className="px-6 py-4">Descrição</th>
                                        <th className="px-6 py-4 text-center">Tipo</th>
                                        <th className="px-6 py-4 text-right">Valor</th>
                                        <th className="px-6 py-4 text-center">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {displayTransactions.map(t => (
                                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className={`font-bold text-sm ${new Date(t.date) < today && statusFilter !== 'COMPLETED' ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {new Date(t.date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">{t.description}</p>
                                                <p className="text-xs text-slate-500">{t.category}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${t.type === TransactionType.INCOME ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {t.type === TransactionType.INCOME ? 'Receita' : 'Despesa'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                                                {privacyMode ? 'R$ •••••' : formatCurrency(t.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {statusFilter !== 'COMPLETED' && (
                                                    <button
                                                        onClick={() => { setSettleTx(t); setSettleAccountId(''); }}
                                                        className="text-primary hover:text-blue-600 font-bold text-xs bg-primary/10 px-3 py-1.5 rounded-lg transition-colors hover:bg-primary/20"
                                                    >
                                                        Baixar
                                                    </button>
                                                )}
                                                {statusFilter === 'COMPLETED' && t.bankAccountId && (
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {bankAccounts.find(b => b.id === t.bankAccountId)?.name || 'Conta Excluída'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Settle Modal */}
            {settleTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-card-dark w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-zoom-in">
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">Confirmar {settleTx.type === 'INCOME' ? 'Recebimento' : 'Pagamento'}</h3>
                            <p className="text-xs text-slate-500">Onde o dinheiro {settleTx.type === 'INCOME' ? 'entrou' : 'saiu'}?</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Valor</p>
                                <p className={`text-2xl font-black ${settleTx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                    {privacyMode ? 'R$ •••••' : formatCurrency(settleTx.amount)}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Selecionar Conta / Caixa</label>
                                <select
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                                    value={settleAccountId}
                                    onChange={(e) => setSettleAccountId(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setSettleTx(null)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancelar</button>
                                <button onClick={handleConfirmSettle} disabled={!settleAccountId} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50">Confirmar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
