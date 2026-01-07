
import React, { useState, useMemo } from 'react';
import { CustomerAccount } from '../types';
import { 
    FunnelChart, Funnel, Tooltip, ResponsiveContainer, LabelList, Cell 
} from 'recharts';

interface CRMPageProps {
    customers: CustomerAccount[];
    onUpdateCustomer: (customer: CustomerAccount) => void;
    onAddCustomer: (name: string, phone: string) => void;
}

export const CRMPage: React.FC<CRMPageProps> = ({ customers, onUpdateCustomer, onAddCustomer }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [showStats, setShowStats] = useState(true);
    
    // Drag and Drop States
    const [draggedCustomerId, setDraggedCustomerId] = useState<string | null>(null);
    const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

    // Filter customers who are in the pipeline
    const pipelineCustomers = customers.filter(c => c.pipelineStage);
    
    // Stages Configuration (Kanban Columns)
    const stages = [
        { id: 'LEAD', title: 'Leads / Prospecção', color: 'border-blue-500', hex: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/10' },
        { id: 'NEGOCIACAO', title: 'Em Negociação', color: 'border-yellow-500', hex: '#eab308', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
        { id: 'FECHADO', title: 'Fechado / Ganho', color: 'border-green-500', hex: '#22c55e', bg: 'bg-green-50 dark:bg-green-900/10' },
        { id: 'PERDIDO', title: 'Perdido', color: 'border-red-500', hex: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/10' }
    ];

    // --- Metrics Calculation ---
    const funnelData = useMemo(() => {
        const counts = {
            LEAD: 0,
            NEGOCIACAO: 0,
            FECHADO: 0
        };

        pipelineCustomers.forEach(c => {
            if (c.pipelineStage === 'LEAD') counts.LEAD++;
            if (c.pipelineStage === 'NEGOCIACAO') counts.NEGOCIACAO++;
            if (c.pipelineStage === 'FECHADO') counts.FECHADO++;
        });

        return [
            { name: 'Leads', value: counts.LEAD, fill: '#3b82f6' },
            { name: 'Negociação', value: counts.NEGOCIACAO, fill: '#eab308' },
            { name: 'Fechado', value: counts.FECHADO, fill: '#22c55e' }
        ];
    }, [pipelineCustomers]);

    const kpis = useMemo(() => {
        const totalOpportunities = pipelineCustomers.length;
        const won = pipelineCustomers.filter(c => c.pipelineStage === 'FECHADO').length;
        
        const simpleConversion = totalOpportunities > 0 ? (won / totalOpportunities) * 100 : 0;

        return {
            total: totalOpportunities,
            won,
            rate: simpleConversion.toFixed(1)
        };
    }, [pipelineCustomers]);

    const moveStage = (customer: CustomerAccount, newStage: string) => {
        onUpdateCustomer({ ...customer, pipelineStage: newStage as any });
    };

    const handleAddLead = () => {
        if (!newName) return;
        onAddCustomer(newName, newPhone);
        setIsModalOpen(false);
        setNewName('');
        setNewPhone('');
    };

    // --- DnD Handlers ---
    const onDragStart = (e: React.DragEvent, customerId: string) => {
        setDraggedCustomerId(customerId);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", customerId);
    };

    const onDragOver = (e: React.DragEvent, stageId: string) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = "move";
        if (dragOverStageId !== stageId) {
            setDragOverStageId(stageId);
        }
    };

    const onDragLeave = () => {
        setDragOverStageId(null);
    };

    const onDrop = (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        setDragOverStageId(null);
        
        const customerId = e.dataTransfer.getData("text/plain");
        
        if (customerId) {
            const customer = customers.find(c => c.id === customerId);
            if (customer && customer.pipelineStage !== stageId) {
                 moveStage(customer, stageId);
            }
        }
        setDraggedCustomerId(null);
    };

    return (
        <div className="flex-1 overflow-hidden p-6 min-h-full bg-slate-100 dark:bg-background-dark flex flex-col">
            <header className="mb-6 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-3xl">view_kanban</span>
                        Pipeline de Vendas
                    </h1>
                    <p className="text-slate-500">Arraste os cards para mover os clientes de etapa.</p>
                </div>
                <button 
                    onClick={() => setShowStats(!showStats)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors bg-white dark:bg-card-dark px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                    <span className="material-symbols-outlined">{showStats ? 'visibility_off' : 'bar_chart'}</span>
                    {showStats ? 'Ocultar Métricas' : 'Ver Funil'}
                </button>
            </header>

            {/* --- FUNNEL & STATS SECTION (Collapsible) --- */}
            {showStats && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 shrink-0 animate-fade-in-up">
                    {/* Funnel Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col sm:flex-row items-center relative overflow-hidden h-[180px]">
                        <div className="w-full sm:w-1/2 h-full z-10">
                            {kpis.total === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-400 text-xs">Sem dados no pipeline</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <FunnelChart>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                                            formatter={(value, name) => [`${value} Clientes`, name]}
                                        />
                                        <Funnel data={funnelData} dataKey="value" isAnimationActive>
                                            {funnelData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                            <LabelList position="right" fill="#94a3b8" stroke="none" dataKey="name" />
                                        </Funnel>
                                    </FunnelChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <div className="w-full sm:w-1/2 mt-4 sm:mt-0 sm:pl-8 sm:border-l border-slate-100 dark:border-slate-700 flex flex-col justify-center gap-4 z-10">
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Taxa de Conversão</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-black text-slate-900 dark:text-white">{kpis.rate}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${kpis.rate}%` }}></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-[10px] font-bold text-blue-500 uppercase">Em Aberto</span>
                                    <span className="block text-lg font-black text-blue-700 dark:text-blue-400">{kpis.total - kpis.won}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-green-500 uppercase">Fechados</span>
                                    <span className="block text-lg font-black text-green-700 dark:text-green-400">{kpis.won}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Add */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-center relative overflow-hidden h-[180px]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-yellow-400">lightbulb</span>
                            <span className="font-bold text-sm">Dica Rápida</span>
                        </div>
                        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                            Mantenha o funil atualizado. Arraste cards para a direita conforme a negociação avança.
                        </p>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="w-full py-2 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Novo Lead
                        </button>
                    </div>
                </div>
            )}

            {/* --- KANBAN BOARD CONTAINER --- */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
                <div className="flex gap-4 h-full min-w-max">
                    {stages.map(stage => (
                        <div 
                            key={stage.id} 
                            className={`
                                flex flex-col w-[320px] rounded-xl h-full max-h-full transition-all duration-200 border-2
                                ${dragOverStageId === stage.id ? 'bg-primary/5 border-primary border-dashed scale-[1.01]' : 'bg-slate-200/60 dark:bg-slate-900/60 border-transparent hover:bg-slate-200 dark:hover:bg-slate-900'}
                            `}
                            onDragOver={(e) => onDragOver(e, stage.id)}
                            onDragLeave={onDragLeave}
                            onDrop={(e) => onDrop(e, stage.id)}
                        >
                            {/* Column Header */}
                            <div className={`p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center rounded-t-xl bg-white dark:bg-card-dark shadow-sm shrink-0 border-t-4 ${stage.color}`}>
                                <h3 className="font-bold text-slate-700 dark:text-white text-sm uppercase tracking-wide">{stage.title}</h3>
                                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-full">
                                    {pipelineCustomers.filter(c => c.pipelineStage === stage.id).length}
                                </span>
                            </div>

                            {/* Column Content (Scrollable) */}
                            <div className="flex-1 overflow-y-auto space-y-3 p-3 custom-scrollbar">
                                {stage.id === 'LEAD' && (
                                    <button 
                                        onClick={() => setIsModalOpen(true)}
                                        className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 rounded-xl hover:border-slate-400 hover:text-slate-500 transition-colors text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">add</span>
                                        Adicionar
                                    </button>
                                )}

                                {pipelineCustomers
                                    .filter(c => c.pipelineStage === stage.id)
                                    .map(c => (
                                        <div 
                                            key={c.id} 
                                            draggable
                                            onDragStart={(e) => onDragStart(e, c.id)}
                                            className={`
                                                bg-white dark:bg-card-dark p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 
                                                hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative
                                                ${draggedCustomerId === c.id ? 'opacity-40 ring-2 ring-primary rotate-3 scale-95 grayscale' : ''}
                                            `}
                                        >
                                            <div className="flex justify-between items-start mb-2 pointer-events-none">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 uppercase">
                                                    {c.name.substring(0, 2)}
                                                </div>
                                                {c.balance > 0 && (
                                                    <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded">R$ Pend.</span>
                                                )}
                                            </div>
                                            
                                            <div className="pointer-events-none">
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight mb-1">{c.name}</h4>
                                                <div className="flex items-center gap-1 text-slate-500 text-xs mb-3">
                                                    <span className="material-symbols-outlined text-[12px]">call</span>
                                                    {c.phone || 'Sem contato'}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800 pointer-events-none">
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {new Date(c.lastUpdate).toLocaleDateString()}
                                                </span>
                                                <div className="flex -space-x-1">
                                                    <div className="w-5 h-5 rounded-full bg-slate-200 border border-white dark:border-slate-800"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal Create Lead */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white dark:bg-card-dark p-6 rounded-xl w-full max-w-sm shadow-2xl animate-zoom-in">
                        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Novo Lead</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nome / Empresa</label>
                                <input type="text" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Cliente Potencial" autoFocus />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Telefone</label>
                                <input type="text" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="(00) 00000-0000" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                            <button onClick={handleAddLead} className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary-dark shadow-md">Criar Lead</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
