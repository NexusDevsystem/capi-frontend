
import React, { useState, useMemo, useEffect } from 'react';
import { usePrivacy } from '../contexts/PrivacyContext';
import { PrivacyToggle } from '../components/PrivacyToggle';
import { PrivacyValue } from '../components/PrivacyValue';
import { Transaction, FinancialSummary, TransactionType, AiInsightResponse, User } from '../types';
import { generateFinancialInsight } from '../services/geminiService';
import { generateMonthlyReportPDF } from '../services/pdfService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

interface ReportsPageProps {
    transactions: Transaction[];
    summary: FinancialSummary;
    storeName: string;
    team?: User[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ transactions, summary, storeName, team = [] }) => {
    const [aiInsight, setAiInsight] = useState<AiInsightResponse | null>(null);
    const [loading, setLoading] = useState(false);

    // Default to current month, but allow user selection
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    // Privacy Mode (Persisted)
    const { privacyMode } = usePrivacy();

    // Filter transactions by selected month
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => t.date.startsWith(selectedMonth));
    }, [transactions, selectedMonth]);

    // Calculate Summary specific to the selected Month
    const monthlySummary = useMemo(() => {
        let revenue = 0;
        let expenses = 0;

        filteredTransactions.forEach(t => {
            if (t.type === TransactionType.INCOME) revenue += t.amount;
            else expenses += t.amount;
        });

        return {
            revenue,
            expenses,
            profit: revenue - expenses
        };
    }, [filteredTransactions]);

    // --- Chart 1: Daily Trend (For Selected Month) ---
    const trendData = useMemo(() => {
        const dataMap = new Map();
        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();

        // Initialize all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = new Date(year, month - 1, i).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            dataMap.set(dateStr, { date: dateStr, receitas: 0, despesas: 0 });
        }

        filteredTransactions.forEach(t => {
            const date = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            if (dataMap.has(date)) {
                const entry = dataMap.get(date);
                if (t.type === TransactionType.INCOME) entry.receitas += t.amount;
                else entry.despesas += t.amount;
            }
        });
        return Array.from(dataMap.values());
    }, [filteredTransactions, selectedMonth]);

    // --- Chart 2: Revenue Composition by Category (Horizontal Bar) ---
    const revenueByCategory = useMemo(() => {
        const catMap: Record<string, number> = {};
        filteredTransactions
            .filter(t => t.type === TransactionType.INCOME)
            .forEach(t => {
                const cat = t.category || 'Outros';
                catMap[cat] = (catMap[cat] || 0) + t.amount;
            });

        return Object.entries(catMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 categories
    }, [filteredTransactions]);

    // --- Chart 3: Expense Categories (Pie) ---
    const expenseCategoryData = useMemo(() => {
        const catMap: Record<string, number> = {};
        filteredTransactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .forEach(t => {
                catMap[t.category] = (catMap[t.category] || 0) + t.amount;
            });

        return Object.entries(catMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 only
    }, [filteredTransactions]);

    // --- Chart 4: Payment Methods (Donut) ---
    const paymentData = useMemo(() => {
        const payMap: Record<string, number> = {};
        filteredTransactions
            .filter(t => t.type === TransactionType.INCOME)
            .forEach(t => {
                const method = t.paymentMethod || 'OUTRO';
                payMap[method] = (payMap[method] || 0) + t.amount;
            });

        return Object.entries(payMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredTransactions]);

    const COLORS_EXPENSES = ['#EF4444', '#F59E0B', '#ea580c', '#8B5CF6', '#64748B'];
    const COLORS_PAYMENTS = ['#10B981', '#3B82F6', '#6366F1', '#EC4899', '#F59E0B', '#94A3B8'];

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const handleGenerateInsight = async () => {
        setLoading(true);
        const response = await generateFinancialInsight(filteredTransactions);
        setAiInsight(response);
        setLoading(false);
    };

    const handleExportPDF = () => {
        generateMonthlyReportPDF({ ...summary, ...monthlySummary } as FinancialSummary, filteredTransactions, selectedMonth, storeName);
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth bg-slate-50 dark:bg-background-dark pb-32">
            <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight flex items-center gap-3">
                            Relatórios & Insights

                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-base">Visão estratégica instantânea do seu negócio.</p>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto items-center">
                        <PrivacyToggle className="flex items-center justify-center w-12 h-12 bg-white dark:bg-slate-900 text-slate-400 hover:text-primary border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-primary shadow-sm"
                        />

                        <button
                            onClick={handleExportPDF}
                            className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
                        >
                            <span className="material-symbols-outlined">picture_as_pdf</span>
                            <span className="hidden sm:inline">Baixar PDF</span>
                        </button>

                        <button
                            onClick={handleGenerateInsight}
                            disabled={loading || filteredTransactions.length === 0}
                            className={`
                                flex-1 md:w-auto flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-xl shadow-lg transition-all
                                ${aiInsight
                                    ? 'bg-slate-200 text-slate-600 cursor-default'
                                    : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white hover:scale-105 active:scale-95 disabled:opacity-50'
                                }
                            `}
                        >
                            {loading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    <span>Analisando...</span>
                                </>
                            ) : aiInsight ? (
                                <>
                                    <span className="material-symbols-outlined text-[20px]">check</span>
                                    <span>Análise Completa</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[20px]">psychology</span>
                                    <span>Gerar Diagnóstico IA</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
                    <ReportCard
                        title="Receita Mensal"
                        value={<PrivacyValue value={formatCurrency(monthlySummary.revenue)} blurContent={<span className="blur-sm select-none opacity-50">R$ •••••</span>} />}
                        icon="trending_up"
                        color="green"
                        subtext={new Date(selectedMonth + '-02').toLocaleString('pt-BR', { month: 'long' })}
                    />
                    <ReportCard
                        title="Despesas Mensal"
                        value={<PrivacyValue value={formatCurrency(monthlySummary.expenses)} blurContent={<span className="blur-sm select-none opacity-50">R$ •••••</span>} />}
                        icon="trending_down"
                        color="red"
                        subtext={new Date(selectedMonth + '-02').toLocaleString('pt-BR', { month: 'long' })}
                    />
                    <ReportCard
                        title="Resultado Mensal"
                        value={<PrivacyValue value={formatCurrency(monthlySummary.profit)} blurContent={<span className="blur-sm select-none opacity-50">R$ •••••</span>} />}
                        icon="wallet"
                        color={monthlySummary.profit >= 0 ? "blue" : "red"}
                        subtext="Lucro/Prejuízo"
                    />
                    <ReportCard
                        title="Margem Líquida"
                        value={<PrivacyValue value={(monthlySummary.revenue ? ((monthlySummary.profit / monthlySummary.revenue) * 100) : 0).toFixed(1) + '%'} blurContent={<span className="blur-sm select-none opacity-50">•••%</span>} />}
                        icon="pie_chart"
                        color="orange"
                        subtext="Rentabilidade"
                    />
                </div>

                {/* AI Analysis Section */}
                {(loading || aiInsight) && (
                    <div className="animate-fade-in-up bg-white dark:bg-card-dark rounded-2xl border border-orange-100 dark:border-orange-900/30 shadow-2xl overflow-hidden ring-1 ring-orange-500/10">
                        <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shadow-inner">
                                <span className="material-symbols-outlined text-white text-3xl">auto_awesome</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-black text-2xl">
                                    {loading ? "Processando Inteligência..." : aiInsight?.title}
                                </h3>
                                <p className="text-orange-100 text-sm opacity-90">Relatório Estratégico do CFO Virtual para {new Date(selectedMonth + '-02').toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {loading ? (
                                <>
                                    <div className="space-y-3">
                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Resumo Executivo
                                            </h4>
                                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                                {aiInsight?.executiveSummary}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span> Tendência
                                            </h4>
                                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                                                {aiInsight?.trendAnalysis}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-red-500"></span> Análise de Custos
                                            </h4>
                                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                                                {aiInsight?.expenseAnalysis}
                                            </p>
                                        </div>
                                        <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30">
                                            <h4 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm">lightbulb</span> Recomendação Tática
                                            </h4>
                                            <p className="text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
                                                {aiInsight?.recommendation}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* --- Charts --- */}

                {/* Row 1: Trends & Category Revenue */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

                    {/* Bar Chart - Daily Trend */}
                    <div className="lg:col-span-2 bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-orange-500">show_chart</span>
                            Fluxo Diário ({new Date(selectedMonth + '-02').toLocaleString('pt-BR', { month: 'long' })})
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(val) => `R$${val}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        formatter={(val: number) => <PrivacyValue value={formatCurrency(val)} blurContent="R$ •••" />}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Area type="monotone" dataKey="receitas" name="Receita" stroke="#10B981" fillOpacity={1} fill="url(#colorReceita)" strokeWidth={3} />
                                    <Area type="monotone" dataKey="despesas" name="Despesa" stroke="#EF4444" fillOpacity={1} fill="url(#colorDespesa)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Horizontal Bar - Revenue by Category */}
                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-orange-500">category</span>
                            Fontes de Receita
                        </h3>
                        <p className="text-xs text-slate-500 mb-6">Categorias mais lucrativas</p>

                        <div className="flex-1 w-full min-h-[220px]">
                            {revenueByCategory.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={revenueByCategory} margin={{ top: 0, right: 30, left: 20, bottom: 5 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: '#64748B' }} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            formatter={(val: number) => <PrivacyValue value={formatCurrency(val)} blurContent="R$ •••" />}
                                        />
                                        <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 opacity-60">
                                    <p className="text-xs">Sem dados de venda</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Row 2: Payment Methods & Expenses Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-orange-500">payments</span>
                            Meios de Recebimento
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">Como seus clientes pagam</p>
                        <div className="h-[250px] w-full relative">
                            {paymentData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={paymentData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {paymentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS_PAYMENTS[index % COLORS_PAYMENTS.length]} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            formatter={(val: number) => <PrivacyValue value={formatCurrency(val)} blurContent="R$ •••" />}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm flex-col">
                                    <span className="material-symbols-outlined text-3xl mb-2 opacity-50">money_off</span>
                                    Sem dados de vendas
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-500">pie_chart</span>
                            Onde Gastei?
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">Top categorias de despesa</p>
                        <div className="h-[250px] w-full relative flex items-center justify-center">
                            {expenseCategoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={expenseCategoryData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {expenseCategoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS_EXPENSES[index % COLORS_EXPENSES.length]} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            formatter={(val: number) => <PrivacyValue value={formatCurrency(val)} blurContent="R$ •••" />}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-slate-400 text-sm flex flex-col items-center">
                                    <span className="material-symbols-outlined text-3xl opacity-50 mb-2">data_usage</span>
                                    Sem despesas
                                </div>
                            )}
                        </div>
                    </div>
                </div>



                {/* --- Advanced Reports Section --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>

                    {/* Top Products */}
                    <ReportTableCard
                        title="Produtos Mais Vendidos"
                        icon="inventory_2"
                        headers={['Produto', 'Qtd', 'Receita']}
                        data={useMemo(() => {
                            const map = new Map();
                            filteredTransactions.filter(t => t.type === TransactionType.INCOME).forEach(t => {
                                t.items?.forEach(i => {
                                    const key = i.productName;
                                    const curr = map.get(key) || { name: key, qtd: 0, total: 0 };
                                    curr.qtd += i.quantity;
                                    curr.total += i.total;
                                    map.set(key, curr);
                                });
                            });
                            return Array.from(map.values())
                                .sort((a, b) => b.total - a.total)
                                .slice(0, 5)
                                .map(i => [i.name, i.qtd, <PrivacyValue value={formatCurrency(i.total)} blurContent="R$ •••" />]);
                        }, [filteredTransactions])}
                    />

                    {/* Top Customers */}
                    <ReportTableCard
                        title="Melhores Clientes"
                        icon="person_star"
                        headers={['Cliente', 'Compras', 'Total']}
                        data={useMemo(() => {
                            const map = new Map();
                            filteredTransactions.filter(t => t.type === TransactionType.INCOME && t.entity !== 'Consumidor Final').forEach(t => {
                                const key = t.entity;
                                const curr = map.get(key) || { name: key, count: 0, total: 0 };
                                curr.count += 1;
                                curr.total += t.amount;
                                map.set(key, curr);
                            });
                            return Array.from(map.values())
                                .sort((a, b) => b.total - a.total)
                                .slice(0, 5)
                                .map(i => [i.name, i.count, formatCurrency(i.total)]);
                        }, [filteredTransactions])}
                    />

                    {/* Sales by Seller */}
                    <ReportTableCard
                        title="Vendas por Vendedor"
                        icon="badge"
                        headers={['Vendedor', 'Transações', 'Receita']}
                        data={useMemo(() => {
                            const map = new Map();
                            filteredTransactions.filter(t => t.type === TransactionType.INCOME).forEach(t => {
                                const sellerName = team.find(u => u.id === t.userId)?.name || t.userId || 'Sistema'; // Fallback
                                const curr = map.get(sellerName) || { name: sellerName, count: 0, total: 0 };
                                curr.count += 1;
                                curr.total += t.amount;
                                map.set(sellerName, curr);
                            });
                            return Array.from(map.values())
                                .sort((a, b) => b.total - a.total)
                                .slice(0, 5)
                                .map(i => [i.name, i.count, <PrivacyValue value={formatCurrency(i.total)} blurContent="R$ •••" />]);
                        }, [filteredTransactions, team])}
                    />

                    {/* Returns/Cancellations Placeholder */}
                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-center items-center opacity-60">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">assignment_return</span>
                        <h3 className="font-bold text-slate-500">Devoluções</h3>
                        <p className="text-xs text-slate-400">Nenhuma devolução registrada no período.</p>
                    </div>

                </div>

            </div>

        </div>
    );
};

const ReportTableCard = ({ title, icon, headers, data }: any) => (
    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col h-full">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">{icon}</span>
            </div>
            {title}
        </h3>

        <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <tr>
                        {headers.map((h: string, i: number) => (
                            <th key={i} className="px-4 py-3 font-bold rounded-t-lg first:rounded-l-lg last:rounded-r-lg">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.length > 0 ? data.map((row: any[], i: number) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            {row.map((cell: any, j: number) => (
                                <td key={j} className={`px-4 py-3 ${j === 0 ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={headers.length} className="px-4 py-8 text-center text-slate-400 text-xs">
                                Sem dados para exibir
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const ReportCard = ({ title, value, icon, color, subtext }: any) => {

    // Privacy is handled by the passed 'value' node (PrivacyValue component)

    const colorClasses: any = {
        green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        red: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    };

    return (
        <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-1">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</p>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                    {value}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium uppercase">{subtext}</p>
            </div>
        </div>
    );
};
