import React, { useState } from 'react';
import { Supplier } from '../types';

interface SuppliersPageProps {
    suppliers: Supplier[];
    onAdd: (supplier: Supplier) => void;
    onUpdate: (supplier: Supplier) => void;
    onDelete: (id: string) => void;
}

export const SuppliersPage: React.FC<SuppliersPageProps> = ({ suppliers, onAdd, onUpdate, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Supplier>>({
        name: '', contactName: '', email: '', phone: '', category: '', notes: ''
    });

    const handleNewClick = () => {
        setEditingId(null);
        setFormData({ name: '', contactName: '', email: '', phone: '', category: '', notes: '' });
        setIsModalOpen(true);
    };

    const handleEditClick = (supplier: Supplier) => {
        setEditingId(supplier.id);
        setFormData(supplier);
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        if (!formData.name) return;

        const supplierData = {
            id: editingId || Date.now().toString(),
            name: formData.name,
            contactName: formData.contactName,
            email: formData.email,
            phone: formData.phone,
            category: formData.category,
            notes: formData.notes
        } as Supplier;

        if (editingId) {
            onUpdate(supplierData);
        } else {
            onAdd(supplierData);
        }

        setIsModalOpen(false);
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-[1200px] w-full mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight">Fornecedores</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base">Gerencie seus parceiros de negócio e compras.</p>
                </div>
                <button 
                    onClick={handleNewClick}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all"
                >
                    <span className="material-symbols-outlined">person_add</span>
                    Novo Fornecedor
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {suppliers.length === 0 ? (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700 mb-4">local_shipping</span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhum fornecedor</h3>
                        <p className="text-slate-500 mb-4">Cadastre seus fornecedores para organizar melhor suas compras.</p>
                        <button onClick={handleNewClick} className="text-primary font-bold hover:underline">Cadastrar agora</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {suppliers.map(supplier => (
                            <div key={supplier.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-colors group relative">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                                        <span className="material-symbols-outlined text-slate-500 dark:text-slate-300">store</span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditClick(supplier)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-700 rounded-lg">
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                        </button>
                                        <button onClick={() => onDelete(supplier.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg">
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">{supplier.name}</h3>
                                {supplier.category && <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mb-4">{supplier.category}</span>}
                                
                                <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                                    {supplier.contactName && (
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-base">person</span>
                                            {supplier.contactName}
                                        </div>
                                    )}
                                    {supplier.phone && (
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-base">call</span>
                                            {supplier.phone}
                                        </div>
                                    )}
                                    {supplier.email && (
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-base">mail</span>
                                            {supplier.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white dark:bg-card-dark p-6 rounded-xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 animate-zoom-in">
                        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
                            {editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                        </h3>
                        
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nome da Empresa</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="Ex: Atacadão das Bebidas"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nome do Contato</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.contactName}
                                        onChange={e => setFormData({...formData, contactName: e.target.value})}
                                        placeholder="Ex: João Silva"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Categoria</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.category}
                                        onChange={e => setFormData({...formData, category: e.target.value})}
                                        placeholder="Ex: Bebidas"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Telefone / WhatsApp</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                                    <input 
                                        type="email" 
                                        className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Observações</label>
                                <textarea 
                                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                    rows={3}
                                    value={formData.notes}
                                    onChange={e => setFormData({...formData, notes: e.target.value})}
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                            <button onClick={handleSubmit} className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary-dark shadow-md">
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};