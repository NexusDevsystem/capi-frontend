
import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { useStore } from '../contexts/StoreContext';

export const UsersPage: React.FC<{ users: User[], currentUser: User, onRefresh?: () => void }> = ({ users, currentUser, onRefresh }) => {
    const { activeStore } = useStore();
    const [isHireModalOpen, setIsHireModalOpen] = useState(false);
    const [hireEmail, setHireEmail] = useState('');
    const [hireRole, setHireRole] = useState<'Vendedor' | 'Gerente' | 'Técnico'>('Vendedor');
    const [hireLoading, setHireLoading] = useState(false);
    const [hireError, setHireError] = useState('');
    const [hireSuccess, setHireSuccess] = useState('');

    const handleHire = async () => {
        if (!hireEmail) return;
        setHireLoading(true);
        setHireError('');
        setHireSuccess('');

        try {
            if (!activeStore?.storeId) throw new Error("Erro de permissão: Você não tem uma loja.");
            await authService.hireEmployee(activeStore.storeId, hireEmail, hireRole);
            setHireSuccess(`Usuário ${hireEmail} contratado com sucesso!`);
            setHireEmail('');

            // Refresh logic - if supported, use instant refresh, otherwise fallback to reload
            if (onRefresh) {
                onRefresh();
                setTimeout(() => {
                    setIsHireModalOpen(false);
                    setHireSuccess('');
                }, 1500);
            } else {
                setTimeout(() => {
                    setIsHireModalOpen(false);
                    window.location.reload();
                }, 1500);
            }
        } catch (e: any) {
            setHireError(e.message);
        } finally {
            setHireLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-8">
            <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-[#111418] dark:text-white text-3xl font-black leading-tight">Equipe</h1>
                        <p className="text-[#617589] dark:text-gray-400 text-base font-normal">Gerencie quem tem acesso à sua loja.</p>
                    </div>
                    <button
                        onClick={() => setIsHireModalOpen(true)}
                        className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105"
                    >
                        <span className="material-symbols-outlined">person_add</span>
                        Adicionar Membro
                    </button>
                </header>

                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-[#e5e7eb] dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#e5e7eb] dark:border-gray-700 bg-[#f9fafb] dark:bg-gray-800/50">
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#617589] dark:text-gray-400">Usuário</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#617589] dark:text-gray-400">Email</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#617589] dark:text-gray-400">Função</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#617589] dark:text-gray-400">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e7eb] dark:divide-gray-700">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-[#f0f2f4] dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="text-[#111418] dark:text-white text-sm font-bold">{user.name}</p>
                                                    <p className="text-[#617589] dark:text-gray-400 text-xs font-normal">ID: {user.id.slice(-4)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'Administrador' || user.role === 'Proprietário' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'Gerente' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-slate-100 text-slate-800'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                <span className="text-sm text-[#111418] dark:text-gray-300">{user.status}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && (
                            <div className="p-8 text-center text-slate-500">
                                <p>Sua equipe está vazia. Adicione funcionários pelo email.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hire Modal */}
            {isHireModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-card-dark w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Contratar Funcionário</h3>
                            <button onClick={() => setIsHireModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-slate-500 mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                <strong className="block mb-1 text-blue-700 dark:text-blue-400">Como funciona:</strong>
                                Peça para o funcionário criar uma conta no modo <b>"Sou Funcionário"</b> e informe o email dele abaixo para vinculá-lo à sua loja.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Email do Funcionário</label>
                                    <input
                                        type="email"
                                        className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="email@funcionario.com"
                                        value={hireEmail}
                                        onChange={e => setHireEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Cargo / Função</label>
                                    <select
                                        className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none"
                                        value={hireRole}
                                        onChange={e => setHireRole(e.target.value as any)}
                                    >
                                        <option value="Vendedor">Vendedor</option>
                                        <option value="Gerente">Gerente</option>
                                        <option value="Técnico">Técnico</option>
                                    </select>
                                </div>
                            </div>

                            {hireError && (
                                <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">error</span>
                                    {hireError}
                                </div>
                            )}

                            {hireSuccess && (
                                <div className="mt-4 p-3 bg-green-50 text-green-600 text-xs font-bold rounded-lg border border-green-100 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                    {hireSuccess}
                                </div>
                            )}

                            <button
                                onClick={handleHire}
                                disabled={hireLoading || !hireEmail}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                            >
                                {hireLoading ? 'Buscando...' : 'Adicionar à Equipe'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
