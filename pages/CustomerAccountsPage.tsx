
import React, { useState } from 'react';
import { usePrivacy } from '../contexts/PrivacyContext';
import { PrivacyToggle } from '../components/PrivacyToggle';
import { PrivacyValue } from '../components/PrivacyValue';
import { CustomerAccount, CustomerAccountItem, PaymentMethod } from '../types';

interface CustomerAccountsPageProps {
    accounts: CustomerAccount[];
    onAddAccount: (name: string, phone: string) => void;
    onAddItem: (accountId: string, item: Omit<CustomerAccountItem, 'id' | 'date'>) => void;
    onSettleAccount: (accountId: string, method: PaymentMethod) => void;
    onDeleteAccount: (accountId: string) => void;
}

export const CustomerAccountsPage: React.FC<CustomerAccountsPageProps> = ({ accounts, onAddAccount, onAddItem, onSettleAccount, onDeleteAccount }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const selectedAccount = accounts.find(a => a.id === selectedAccountId) || null;

    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountPhone, setNewAccountPhone] = useState('');

    // Add Item Form
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemAmount, setNewItemAmount] = useState('');
    const [newItemType, setNewItemType] = useState<'DEBT' | 'CREDIT'>('DEBT'); // Toggle for Credit/Debt

    const { privacyMode } = usePrivacy();

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const handleCreateAccount = () => {
        if (!newAccountName) return;
        onAddAccount(newAccountName, newAccountPhone);
        setIsCreateModalOpen(false);
        setNewAccountName('');
        setNewAccountPhone('');
    };

    const handleAddItem = () => {
        if (!selectedAccountId || !newItemDesc || !newItemAmount) return;

        let amount = parseFloat(newItemAmount);

        // If type is CREDIT, amount should be negative (subtract from debt)
        if (newItemType === 'CREDIT') {
            amount = -Math.abs(amount);
        } else {
            amount = Math.abs(amount);
        }

        onAddItem(selectedAccountId, {
            description: newItemDesc + (newItemType === 'CREDIT' ? ' (Crédito)' : ''),
            amount: amount
        });

        setIsAddItemModalOpen(false);
        setNewItemDesc('');
        setNewItemAmount('');
        setNewItemType('DEBT');
    };

    const handleSelectPaymentMethod = (method: PaymentMethod) => {
        if (selectedAccountId) {
            onSettleAccount(selectedAccountId, method);
            setIsSettleModalOpen(false);
        }
    };

    // Calculate totals
    const totalReceivable = accounts.reduce((sum, acc) => sum + (acc.balance > 0 ? acc.balance : 0), 0);
    const activeAccounts = accounts.filter(acc => acc.balance > 0).length;

    return (
        <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-[1200px] w-full mx-auto pb-32">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight flex items-center gap-3">
                        Crediário

                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base">Gerencie as contas e o crediário da sua loja.</p>
                </div>
                <div className="flex items-center gap-2">
                    <PrivacyToggle className="flex items-center justify-center w-10 h-10 bg-white dark:bg-card-dark text-slate-400 hover:text-primary border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm" />
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
                    >
                        <span className="material-symbols-outlined">person_add</span>
                        Novo Cliente
                    </button>
                </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-bold uppercase text-slate-400 mb-1">Total a Receber</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                        <PrivacyValue value={formatCurrency(totalReceivable)} blurContent={<span className="blur-sm select-none opacity-50">R$ •••••</span>} />
                    </p>
                </div>
                <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-bold uppercase text-slate-400 mb-1">Contas Ativas</p>
                    <p className="text-3xl font-black text-primary">{activeAccounts}</p>
                </div>
            </div>

            {/* Accounts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.length === 0 ? (
                    <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700 mb-4">assignment_ind</span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhuma conta ativa</h3>
                        <p className="text-slate-500 mb-4">Adicione clientes para começar a registrar compras no crediário.</p>
                    </div>
                ) : (
                    accounts.map(account => (
                        <div key={account.id} className="bg-white dark:bg-card-dark rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group animate-fade-in-up">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold border border-slate-200 dark:border-slate-700">
                                        {account.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{account.name}</h3>
                                        <p className="text-xs text-slate-500">{account.phone || 'Sem telefone'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase">
                                        {account.balance < 0 ? 'Crédito' : 'Saldo Devedor'}
                                    </p>
                                    <p className={`text-lg font-black ${account.balance > 0 ? 'text-red-600' : (account.balance < 0 ? 'text-green-600' : 'text-slate-400')}`}>
                                        <PrivacyValue value={formatCurrency(Math.abs(account.balance))} blurContent="R$ •••••" />
                                    </p>
                                </div>
                            </div>

                            {/* Items Preview */}
                            <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-4 overflow-y-auto max-h-[150px]">
                                {account.items.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center italic py-2">Nenhum item pendente</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {account.items.map(item => (
                                            <li key={item.id} className="flex justify-between text-sm">
                                                <span className="text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{item.description}</span>
                                                <span className={`font-bold ${item.amount < 0 ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
                                                    <PrivacyValue value={(item.amount < 0 ? '+' : '') + formatCurrency(Math.abs(item.amount))} blurContent="•••" />
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="bg-white dark:bg-card-dark rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                <button
                                    onClick={() => { setSelectedAccountId(account.id); setIsAddItemModalOpen(true); setNewItemType('DEBT'); }}
                                    className="flex-1 py-2 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-bold flex items-center justify-center gap-1 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">edit_square</span>
                                    Lançar
                                </button>
                                <button
                                    onClick={() => { setSelectedAccountId(account.id); setIsSettleModalOpen(true); }}
                                    disabled={account.balance <= 0}
                                    className="flex-1 py-2 bg-transparent hover:bg-green-50 dark:hover:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-lg text-sm font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-sm">payments</span>
                                    Receber
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteAccount(account.id); }}
                                    className="p-2 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                                    title="Excluir Cliente"
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Account Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white dark:bg-card-dark p-6 rounded-xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 animate-zoom-in">
                        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Novo Cliente</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nome</label>
                                <input type="text" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={newAccountName} onChange={e => setNewAccountName(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Telefone</label>
                                <input type="text" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={newAccountPhone} onChange={e => setNewAccountPhone(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button>
                            <button onClick={handleCreateAccount} className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg">Criar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Item Modal */}
            {isAddItemModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white dark:bg-card-dark p-6 rounded-xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 animate-zoom-in">
                        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Lançar na Conta</h3>
                        <p className="text-sm text-slate-500 mb-4">Cliente: <b>{selectedAccount?.name}</b></p>

                        {/* Type Toggle */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-4">
                            <button
                                onClick={() => setNewItemType('DEBT')}
                                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${newItemType === 'DEBT' ? 'bg-white dark:bg-card-dark text-red-600 shadow-sm' : 'text-slate-400'}`}
                            >
                                Dívida (Compra)
                            </button>
                            <button
                                onClick={() => setNewItemType('CREDIT')}
                                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${newItemType === 'CREDIT' ? 'bg-white dark:bg-card-dark text-green-600 shadow-sm' : 'text-slate-400'}`}
                            >
                                Crédito (Abater)
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Descrição</label>
                                <input type="text" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} placeholder={newItemType === 'DEBT' ? "Ex: 2 Coca-Colas" : "Ex: Pagamento Parcial"} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Valor (R$)</label>
                                <input type="number" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={newItemAmount} onChange={e => setNewItemAmount(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsAddItemModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button>
                            <button onClick={handleAddItem} className={`px-4 py-2 text-sm font-bold text-white rounded-lg ${newItemType === 'DEBT' ? 'bg-red-600' : 'bg-green-600'}`}>
                                {newItemType === 'DEBT' ? 'Adicionar Dívida' : 'Adicionar Crédito'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settle Modal */}
            {isSettleModalOpen && selectedAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
                    <div className="bg-white dark:bg-card-dark p-6 rounded-xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 animate-zoom-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Receber Conta</h3>
                            <button onClick={() => setIsSettleModalOpen(false)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
                        </div>

                        <div className="text-center mb-8">
                            <p className="text-sm text-slate-500 mb-1">Total a Pagar por {selectedAccount.name}</p>
                            <p className="text-4xl font-black text-slate-900 dark:text-white">
                                {privacyMode ? 'R$ •••••' : formatCurrency(selectedAccount.balance)}
                            </p>
                        </div>

                        <p className="text-xs font-bold text-slate-400 uppercase text-center mb-4">Selecione como recebeu</p>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleSelectPaymentMethod('Pix')} className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-3xl">qr_code_2</span>
                                <span className="font-bold">Pix</span>
                            </button>
                            <button onClick={() => handleSelectPaymentMethod('Dinheiro')} className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-3xl">payments</span>
                                <span className="font-bold">Dinheiro</span>
                            </button>
                            <button onClick={() => handleSelectPaymentMethod('Crédito')} className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-3xl">credit_card</span>
                                <span className="font-bold">Crédito</span>
                            </button>
                            <button onClick={() => handleSelectPaymentMethod('Débito')} className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-3xl">credit_card</span>
                                <span className="font-bold">Débito</span>
                            </button>
                        </div>
                        <p className="text-xs text-center text-slate-400 mt-6">O recebimento será registrado e o saldo do cliente zerado.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
