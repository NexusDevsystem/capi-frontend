
import React, { useState, useEffect } from 'react';
import { User, PlatformInvoice } from '../types';
import { SubscriptionReceiptModal } from '../components/SubscriptionReceiptModal';

interface ProfilePageProps {
    user: User;
    onUpdateUser: (updatedUser: User) => void;
    onLogout: () => void;
    onGoToPayment?: () => void;
    initialTab?: 'PERSONAL' | 'BILLING';
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateUser, onLogout, onGoToPayment, initialTab = 'PERSONAL' }) => {
    const [tab, setTab] = useState<'PERSONAL' | 'BILLING'>(initialTab);
    const [formData, setFormData] = useState<User>(user);
    const [isSaved, setIsSaved] = useState(false);
    
    // State para o modal de recibo
    const [selectedInvoice, setSelectedInvoice] = useState<PlatformInvoice | null>(null);

    // Helpers de Permissão
    const isAdminOrManager = user.role === 'Administrador' || user.role === 'Gerente';

    // Atualiza a aba se a navegação mudar externamente (ex: clicando no menu lateral)
    useEffect(() => {
        // Se tentar acessar billing sem permissão, volta para personal
        if (initialTab === 'BILLING' && !isAdminOrManager) {
            setTab('PERSONAL');
        } else {
            setTab(initialTab);
        }
    }, [initialTab, isAdminOrManager]);

    useEffect(() => { setFormData(user); }, [user]);

    const handleSave = () => {
        onUpdateUser(formData);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatDate = (dateStr?: string) => dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : '---';

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-10 max-w-[1000px] w-full mx-auto pb-32">
            
            {/* Modal de Comprovante */}
            {selectedInvoice && (
                <SubscriptionReceiptModal 
                    invoice={selectedInvoice} 
                    user={user} 
                    onClose={() => setSelectedInvoice(null)} 
                />
            )}

            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight mb-2">Configurações da Conta</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base">Gerencie seus dados pessoais.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto">
                    <button onClick={() => setTab('PERSONAL')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'PERSONAL' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-500'}`}>Perfil</button>
                    
                    {isAdminOrManager && (
                        <button onClick={() => setTab('BILLING')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'BILLING' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-500'}`}>Assinatura & Faturamento</button>
                    )}
                </div>
            </header>

            {tab === 'PERSONAL' ? (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white dark:bg-card-dark rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="flex flex-col items-center gap-4 shrink-0">
                                <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-4 border-white dark:border-slate-700 shadow-xl relative group">
                                    <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-primary/10 text-primary uppercase tracking-widest">{user.role}</span>
                            </div>

                            <div className="flex-1 w-full space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome Completo</label>
                                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Email</label>
                                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">WhatsApp / Telefone</label>
                                        <input type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">CPF / CNPJ</label>
                                        <input type="text" value={formData.taxId || ''} onChange={e => setFormData({...formData, taxId: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-primary" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-4">
                                    {isSaved && <span className="text-green-500 font-bold text-sm flex items-center gap-1"><span className="material-symbols-outlined text-lg">check_circle</span> Salvo!</span>}
                                    <button onClick={handleSave} className="ml-auto px-8 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-orange-500/20">Salvar Perfil</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-3xl border border-red-100 dark:border-red-900/20 flex flex-col md:flex-row justify-between items-center gap-4">
                         <div>
                             <h4 className="font-bold text-red-700 dark:text-red-400">Zona de Perigo</h4>
                             <p className="text-sm text-red-600/70">Encerrar sua sessão neste dispositivo.</p>
                         </div>
                         <button onClick={onLogout} className="px-6 py-2 bg-white dark:bg-slate-800 text-red-600 rounded-xl font-bold border border-red-200 hover:bg-red-50 transition-colors">Sair da Conta</button>
                    </div>
                </div>
            ) : (
                isAdminOrManager ? (
                    <div className="space-y-6 animate-fade-in">
                        {/* Active Plan Card */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-black dark:to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                            
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <span className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-4 inline-block">Plano Atual</span>
                                    <h2 className="text-4xl font-black mb-1">CAPI Pro</h2>
                                    <p className="text-slate-400 text-sm font-medium">Acesso total a todas as ferramentas de IA e Gestão.</p>
                                </div>
                                <div className="text-left md:text-right">
                                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Status da Assinatura</p>
                                    <div className="flex items-center gap-2 md:justify-end">
                                        <div className={`w-2.5 h-2.5 rounded-full ${user.subscriptionStatus === 'ACTIVE' ? 'bg-green-500 animate-pulse' : user.subscriptionStatus === 'TRIAL' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                                        <span className="text-xl font-black uppercase tracking-tight">
                                            {user.subscriptionStatus === 'ACTIVE' ? 'Ativa' : user.subscriptionStatus === 'TRIAL' ? 'Período de Teste' : 'Pendente'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/10 relative z-10">
                                <div>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Próxima Cobrança</p>
                                    <p className="text-lg font-bold">{user.subscriptionStatus === 'TRIAL' ? formatDate(user.trialEndsAt) : formatDate(user.nextBillingAt)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Valor Mensal</p>
                                    <p className="text-lg font-bold">{formatCurrency(49.90)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Método Padrão</p>
                                    <p className="text-lg font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">qr_code_2</span>
                                        Pix / Checkout
                                    </p>
                                </div>
                            </div>

                            {user.subscriptionStatus !== 'ACTIVE' && (
                                <button 
                                    onClick={onGoToPayment}
                                    className="mt-8 w-full py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5"
                                >
                                    <span className="material-symbols-outlined">bolt</span>
                                    Ativar Assinatura Definitiva
                                </button>
                            )}
                        </div>

                        {/* Invoice History (REAL DATA) */}
                        <div className="bg-white dark:bg-card-dark rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-slate-400">history_edu</span>
                                    Histórico de Faturas
                                </h3>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                                            <th className="px-6 py-4">Data</th>
                                            <th className="px-6 py-4">Identificador</th>
                                            <th className="px-6 py-4 text-right">Valor</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                            <th className="px-6 py-4 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {user.invoices && user.invoices.length > 0 ? user.invoices.map((inv) => (
                                            <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">{formatDate(inv.date)}</td>
                                                <td className="px-6 py-4 text-xs font-mono text-slate-400">{inv.id}</td>
                                                <td className="px-6 py-4 text-sm font-black text-right text-slate-900 dark:text-white">{formatCurrency(inv.amount)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${inv.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
                                                        {inv.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => setSelectedInvoice(inv)}
                                                        className="text-slate-400 hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto text-xs font-bold uppercase group"
                                                    >
                                                        <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">receipt_long</span>
                                                        Ver Ticket
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">Nenhuma fatura registrada. Ative seu plano para ver o histórico.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">lock</span>
                        <p>Apenas gerentes e administradores podem ver informações de faturamento da loja.</p>
                    </div>
                )
            )}
        </div>
    );
};
