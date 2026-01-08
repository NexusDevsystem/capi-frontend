
import React from 'react';
import { CashClosing } from '../types';
import { generateClosingPDF } from '../services/pdfService';

interface ClosingsHistoryPageProps {
    closings: CashClosing[];
    onDelete: (id: string) => void;
    storeName: string;
}

export const ClosingsHistoryPage: React.FC<ClosingsHistoryPageProps> = ({ closings, onDelete, storeName }) => {

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const handleDownload = (closing: CashClosing) => {
        generateClosingPDF(closing, storeName);
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-[1200px] w-full mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight">Histórico de Fechamentos</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base">Consulte e baixe relatórios de caixas anteriores.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-5 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-bold uppercase text-slate-400 mb-1">Total de Fechamentos</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{closings.length}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                {closings.length === 0 ? (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700 mb-4">receipt_long</span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhum fechamento registrado</h3>
                        <p className="text-slate-500 mb-4">Realize o fechamento diário no Dashboard para ver o histórico aqui.</p>
                        <button className="text-primary font-bold hover:underline" onClick={() => window.location.reload()}>Ir para Dashboard</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Data</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Responsável</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Entradas</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Saídas</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Saldo Final</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {closings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(closing => (
                                    <tr key={closing.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900 dark:text-white">{new Date(closing.date + 'T12:00:00').toLocaleDateString()}</p>
                                            <p className="text-xs text-slate-400">
                                                {new Date(closing.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {closing.closedBy}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(closing.totalRevenue)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-red-600 dark:text-red-400">
                                            {formatCurrency(closing.totalExpense)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-sm font-black px-2 py-1 rounded-lg ${closing.balance >= 0
                                                ? 'bg-blue-50 text-primary dark:bg-blue-900/20 dark:text-blue-400'
                                                : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                                }`}>
                                                {formatCurrency(closing.balance)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleDownload(closing)}
                                                    className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                                                    title="Baixar PDF"
                                                >
                                                    <span className="material-symbols-outlined">description</span>
                                                </button>
                                                <button
                                                    onClick={() => onDelete(closing.id)}
                                                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    title="Excluir Registro"
                                                >
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
