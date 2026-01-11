
import React, { useRef } from 'react';
import { StoreSettings } from '../types';

interface SettingsPageProps {
    settings: StoreSettings;
    onUpdateSettings: (newSettings: StoreSettings) => void;
    onExportData?: () => void;
    onImportData?: (file: File) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onUpdateSettings, onExportData, onImportData }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleModule = (moduleKey: keyof typeof settings.modules) => {
        onUpdateSettings({
            ...settings,
            modules: {
                ...settings.modules,
                [moduleKey]: !settings.modules[moduleKey]
            }
        });
    };

    const toggleTheme = () => {
        onUpdateSettings({
            ...settings,
            theme: settings.theme === 'light' ? 'dark' : 'light'
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onImportData) {
            onImportData(file);
        }
        // Reset
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-[1000px] w-full mx-auto">
            <header className="mb-8">
                <h1 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight mb-2">Personalização da Loja</h1>
                <p className="text-slate-500 dark:text-slate-400 text-base">Ative apenas o que você usa. Mantenha o sistema simples ou completo.</p>
            </header>

            <div className="flex flex-col gap-8">

                {/* Módulos */}
                <section className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">extension</span>
                        Módulos e Funcionalidades
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <ToggleCard
                            title="Frente de Caixa (PDV)"
                            description="Interface de venda rápida com leitor de código de barras e QR Code Pix."
                            icon="point_of_sale"
                            active={settings.modules.pos}
                            onToggle={() => toggleModule('pos')}
                        />

                        <ToggleCard
                            title="CRM / Vendas"
                            description="Gestão de leads, funil de vendas e oportunidades."
                            icon="view_kanban"
                            active={settings.modules.crm}
                            onToggle={() => toggleModule('crm')}
                        />

                        <ToggleCard
                            title="Gestão de Crediário"
                            description="Crie contas para clientes, adicione itens e receba o pagamento total depois."
                            icon="assignment_ind"
                            active={settings.modules.customerAccounts}
                            onToggle={() => toggleModule('customerAccounts')}
                        />

                        <ToggleCard
                            title="Controle de Estoque"
                            description="Gerencie produtos, preços de custo e margens de lucro."
                            icon="inventory_2"
                            active={settings.modules.inventory}
                            onToggle={() => toggleModule('inventory')}
                        />

                        <ToggleCard
                            title="Fornecedores"
                            description="Cadastro e gestão de fornecedores."
                            icon="local_shipping"
                            active={settings.modules.suppliers}
                            onToggle={() => toggleModule('suppliers')}
                        />

                        <ToggleCard
                            title="Gestão Financeira Avançada"
                            description="Contas a pagar, receber, calendário e previsão de caixa."
                            icon="payments"
                            active={settings.modules.finance}
                            onToggle={() => toggleModule('finance')}
                        />

                        <ToggleCard
                            title="Relatórios & Inteligência (AI)"
                            description="Análises automáticas, DRE e insights sobre o negócio."
                            icon="bar_chart"
                            active={settings.modules.reports}
                            onToggle={() => toggleModule('reports')}
                        />

                        <ToggleCard
                            title="Serviços (OS)"
                            description="Gestão de ordens de serviço, assistência técnica e status de reparos."
                            icon="build"
                            active={settings.modules.services}
                            onToggle={() => toggleModule('services')}
                        />

                        <ToggleCard
                            title="Fechamentos"
                            description="Controle de fechamento de caixa e conferência de valores."
                            icon="lock_clock"
                            active={settings.modules.closings}
                            onToggle={() => toggleModule('closings')}
                        />

                        <ToggleCard
                            title="Gestão de Equipe"
                            description="Cadastro de usuários, vendedores e controle de acesso."
                            icon="group"
                            active={settings.modules.team}
                            onToggle={() => toggleModule('team')}
                        />
                    </div>
                </section>

                {/* Seções de Backup e Aparência removidas conforme solicitação */}

            </div>
        </div>
    );
};

const ToggleCard = ({ title, description, icon, active, onToggle }: any) => (
    <div className={`p-4 rounded-lg border transition-all ${active ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-slate-200 dark:border-slate-700 opacity-70'}`}>
        <div className="flex justify-between items-start mb-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${active ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <button
                onClick={onToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-primary' : 'bg-slate-300'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
);
