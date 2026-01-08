
import React, { useState, useMemo, useEffect } from 'react';
import { usePrivacy } from '../contexts/PrivacyContext';
import { PrivacyToggle } from '../components/PrivacyToggle';
import { PrivacyValue } from '../components/PrivacyValue';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Transaction, CashClosing, User, TransactionType, PaymentMethod } from '../types';

interface DashboardProps {
    transactions: Transaction[];
    onAddClick: () => void;
    onEditClick: (tx: Transaction) => void;
    onDeleteClick: (id: string) => void;
    closings: CashClosing[];
    onCloseRegister: (closing: CashClosing) => void;
    currentUser: User;
    onPrint?: (tx: Transaction) => void;
    storeName: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, onAddClick, onEditClick, onDeleteClick, closings, onCloseRegister, currentUser, onPrint, storeName }) => {
    const { privacyMode } = usePrivacy();
    const [viewMode, setViewMode] = useState<'DAY' | 'MONTH'>('DAY'); // Padrão: Dia
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // States para o Fechamento de Caixa
    const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
    const [closingNote, setClosingNote] = useState('');


    useEffect(() => {
        // Se houver transações e nenhuma data selecionada via interação, foca no dia mais recente
        if (transactions.length > 0 && !sessionStorage.getItem('dashboard_date_set')) {
            const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            // Mantém a data atual se houver transações hoje, senão pega a última
            const lastTxDate = new Date(sorted[0].date);
            const today = new Date();
            if (lastTxDate.toDateString() !== today.toDateString() && viewMode === 'DAY') {
                // Opcional: setSelectedDate(lastTxDate); 
            }
        }
    }, [transactions.length]);

    const handlePrev = () => {
        const newDate = new Date(selectedDate);
        if (viewMode === 'DAY') newDate.setDate(newDate.getDate() - 1);
        else newDate.setMonth(newDate.getMonth() - 1);
        setSelectedDate(newDate);
        sessionStorage.setItem('dashboard_date_set', 'true');
    };

    const handleNext = () => {
        const newDate = new Date(selectedDate);
        if (viewMode === 'DAY') newDate.setDate(newDate.getDate() + 1);
        else newDate.setMonth(newDate.getMonth() + 1);
        setSelectedDate(newDate);
        sessionStorage.setItem('dashboard_date_set', 'true');
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const tDate = new Date(t.date);
            if (viewMode === 'DAY') {
                return tDate.getDate() === selectedDate.getDate() &&
                    tDate.getMonth() === selectedDate.getMonth() &&
                    tDate.getFullYear() === selectedDate.getFullYear();
            }
            return tDate.getMonth() === selectedDate.getMonth() &&
                tDate.getFullYear() === selectedDate.getFullYear();
        });
    }, [transactions, selectedDate, viewMode]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Stats Gerais (Baseado no filtro atual)
    const stats = useMemo(() => {
        let revenue = 0, expenses = 0;
        filteredTransactions.forEach(t => {
            if (t.type === 'INCOME') revenue += t.amount;
            else expenses += t.amount;
        });
        return { revenue, expenses, profit: revenue - expenses };
    }, [filteredTransactions]);

    // Novos Stats (Vendas Hoje & Ticket Médio) - Sempre relativos ao filtro atual
    const extraStats = useMemo(() => {
        const incomeTxs = filteredTransactions.filter(t => t.type === 'INCOME');
        const salesTotal = incomeTxs.reduce((acc, t) => acc + t.amount, 0);
        const avgTicket = incomeTxs.length > 0 ? salesTotal / incomeTxs.length : 0;

        return {
            salesTotal,
            avgTicket,
            count: incomeTxs.length
        };
    }, [filteredTransactions]);

    // --- Dados para o Fechamento de Caixa ---
    const closingData = useMemo(() => {
        // Para fechamento, sempre calculamos o dia exato selecionado
        const breakdown = { pix: 0, cash: 0, card: 0, other: 0 };
        let totalRevenue = 0;
        let totalExpense = 0;

        // Filtra apenas o dia selecionado para o fechamento, mesmo se estiver vendo o mês
        const closingDateTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getDate() === selectedDate.getDate() &&
                tDate.getMonth() === selectedDate.getMonth() &&
                tDate.getFullYear() === selectedDate.getFullYear();
        });

        closingDateTransactions.forEach(t => {
            if (t.type === 'INCOME') {
                totalRevenue += t.amount;
                const method = t.paymentMethod;
                if (method === 'Pix') breakdown.pix += t.amount;
                else if (method === 'Dinheiro') breakdown.cash += t.amount;
                else if (method === 'Crédito' || method === 'Débito') breakdown.card += t.amount;
                else breakdown.other += t.amount;
            } else {
                totalExpense += t.amount;
            }
        });

        return { totalRevenue, totalExpense, balance: totalRevenue - totalExpense, breakdown };
    }, [transactions, selectedDate]);

    const handleConfirmClosing = () => {
        const newClosing: CashClosing = {
            id: Date.now().toString(),
            date: selectedDate.toISOString(),
            totalRevenue: closingData.totalRevenue,
            totalExpense: closingData.totalExpense,
            balance: closingData.balance,
            breakdown: closingData.breakdown,
            notes: closingNote,
            closedBy: currentUser.name,
            closedAt: new Date().toISOString()
        };

        onCloseRegister(newClosing);
        setIsClosingModalOpen(false);
        setClosingNote('');
        alert("Caixa fechado com sucesso! Consulte o histórico para ver o comprovante.");
    };

    // --- GRÁFICO 1: Dados para o Gráfico de Área (Fluxo) ---
    const chartData = useMemo(() => {
        const dataMap = new Map();

        if (viewMode === 'MONTH') {
            // Lógica MENSAL: Eixo X são os dias do mês
            const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const dayStr = i.toString().padStart(2, '0');
                dataMap.set(dayStr, { name: dayStr, receitas: 0, despesas: 0 });
            }

            filteredTransactions.forEach(t => {
                const day = new Date(t.date).getDate().toString().padStart(2, '0');
                if (dataMap.has(day)) {
                    const entry = dataMap.get(day);
                    if (t.type === 'INCOME') entry.receitas += t.amount;
                    else entry.despesas += t.amount;
                }
            });
        } else {
            // Lógica DIÁRIA: Eixo X são as horas do dia (00h - 23h)
            for (let i = 6; i <= 22; i++) { // Focando horário comercial extendido
                const hourStr = i.toString().padStart(2, '0') + 'h';
                dataMap.set(i, { name: hourStr, receitas: 0, despesas: 0 });
            }

            filteredTransactions.forEach(t => {
                const tDate = new Date(t.date);
                const hour = tDate.getHours();
                if (!dataMap.has(hour)) {
                    const hourStr = hour.toString().padStart(2, '0') + 'h';
                    dataMap.set(hour, { name: hourStr, receitas: 0, despesas: 0 });
                }
                const entry = dataMap.get(hour);
                if (t.type === 'INCOME') entry.receitas += t.amount;
                else entry.despesas += t.amount;
            });

            const sortedKeys = Array.from(dataMap.keys()).sort((a, b) => a - b);
            return sortedKeys.map(k => dataMap.get(k));
        }

        return Array.from(dataMap.values());
    }, [filteredTransactions, selectedDate, viewMode]);

    // --- GRÁFICO 2: Top Produtos (Barras Horizontais) ---
    const topProductsData = useMemo(() => {
        const map: Record<string, number> = {};

        filteredTransactions.filter(t => t.type === 'INCOME').forEach(t => {
            if (t.items && t.items.length > 0) {
                t.items.forEach(item => {
                    map[item.productName] = (map[item.productName] || 0) + item.total;
                });
            } else {
                // Fallback para transações manuais sem itens detalhados
                map[t.description] = (map[t.description] || 0) + t.amount;
            }
        });

        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5
    }, [filteredTransactions]);

    // --- GRÁFICO 3: Categorias (Rosca) ---
    const categoryData = useMemo(() => {
        const map: Record<string, number> = {};
        filteredTransactions.filter(t => t.type === 'INCOME').forEach(t => {
            const cat = t.category || 'Geral';
            map[cat] = (map[cat] || 0) + t.amount;
        });
        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredTransactions]);

    const COLORS_CAT = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

    // --- Lista Fixa de Meios de Pagamento ---
    const paymentMethodsList = useMemo(() => {
        const methodsConfig: { key: PaymentMethod, label: string, icon: string, color: string, bg: string }[] = [
            { key: 'Pix', label: 'Pix', icon: 'qr_code_2', color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { key: 'Dinheiro', label: 'Dinheiro', icon: 'payments', color: 'bg-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
            { key: 'Crédito', label: 'Crédito', icon: 'credit_card', color: 'bg-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { key: 'Débito', label: 'Débito', icon: 'credit_card', color: 'bg-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20' },
            { key: 'Boleto', label: 'Boleto', icon: 'receipt', color: 'bg-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
            { key: 'Outro', label: 'Outros', icon: 'account_balance_wallet', color: 'bg-slate-500', bg: 'bg-slate-50 dark:bg-slate-800' },
        ];

        return methodsConfig.map(method => {
            const total = filteredTransactions
                .filter(t => t.type === 'INCOME' && (t.paymentMethod === method.key || (!t.paymentMethod && method.key === 'Outro')))
                .reduce((acc, t) => acc + t.amount, 0);

            const percent = stats.revenue > 0 ? (total / stats.revenue) * 100 : 0;

            return { ...method, total, percent };
        });
    }, [filteredTransactions, stats.revenue]);

    return (
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 bg-slate-50 dark:bg-background-dark pb-32 font-display">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                        Olá, <span className="text-primary dark:text-orange-400">{currentUser.name.split(' ')[0]}</span>.
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Visão Geral de {viewMode === 'DAY' ? 'Hoje' : 'Neste Mês'}.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-stretch md:items-center">

                    {/* Seletor de Visão (Tabs) */}
                    <div className="flex bg-white dark:bg-card-dark p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setViewMode('DAY')}
                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'DAY' ? 'bg-slate-100 dark:bg-slate-700 text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Dia
                        </button>
                        <button
                            onClick={() => setViewMode('MONTH')}
                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'MONTH' ? 'bg-slate-100 dark:bg-slate-700 text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Mês
                        </button>
                    </div>

                    <div className="flex items-center bg-white dark:bg-card-dark p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 justify-between">
                        <button onClick={handlePrev} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><span className="material-symbols-outlined">chevron_left</span></button>
                        <div className="px-4 text-center min-w-[140px]">
                            <span className="text-sm font-black text-primary capitalize">
                                {viewMode === 'DAY'
                                    ? selectedDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
                                    : selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                                }
                            </span>
                        </div>
                        <button onClick={handleNext} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><span className="material-symbols-outlined">chevron_right</span></button>
                    </div>

                    <div className="flex gap-2">
                        <PrivacyToggle className="flex items-center justify-center w-12 h-12 bg-white dark:bg-card-dark text-slate-400 hover:text-primary border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm" />
                        {/* Botão Fechar Caixa */}
                        <button
                            onClick={() => {
                                // Se estiver no modo Mês, muda pra Dia na data selecionada, pois caixa é diário
                                if (viewMode === 'MONTH') setViewMode('DAY');
                                setIsClosingModalOpen(true);
                            }}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg hover:opacity-90"
                            title="Fechar Caixa do Dia"
                        >
                            <span className="material-symbols-outlined text-[20px]">lock</span>
                            <span className="md:hidden lg:inline">Fechar Caixa</span>
                        </button>

                        <button onClick={onAddClick} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg">
                            <span className="material-symbols-outlined">auto_awesome</span>
                            <span className="md:hidden lg:inline">Lançamentos</span>
                        </button>
                    </div>
                </div>
            </div >

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon="payments" color="emerald" label={viewMode === 'DAY' ? "Entradas (Dia)" : "Receita (Mês)"} value={stats.revenue} />
                <StatCard icon="trending_down" color="rose" label={viewMode === 'DAY' ? "Saídas (Dia)" : "Despesas (Mês)"} value={stats.expenses} />
                <StatCard icon="account_balance_wallet" color={stats.profit >= 0 ? "blue" : "rose"} label="Saldo Líquido" value={stats.profit} highlight={true} />

                {/* Card de Performance Combinado */}
                <div className="bg-white dark:bg-card-dark p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div className="flex-1 p-3 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                                {viewMode === 'DAY' ? 'Vendas Hoje' : 'Vendas no Mês'}
                            </p>
                            <p className="text-lg font-black text-slate-900 dark:text-white">
                                <PrivacyValue value={formatCurrency(extraStats.salesTotal)} blurContent="R$ •••" />
                            </p>
                        </div>
                        <span className="material-symbols-outlined text-green-500 bg-green-50 dark:bg-green-900/20 p-1.5 rounded-lg text-lg">calendar_today</span>
                    </div>
                    <div className="flex-1 p-3 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">Ticket Médio</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white">
                                <PrivacyValue value={formatCurrency(extraStats.avgTicket)} blurContent="R$ •••" />
                            </p>
                        </div>
                        <span className="material-symbols-outlined text-orange-500 bg-orange-50 dark:bg-orange-900/20 p-1.5 rounded-lg text-lg">receipt</span>
                    </div>
                </div>
            </div>

            {/* --- SEÇÃO DE GRÁFICOS PRINCIPAL --- */}
            <div className="w-full bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">show_chart</span>
                    {viewMode === 'DAY' ? 'Fluxo Horário (24h)' : 'Fluxo Diário do Mês'}
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorDes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} interval={viewMode === 'DAY' ? 2 : 1} />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#fff' }}
                                formatter={(val: number) => privacyMode ? 'R$ •••' : formatCurrency(val)}
                                labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '5px' }}
                            />
                            <Area type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRec)" name="Entradas" />
                            <Area type="monotone" dataKey="despesas" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorDes)" name="Saídas" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* --- SEÇÃO DETALHADA: PAGAMENTOS, PRODUTOS, CATEGORIAS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                {/* COL 1: Meios de Pagamento */}
                <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[350px]">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">payments</span>
                        Meios de Recebimento
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                        {paymentMethodsList.map(method => (
                            <div key={method.key} className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${method.bg}`}>
                                            <span className="material-symbols-outlined text-sm dark:text-white">{method.icon}</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{method.label}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-900 dark:text-white">
                                            <PrivacyValue value={formatCurrency(method.total)} blurContent="R$ •••" />
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${method.color}`}
                                            style={{ width: `${method.percent}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 w-8 text-right">{method.percent.toFixed(0)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COL 2: Top Produtos (Novo) */}
                <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[350px]">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">star</span>
                        Top 5 Vendas (R$)
                    </h3>

                    <div className="flex-1 w-full flex items-center justify-center">
                        {topProductsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={topProductsData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: '#64748B' }} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#fff' }}
                                        formatter={(val: number) => privacyMode ? 'R$ •••' : formatCurrency(val)}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                                        {topProductsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'][index % 5]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-slate-400">Sem dados de produtos</p>
                        )}
                    </div>
                </div>

                {/* COL 3: Categorias (Novo) */}
                <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[350px]">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">pie_chart</span>
                        Vendas por Categoria
                    </h3>

                    <div className="flex-1 w-full relative">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS_CAT[index % COLORS_CAT.length]} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#fff' }}
                                        formatter={(val: number) => privacyMode ? 'R$ •••' : formatCurrency(val)}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">Sem dados</div>
                        )}
                    </div>
                </div>

            </div>

            <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-primary dark:text-white uppercase tracking-wider">
                        {viewMode === 'DAY' ? 'Movimentações do Dia' : 'Todas as Movimentações do Mês'}
                    </h3>
                </div>

                {filteredTransactions.length === 0 ? (
                    <div className="p-16 text-center text-slate-400 font-medium">Nenhuma movimentação neste período.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] uppercase tracking-widest">
                                    <th className="px-6 py-4 font-bold">Data</th>
                                    <th className="px-6 py-4 font-bold">Descrição / Itens</th>
                                    <th className="px-6 py-4 font-bold">Método</th>
                                    <th className="px-6 py-4 font-bold text-right">Valor</th>
                                    <th className="px-6 py-4 font-bold text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {[...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
                                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4 align-top">
                                            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                                {new Date(tx.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })} {new Date(tx.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        <span className="material-symbols-outlined text-[14px]">{tx.type === 'INCOME' ? 'arrow_upward' : 'arrow_downward'}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{tx.description}</span>
                                                </div>

                                                {tx.items && tx.items.length > 0 && (
                                                    <div className="ml-8 mt-1 space-y-1">
                                                        {tx.items.map((item, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                                                <span className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-primary font-bold">{item.quantity}x</span>
                                                                <span>{item.productName}</span>
                                                                <span className="text-slate-300">•</span>
                                                                <span>{formatCurrency(item.unitPrice)}/un</span>
                                                                <span className="text-slate-300">=</span>
                                                                <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(item.total)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            {tx.paymentMethod && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
                                                    {tx.paymentMethod}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right align-top">
                                            <span className={`text-sm font-black ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                <PrivacyValue value={(tx.type === 'INCOME' ? '+' : '-') + ' ' + formatCurrency(tx.amount)} blurContent="R$ •••••" />
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center align-top">
                                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => onEditClick(tx)} className="p-1.5 text-slate-400 hover:text-orange-600"><span className="material-symbols-outlined text-lg">edit</span></button>
                                                <button onClick={() => onDeleteClick(tx.id)} className="p-1.5 text-slate-400 hover:text-red-600"><span className="material-symbols-outlined text-lg">delete</span></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL FECHAMENTO DE CAIXA */}
            {
                isClosingModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white dark:bg-card-dark w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-zoom-in border border-slate-200 dark:border-slate-700">
                            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <h3 className="font-black text-xl text-slate-900 dark:text-white">Conferência de Caixa</h3>
                                    <p className="text-xs text-slate-500">
                                        Resumo de {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                                    </p>
                                </div>
                                <button onClick={() => setIsClosingModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="p-6 space-y-6">

                                {/* Card Principal de Saldo */}
                                <div className="text-center p-4 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 rounded-2xl text-white dark:text-slate-900 shadow-lg">
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Saldo Final (Entradas - Saídas)</p>
                                    <p className="text-4xl font-black">{formatCurrency(closingData.balance)}</p>
                                </div>

                                {/* Detalhamento */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50">
                                        <p className="text-[10px] font-bold text-green-600 uppercase">Total Entradas</p>
                                        <p className="text-lg font-black text-green-700 dark:text-green-400">{formatCurrency(closingData.totalRevenue)}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50">
                                        <p className="text-[10px] font-bold text-red-600 uppercase">Total Saídas</p>
                                        <p className="text-lg font-black text-red-700 dark:text-red-400">{formatCurrency(closingData.totalExpense)}</p>
                                    </div>
                                </div>

                                {/* Breakdown de Métodos */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Conferência por Método</p>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-2 border border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between p-2 border-b border-slate-100 dark:border-slate-800 text-sm">
                                            <span className="text-slate-500">Pix</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(closingData.breakdown.pix)}</span>
                                        </div>
                                        <div className="flex justify-between p-2 border-b border-slate-100 dark:border-slate-800 text-sm">
                                            <span className="text-slate-500">Dinheiro Físico</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(closingData.breakdown.cash)}</span>
                                        </div>
                                        <div className="flex justify-between p-2 text-sm">
                                            <span className="text-slate-500">Cartão / Outros</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(closingData.breakdown.card + closingData.breakdown.other)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Campo de Observação */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">Observações do Fechamento</label>
                                    <textarea
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                                        rows={2}
                                        placeholder="Ex: Diferença de R$ 2,00 no caixa..."
                                        value={closingNote}
                                        onChange={e => setClosingNote(e.target.value)}
                                    ></textarea>
                                </div>

                                <button
                                    onClick={handleConfirmClosing}
                                    className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">check_circle</span>
                                    Confirmar Fechamento
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

const StatCard = ({ icon, label, value, hidden, highlight, color }: any) => {
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Configurações de cores para os cards padrões
    // Configurações de cores para os cards padrões - COM SOMBRA BRUTALISTA
    const bgClass = highlight
        ? 'bg-primary text-white border-primary shadow-lg'
        : 'bg-white dark:bg-card-dark border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1';
    const textClass = highlight ? 'text-white' : (color === 'rose' ? 'text-rose-600' : (color === 'emerald' ? 'text-emerald-600' : (color === 'blue' ? 'text-blue-600' : 'text-slate-900 dark:text-white')));

    return (
        <div className={`p-6 rounded-2xl border shadow-sm flex flex-col relative overflow-hidden ${bgClass}`}>
            <div className={`absolute -right-6 -bottom-6 opacity-[0.1] ${highlight ? 'text-white' : 'text-slate-400'}`}>
                <span className="material-symbols-outlined text-[120px]">{icon}</span>
            </div>
            <p className={`text-xs font-bold uppercase tracking-wider ${highlight ? 'text-orange-100' : 'text-slate-400'}`}>{label}</p>
            <h3 className={`text-3xl font-black mt-4 relative z-10 ${textClass}`}>
                <PrivacyValue value={formatCurrency(value)} blurContent={<span className="blur-sm opacity-50">R$ •••••</span>} />
            </h3>
        </div>
    );
};
