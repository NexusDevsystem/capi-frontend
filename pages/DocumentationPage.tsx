import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { User } from '../types';

interface DocumentationPageProps {
    currentUser?: User | null;
    onLogout?: () => void;
}

const DOC_SECTIONS = [
    {
        id: 'getting-started',
        title: 'Primeiros Passos',
        icon: 'rocket_launch',
        content: `
            <h2 class="text-3xl font-bold text-slate-900 mb-6">Bem-vindo ao CAPI</h2>
            <p class="text-lg text-slate-600 mb-4">O CAPI é um sistema de gestão completo potencializado por Inteligência Artificial. Ele foi desenhado para simplificar a rotina de lojistas, eliminando a complexidade de sistemas tradicionais.</p>
            
            <h3 class="text-xl font-bold text-slate-800 mt-8 mb-4">Acessando o Sistema</h3>
            <p class="text-slate-600 mb-4">Para começar, você pode criar uma conta gratuitamente clicando em "Criar Conta" na página inicial. Se já possui conta, basta fazer login.</p>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
                <p class="text-blue-700 font-medium">✨ Dica:</p>
                <p class="text-blue-600 text-sm">O CAPI é multi-lojas! Você pode gerenciar várias filiais com um único login.</p>
            </div>
        `
    },
    {
        id: 'dashboard',
        title: 'Dashboard & Finanças',
        icon: 'monitoring',
        content: `
            <h2 class="text-3xl font-bold text-slate-900 mb-6">Visão Geral do Negócio</h2>
            <p class="text-lg text-slate-600 mb-4">O Dashboard é o coração do seu negócio. Aqui você tem uma visão em tempo real de como sua loja está performando.</p>
            
            <div class="grid md:grid-cols-2 gap-6 my-8">
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h4 class="font-bold text-slate-800 mb-2 flex items-center gap-2"><span class="material-symbols-outlined text-green-500">attach_money</span> Vendas Hoje</h4>
                    <p class="text-sm text-slate-500">Total vendido no dia corrente, atualizado a cada transação.</p>
                </div>
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h4 class="font-bold text-slate-800 mb-2 flex items-center gap-2"><span class="material-symbols-outlined text-blue-500">inventory_2</span> Produtos Críticos</h4>
                    <p class="text-sm text-slate-500">Itens com estoque baixo que precisam de reposição urgente.</p>
                </div>
            </div>

            <h3 class="text-xl font-bold text-slate-800 mt-8 mb-4">Módulo Financeiro</h3>
            <p class="text-slate-600 mb-4">Em <b>Finanças</b>, você controla o fluxo de caixa, despesas e lucros. O sistema calcula automaticamente o lucro bruto baseando-se no custo dos produtos vendidos.</p>
        `
    },
    {
        id: 'pos',
        title: 'PDV & Assistente de Voz',
        icon: 'point_of_sale',
        content: `
            <h2 class="text-3xl font-bold text-slate-900 mb-6">Ponto de Venda (PDV)</h2>
            <p class="text-lg text-slate-600 mb-4">O PDV do CAPI é focado em agilidade. Você pode lançar vendas de três formas:</p>
            
            <ul class="space-y-4 my-6 list-disc pl-6 text-slate-600">
                <li><b>Manual:</b> Buscando o produto pelo nome ou código.</li>
                <li><b>Barcode:</b> Usando um leitor de código de barras USB/Bluetooth.</li>
                <li><b><span class="text-purple-600 font-bold">Assistente de Voz (IA):</span></b> Apenas fale!</li>
            </ul>

            <div class="bg-purple-50 border border-purple-100 rounded-2xl p-6 my-6">
                <h4 class="text-lg font-bold text-purple-700 flex items-center gap-2 mb-2">
                    <span class="material-symbols-outlined">mic</span>
                    CAPI Voice
                </h4>
                <p class="text-purple-600 mb-2">Experimente dizer:</p>
                <div class="bg-white p-3 rounded-lg border border-purple-100 font-mono text-sm text-purple-800 mb-2">
                    "Vender 2 Camisetas Pretas M e 1 Calça Jeans para o João"
                </div>
                <p class="text-xs text-purple-500">O sistema identifica os produtos, quantidades e o cliente automaticamente.</p>
            </div>
        `
    },
    {
        id: 'inventory',
        title: 'Produtos & Estoque',
        icon: 'inventory',
        content: `
            <h2 class="text-3xl font-bold text-slate-900 mb-6">Gestão de Estoque</h2>
            <p class="text-lg text-slate-600 mb-4">Mantenha seu inventário organizado e evite perdas. O CAPI suporta variações de produtos (tamanho, cor) e controle de estoque mínimo.</p>
            
            <h3 class="text-xl font-bold text-slate-800 mt-8 mb-4">Cadastro de Produtos</h3>
            <p class="text-slate-600 mb-4">Ao cadastrar um produto, você pode definir:</p>
            <ul class="grid grid-cols-2 gap-2 text-sm text-slate-600 my-4">
                <li class="flex items-center gap-2"><span class="material-symbols-outlined text-xs text-green-500">check</span> Preço de Custo e Venda</li>
                <li class="flex items-center gap-2"><span class="material-symbols-outlined text-xs text-green-500">check</span> Código de Barras (EAN)</li>
                <li class="flex items-center gap-2"><span class="material-symbols-outlined text-xs text-green-500">check</span> Categoria e Fornecedor</li>
                <li class="flex items-center gap-2"><span class="material-symbols-outlined text-xs text-green-500">check</span> Estoque Mínimo (Alerta)</li>
            </ul>
        `
    },
    {
        id: 'crm',
        title: 'Clientes & Fiado',
        icon: 'groups',
        content: `
            <h2 class="text-3xl font-bold text-slate-900 mb-6">CRM e Crediário</h2>
            <p class="text-lg text-slate-600 mb-4">Fidelize seus clientes e gerencie o "fiado" digitalmente, sem caderninhos de papel.</p>
            
            <h3 class="text-xl font-bold text-slate-800 mt-8 mb-4">Controle de Fiado</h3>
            <p class="text-slate-600 mb-4">Vendeu a prazo? O saldo devedor fica registrado na conta do cliente.</p>
            
            <div class="bg-green-50 p-6 rounded-xl border border-green-100 my-6">
                <h4 class="font-bold text-green-800 mb-2 flex items-center gap-2">
                    <span class="material-symbols-outlined">whatsapp</span>
                    Cobrança Automática
                </h4>
                <p class="text-green-700 text-sm">
                    Você pode enviar lembretes de pagamento direto para o WhatsApp do cliente com um clique.
                </p>
            </div>
        `
    },
    {
        id: 'reports',
        title: 'Relatórios',
        icon: 'bar_chart',
        content: `
            <h2 class="text-3xl font-bold text-slate-900 mb-6">Relatórios Detalhados</h2>
            <p class="text-lg text-slate-600 mb-4">Tome decisões baseadas em dados, não em achismos.</p>
            
            <h3 class="text-xl font-bold text-slate-800 mt-8 mb-4">Tipos de Relatórios</h3>
            <div class="space-y-4">
                <div class="flex items-start gap-4">
                    <div class="bg-orange-100 p-2 rounded text-orange-600"><span class="material-symbols-outlined">trending_up</span></div>
                    <div>
                        <h5 class="font-bold text-slate-900">Vendas por Período</h5>
                        <p class="text-sm text-slate-500">Compare seu desempenho semanal, mensal ou anual.</p>
                    </div>
                </div>
                <div class="flex items-start gap-4">
                    <div class="bg-blue-100 p-2 rounded text-blue-600"><span class="material-symbols-outlined">shopping_bag</span></div>
                    <div>
                        <h5 class="font-bold text-slate-900">Produtos Mais Vendidos</h5>
                        <p class="text-sm text-slate-500">Descubra o que é carro-chefe e o que está encalhado.</p>
                    </div>
                </div>
                <div class="flex items-start gap-4">
                    <div class="bg-purple-100 p-2 rounded text-purple-600"><span class="material-symbols-outlined">person</span></div>
                    <div>
                        <h5 class="font-bold text-slate-900">Melhores Clientes</h5>
                        <p class="text-sm text-slate-500">Ranking de quem mais compra na sua loja.</p>
                    </div>
                </div>
            </div>
        `
    }
];

export const DocumentationPage: React.FC<DocumentationPageProps> = ({ currentUser, onLogout }) => {
    const [activeSection, setActiveSection] = useState(DOC_SECTIONS[0].id);

    const activeContent = DOC_SECTIONS.find(s => s.id === activeSection);

    return (
        <div className="min-h-screen bg-white text-slate-900 font-display selection:bg-orange-200 selection:text-orange-900">
            <Navbar currentUser={currentUser} onLogout={onLogout} />

            <div className="max-w-7xl mx-auto px-6 pt-32 pb-24">

                {/* Header */}
                <div className="mb-16 text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-top-6 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4">
                        <span className="material-symbols-outlined text-sm">library_books</span>
                        Central de Ajuda
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                        Documentação Oficial
                    </h1>
                    <p className="text-lg text-slate-500">
                        Guia completo de funcionalidades, dicas de uso e configurações do Sistema CAPI.
                    </p>
                </div>

                <div className="grid lg:grid-cols-12 gap-12 items-start animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-forwards">

                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-3 sticky top-32 space-y-2 border-r border-slate-100 pr-6 hidden lg:block">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-4">Índice</h3>
                        {DOC_SECTIONS.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`doc-sidebar-item w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200
                                    ${activeSection === section.id
                                        ? 'bg-orange-50 text-orange-700 font-bold shadow-sm ring-1 ring-orange-200'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-xl ${activeSection === section.id ? 'text-orange-600' : 'text-slate-400'}`}>
                                    {section.icon}
                                </span>
                                {section.title}
                            </button>
                        ))}
                    </div>

                    {/* Mobile Navigation Dropdown (Visible only on mobile) */}
                    <div className="lg:hidden col-span-12 mb-8">
                        <select
                            value={activeSection}
                            onChange={(e) => setActiveSection(e.target.value)}
                            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            {DOC_SECTIONS.map(section => (
                                <option key={section.id} value={section.id}>{section.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Main Content Area */}
                    <div className="col-span-12 lg:col-span-9 doc-content min-h-[600px] border-l border-slate-100/50 pl-0 lg:pl-12">
                        {activeContent && (
                            <div className="prose prose-slate prose-lg max-w-none prose-headings:font-black prose-p:text-slate-600">
                                <div dangerouslySetInnerHTML={{ __html: activeContent.content }} />
                            </div>
                        )}

                        {/* Feedback / Footer */}
                        <div className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                            <p>Última atualização: Versão 1.2.0</p>
                            <div className="flex gap-4">
                                <button className="hover:text-orange-600 transition-colors">Precisa de ajuda humana?</button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
