import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface EmployeeDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: User | null;
    storeId: string;
    onUpdate?: (updatedEmployee: User) => void;
}

type TabType = 'personal' | 'professional' | 'permissions' | 'history';

export const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({ isOpen, onClose, employee, storeId, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<TabType>('personal');
    const [isTerminating, setIsTerminating] = useState(false);
    const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);

    const handleTerminate = async () => {
        console.log('[DEBUG] handleTerminate called');
        console.log('[DEBUG] employee:', employee);
        console.log('[DEBUG] storeId:', storeId);


        if (!employee || !storeId) {
            console.log('[DEBUG] Missing employee or storeId - RETURNING');
            return;
        }

        setIsTerminating(true);
        try {
            console.log('[DEBUG] Calling removeEmployee API');
            await authService.removeEmployee(storeId, employee.id);
            console.log('[DEBUG] Employee removed successfully');

            setShowTerminateConfirm(false);
            onClose();

            // Refresh the page to update the list
            window.location.reload();
        } catch (error: any) {
            console.error('[DEBUG] Error removing employee:', error);
            alert('Erro ao desligar colaborador: ' + error.message);
        } finally {
            setIsTerminating(false);
        }
    };

    if (!isOpen || !employee) return null;

    const tabs = [
        { id: 'personal' as TabType, label: 'Pessoal', icon: '👤' },
        { id: 'professional' as TabType, label: 'Profissional', icon: '💼' },
        { id: 'permissions' as TabType, label: 'Permissões', icon: '🔐' },
        { id: 'history' as TabType, label: 'Histórico', icon: '📊' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Detalhes do Colaborador</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Employee Header Info */}
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-white/20 overflow-hidden border-4 border-white/30">
                            <img src={employee.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=ea580c&color=fff`} alt={employee.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold">{employee.name}</h3>
                            <p className="text-white/80">{employee.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${employee.role === 'Administrador' || employee.role === 'Proprietário' ? 'bg-purple-500' : employee.role === 'Gerente' ? 'bg-blue-500' : 'bg-slate-500'}`}>
                                    {employee.role}
                                </span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${employee.status === 'Ativo' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                    {employee.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <div className="flex gap-1 px-6">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === tab.id
                                    ? 'text-orange-600 dark:text-orange-400'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-400" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'personal' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Informações Pessoais</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                                    <p className="text-slate-900 dark:text-white font-medium">{employee.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                    <p className="text-slate-900 dark:text-white font-medium">{employee.email}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone/WhatsApp</label>
                                    <p className="text-slate-900 dark:text-white font-medium">{employee.phone || 'Não informado'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CPF</label>
                                    <p className="text-slate-900 dark:text-white font-medium">{employee.taxId || 'Não informado'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Nascimento</label>
                                    <p className="text-slate-500 dark:text-slate-400 italic">Em breve</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Endereço</label>
                                    <p className="text-slate-500 dark:text-slate-400 italic">Em breve</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'professional' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Informações Profissionais</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cargo/Função</label>
                                    <p className="text-slate-900 dark:text-white font-medium">{employee.role}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${employee.status === 'Ativo' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                        <span className="text-slate-900 dark:text-white font-medium">{employee.status}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Admissão</label>
                                    <p className="text-slate-900 dark:text-white font-medium">
                                        {employee.memberSince ? new Date(employee.memberSince).toLocaleDateString('pt-BR') : 'Não informado'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ID do Usuário</label>
                                    <p className="text-slate-900 dark:text-white font-mono text-sm">{employee.id}</p>
                                </div>
                                <div className="col-span-2">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                        <p className="text-sm text-blue-800 dark:text-blue-300">
                                            <strong>💡 Em breve:</strong> Salário, Tipo de Contrato, Departamento e mais informações profissionais.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'permissions' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Permissões e Acesso</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nível de Acesso</label>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${employee.role === 'Proprietário' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                            employee.role === 'Gerente' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                                            }`}>
                                            {employee.role === 'Proprietário' ? 'Administrador Total' : employee.role === 'Gerente' ? 'Gerencial' : 'Operacional'}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-medium text-slate-900 dark:text-white mb-3">Módulos Acessíveis</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Dashboard', 'Vendas', 'Produtos', 'Clientes', 'Financeiro', 'Relatórios'].map(module => (
                                            <div key={module} className="flex items-center gap-2 text-sm">
                                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span className="text-slate-700 dark:text-slate-300">{module}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                    <p className="text-sm text-amber-800 dark:text-amber-300">
                                        <strong>⚙️ Em desenvolvimento:</strong> Sistema granular de permissões por módulo e ação.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Histórico e Métricas</h3>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Vendas Realizadas</div>
                                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">-</div>
                                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Em breve</div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                                    <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Comissões</div>
                                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">R$ -</div>
                                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">Em breve</div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                                    <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Avaliação</div>
                                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">⭐ -</div>
                                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">Em breve</div>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                <h4 className="font-medium text-slate-900 dark:text-white mb-3">Atividade Recente</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 italic">Nenhuma atividade registrada ainda.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900 flex justify-between">
                    <button
                        onClick={() => setShowTerminateConfirm(true)}
                        className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium border border-red-300 dark:border-red-800"
                    >
                        Desligar Colaborador
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Fechar
                        </button>
                        <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
                            Editar Informações
                        </button>
                    </div>
                </div>
            </div>

            {/* Termination Confirmation Modal */}
            {showTerminateConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirmar Desligamento</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Esta ação não pode ser desfeita</p>
                            </div>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                            <p className="text-sm text-red-800 dark:text-red-300">
                                Ao desligar <strong>{employee?.name}</strong>, o colaborador:
                            </p>
                            <ul className="mt-2 space-y-1 text-sm text-red-700 dark:text-red-400">
                                <li>• Perderá acesso ao sistema</li>
                                <li>• Será removido da equipe</li>
                                <li>• Status mudará para "Inativo"</li>
                            </ul>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowTerminateConfirm(false)}
                                disabled={isTerminating}
                                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleTerminate}
                                disabled={isTerminating}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isTerminating ? 'Desligando...' : 'Confirmar Desligamento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

