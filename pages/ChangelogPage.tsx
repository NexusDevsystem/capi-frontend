import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { User } from '../types';
import { Navbar } from '../components/Navbar';

gsap.registerPlugin(ScrollTrigger);

// --- Componentes Reutilizáveis (para consistência visual) ---
const SectionWrapper = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <section className={`w-full py-24 md:py-32 relative overflow-hidden ${className}`}>
        <div className="max-w-4xl mx-auto px-6">
            {children}
        </div>
    </section>
);

const UPDATE_LOGS = [
    {
        version: "v1.2.0",
        date: "07 Jan 2026",
        title: "Landing Page Modernizada & Efeitos Visuais",
        description: "Reformulação completa da página inicial com novas animações, efeitos de paralaxe e design premium.",
        features: [
            "Animações de entrada em cascata (Staggered Reveal).",
            "Efeitos de fundo 'Nuvem' animados.",
            "Botões magnéticos e interativos.",
            "Layout responsivo aprimorado."
        ],
        tag: "Design"
    },
    {
        version: "v1.1.5",
        date: "05 Jan 2026",
        title: "Suporte Multi-lojas",
        description: "Agora você pode gerenciar múltiplas filiais com uma única conta de usuário.",
        features: [
            "Alternância rápida entre lojas no menu.",
            "Relatórios consolidados.",
            "Gestão de estoque independente por loja."
        ],
        tag: "Feature"
    },
    {
        version: "v1.1.0",
        date: "02 Jan 2026",
        title: "Assistente de Voz IA",
        description: "Implementação do CAPI Voice para comandos de voz em todo o sistema.",
        features: [
            "Lançamento de vendas por voz.",
            "Consulta de estoque falando o nome do produto.",
            "Resumo diário falado."
        ],
        tag: "IA"
    },
    {
        version: "v1.0.0",
        date: "20 Dez 2025",
        title: "Lançamento Oficial",
        description: "Abertura do sistema para o público geral após fase beta.",
        features: [
            "Dashboard financeiro completo.",
            "PDV com suporte a leitor de código de barras.",
            "Integração com WhatsApp.",
            "Backup automático em nuvem."
        ],
        tag: "Release"
    }
];


export const ChangelogPage: React.FC<{ currentUser?: User | null, onLogout?: () => void }> = ({ currentUser, onLogout }) => {
    const navigate = useNavigate();
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Animação de entrada
    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let ctx = gsap.context(() => {
            gsap.from(".changelog-item", {
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: "power3.out"
            });

            // Parallax no header
            gsap.to(".header-bg", {
                y: 100,
                ease: "none",
                scrollTrigger: {
                    trigger: "body",
                    scroller: container, // IMPORTANT: Define scroller
                    start: "top top",
                    end: "bottom top",
                    scrub: true
                }
            });
        }, container);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="h-screen w-full overflow-y-auto bg-white text-slate-900 font-display selection:bg-orange-200 selection:text-orange-900 scroll-smooth">

            {/* --- GLOBAL NAVBAR --- */}
            <Navbar
                currentUser={currentUser}
                onLogout={onLogout}
                scrollContainerRef={containerRef as React.RefObject<HTMLElement>}
            />

            {/* --- HEADER --- */}
            <div className="relative pt-48 pb-24 bg-slate-50 overflow-hidden header-bg-container">
                <div className="header-bg absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-300/20 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-block px-4 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                        Novidades do Sistema
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">
                        Evoluindo sempre.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">Para o seu negócio.</span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Acompanhe todas as atualizações, melhorias e novos recursos que estamos adicionando ao CAPI.
                    </p>
                </div>
            </div>

            {/* --- TIMELINE --- */}
            <SectionWrapper>
                <div className="relative border-l border-slate-200 ml-4 md:ml-12 space-y-16">
                    {UPDATE_LOGS.map((log, index) => (
                        <div key={index} className="relative pl-8 md:pl-16 changelog-item">
                            {/* Dot */}
                            <div className="absolute top-2 -left-[5px] w-2.5 h-2.5 bg-orange-500 rounded-full ring-4 ring-white"></div>

                            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                                <span className="text-sm font-bold text-slate-400 font-mono">{log.date}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-orange-600 font-black tracking-tight text-xl">{log.version}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border 
                                        ${log.tag === 'Feature' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            log.tag === 'IA' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                log.tag === 'Design' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                                                    'bg-green-50 text-green-600 border-green-100'
                                        }`}>
                                        {log.tag}
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-slate-900 mb-3">{log.title}</h3>
                            <p className="text-slate-600 leading-relaxed mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                {log.description}
                            </p>

                            <ul className="space-y-3">
                                {log.features.map((feat, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                        <span className="material-symbols-outlined text-orange-500 text-lg shrink-0 mt-0.5">check_small</span>
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </SectionWrapper>

            {/* --- SYSTEM SPECIFICATIONS (Technical Details) --- */}
            <SectionWrapper className="bg-slate-50 border-t border-slate-200">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex items-center gap-4 mb-8">
                        <span className="material-symbols-outlined text-4xl text-slate-400">memory</span>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900">Especificações Técnicas</h2>
                            <p className="text-slate-500">Detalhes da infraestrutura da Versão v1.2.0 Stable</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Stack */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-orange-500">code</span>
                                Stack Tecnológico
                            </h3>
                            <ul className="space-y-3 text-sm text-slate-600">
                                <li className="flex justify-between"><span>Frontend Engine</span> <span className="font-mono font-bold text-slate-800">React 19.2</span></li>
                                <li className="flex justify-between"><span>Styling Core</span> <span className="font-mono font-bold text-slate-800">Tailwind CSS 4.0</span></li>
                                <li className="flex justify-between"><span>Animation</span> <span className="font-mono font-bold text-slate-800">GSAP 3.14</span></li>
                                <li className="flex justify-between"><span>Build Tool</span> <span className="font-mono font-bold text-slate-800">Vite 6.2</span></li>
                            </ul>
                        </div>

                        {/* Security */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-green-500">security</span>
                                Segurança & Dados
                            </h3>
                            <ul className="space-y-3 text-sm text-slate-600">
                                <li className="flex justify-between"><span>Protocolo</span> <span className="font-mono font-bold text-slate-800">HTTPS / TLS 1.3</span></li>
                                <li className="flex justify-between"><span>Autenticação</span> <span className="font-mono font-bold text-slate-800">JWT (Secure HTTP Only)</span></li>
                                <li className="flex justify-between"><span>Backup</span> <span className="font-mono font-bold text-slate-800">Automático (Cloud)</span></li>
                                <li className="flex justify-between"><span>Database</span> <span className="font-mono font-bold text-slate-800">MongoDB Atlas</span></li>
                            </ul>
                        </div>

                        {/* Requirements */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-500">devices</span>
                                Requisitos de Sistema
                            </h3>
                            <ul className="space-y-3 text-sm text-slate-600">
                                <li className="flex justify-between"><span>Navegador</span> <span className="font-mono font-bold text-slate-800">Chrome, Edge, Safari (+17)</span></li>
                                <li className="flex justify-between"><span>Conexão</span> <span className="font-mono font-bold text-slate-800">4G / Fibra (Estável)</span></li>
                                <li className="flex justify-between"><span>Display</span> <span className="font-mono font-bold text-slate-800">Resp. (Mobile/Desk)</span></li>
                            </ul>
                        </div>

                        {/* Performance */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-purple-500">speed</span>
                                Performance (Lighthouse)
                            </h3>
                            <ul className="space-y-3 text-sm text-slate-600">
                                <li className="flex justify-between"><span>Acessibilidade</span> <span className="font-mono font-bold text-green-600">98/100</span></li>
                                <li className="flex justify-between"><span>Best Practices</span> <span className="font-mono font-bold text-green-600">100/100</span></li>
                                <li className="flex justify-between"><span>SEO</span> <span className="font-mono font-bold text-green-600">100/100</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </SectionWrapper>

            {/* --- FOOTER CTA --- */}
            <div className="py-24 bg-slate-900 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/20 to-purple-600/20 opacity-30"></div>
                <div className="relative z-10 max-w-2xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-white mb-8">Gostou das novidades?</h2>
                    <button onClick={() => navigate('/register')} className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-xl">
                        Começar a usar agora
                    </button>
                </div>
            </div>

        </div>
    );
};
