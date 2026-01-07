
import React, { useState } from 'react';
import { ServiceOrder, CustomerAccount } from '../types';

interface ServicesPageProps {
    serviceOrders: ServiceOrder[];
    customers: CustomerAccount[];
    onUpdate: (os: ServiceOrder) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ serviceOrders, customers, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOS, setEditingOS] = useState<Partial<ServiceOrder>>({});

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const handleNewOS = () => {
        setEditingOS({
            id: Date.now().toString(),
            customerId: '',
            customerName: '',
            device: '',
            description: '',
            status: 'ABERTO',
            partsTotal: 0,
            laborTotal: 0,
            total: 0,
            openDate: new Date().toISOString()
        });
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!editingOS.customerId || !editingOS.description) return;
        const total = (editingOS.partsTotal || 0) + (editingOS.laborTotal || 0);
        onUpdate({ ...editingOS, total } as ServiceOrder);
        setIsModalOpen(false);
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'ABERTO': return 'bg-blue-100 text-blue-700';
            case 'EM_ANALISE': return 'bg-yellow-100 text-yellow-700';
            case 'AGUARDANDO_PECA': return 'bg-orange-100 text-orange-700';
            case 'CONCLUIDO': return 'bg-green-100 text-green-700';
            case 'ENTREGUE': return 'bg-slate-200 text-slate-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-[1400px] w-full mx-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Ordens de Serviço</h1>
                    <p className="text-slate-500">Gestão de manutenção e serviços técnicos.</p>
                </div>
                <button onClick={handleNewOS} className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined">add_task</span>
                    Nova OS
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {serviceOrders.map(os => (
                    <div key={os.id} className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                        <div className="flex justify-between items-start mb-3">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getStatusColor(os.status)}`}>
                                {os.status.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-400">#{os.id.slice(-6)}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">{os.customerName}</h3>
                        <p className="text-sm font-medium text-primary mb-2">{os.device || 'Serviço Geral'}</p>
                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{os.description}</p>
                        
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3 flex justify-between items-end">
                            <div>
                                <p className="text-xs text-slate-400">Total</p>
                                <p className="font-black text-slate-900 dark:text-white text-lg">{formatCurrency(os.total)}</p>
                            </div>
                            <button 
                                onClick={() => { setEditingOS(os); setIsModalOpen(true); }}
                                className="text-primary font-bold text-sm hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                Editar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal OS */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-card-dark rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Detalhes da Ordem de Serviço</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Cliente</label>
                                <select 
                                    className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                                    value={editingOS.customerId}
                                    onChange={e => {
                                        const cust = customers.find(c => c.id === e.target.value);
                                        setEditingOS({...editingOS, customerId: e.target.value, customerName: cust?.name || ''});
                                    }}
                                >
                                    <option value="">Selecione...</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Equipamento/Veículo</label>
                                <input 
                                    className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                                    value={editingOS.device}
                                    onChange={e => setEditingOS({...editingOS, device: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Defeito Relatado / Serviço</label>
                            <textarea 
                                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                                rows={3}
                                value={editingOS.description}
                                onChange={e => setEditingOS({...editingOS, description: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                             <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Peças (R$)</label>
                                <input 
                                    type="number"
                                    className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                                    value={editingOS.partsTotal}
                                    onChange={e => setEditingOS({...editingOS, partsTotal: parseFloat(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Mão de Obra (R$)</label>
                                <input 
                                    type="number"
                                    className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                                    value={editingOS.laborTotal}
                                    onChange={e => setEditingOS({...editingOS, laborTotal: parseFloat(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                                <select 
                                    className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 font-bold"
                                    value={editingOS.status}
                                    onChange={e => setEditingOS({...editingOS, status: e.target.value as any})}
                                >
                                    <option value="ABERTO">Aberto</option>
                                    <option value="EM_ANALISE">Em Análise</option>
                                    <option value="AGUARDANDO_PECA">Aguardando Peça</option>
                                    <option value="CONCLUIDO">Concluído</option>
                                    <option value="ENTREGUE">Entregue</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t dark:border-slate-700">
                             <div className="text-right">
                                <p className="text-xs text-slate-400 uppercase">Total Estimado</p>
                                <p className="text-2xl font-black text-primary">
                                    {formatCurrency((editingOS.partsTotal || 0) + (editingOS.laborTotal || 0))}
                                </p>
                             </div>
                             <div className="flex gap-2">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold">Cancelar</button>
                                <button onClick={handleSave} className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark shadow-lg">Salvar OS</button>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
