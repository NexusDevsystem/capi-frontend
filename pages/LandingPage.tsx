
import React, { useState, useEffect, useRef } from 'react';
import { Logo } from '../components/Logo';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
    onLoginClick?: () => void;
    onRegisterClick?: () => void;
    currentUser?: User | null;
    onGoToDashboard?: () => void;
    onLogout?: () => void;
}

// --- Componente de Animação de Números (Count Up) ---
const NumberTicker = ({ end, suffix = '', prefix = '', duration = 2000 }: { end: number, suffix?: string, prefix?: string, duration?: number }) => {
    const [count, setCount] = useState(0);
    const elementRef = useRef<HTMLSpanElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !hasAnimated.current) {
                hasAnimated.current = true;
                let start = 0;
                const increment = end / (duration / 16); // 60fps approx

                const timer = setInterval(() => {
                    start += increment;
                    if (start >= end) {
                        setCount(end);
                        clearInterval(timer);
                    } else {
                        setCount(start);
                    }
                }, 16);
            }
        }, { threshold: 0.5 });

        if (elementRef.current) observer.observe(elementRef.current);
        return () => observer.disconnect();
    }, [end, duration]);

    return (
        <span ref={elementRef} className="tabular-nums">
            {prefix}{new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Math.floor(count))}{suffix}
        </span>
    );
};

// --- MODERN FULL WIDTH SECTION WRAPPER ---
// Removemos bordas e radius. Agora é full width.
const SectionWrapper = ({ children, id, className = "", innerClassName = "" }: { children?: React.ReactNode, id?: string, className?: string, innerClassName?: string }) => (
    <section
        id={id}
        className={`w-full py-24 md:py-32 relative overflow-hidden ${className}`}
    >
        <div className={`max-w-7xl mx-auto px-6 ${innerClassName}`}>
            {children}
        </div>
    </section>
);

export const LandingPage: React.FC<LandingPageProps> = ({ currentUser, onLogout }) => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [activeFaq, setActiveFaq] = useState<number | null>(null);

    // AI Demo States
    // Steps: 0=Idle, 1=Typing, 2=Processing, 3=Review(Pending), 4=Success
    const [demoStep, setDemoStep] = useState(0);
    const [demoText, setDemoText] = useState("");
    const demoTargetText = "Vendi 2 camisetas por 90 reais";
    const demoRef = useRef<HTMLDivElement>(null);

    const profileRef = useRef<HTMLDivElement>(null);
    const mainContainerRef = useRef<HTMLDivElement>(null);

    // --- Scroll & Navbar Logic ---
    useEffect(() => {
        const container = mainContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            setIsScrolled(container.scrollTop > 50);
        };

        container.addEventListener('scroll', handleScroll);

        // Reveal Animations on Scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, root: container });

        document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));

        // AI Demo Animation Logic - Exact System Replication
        const demoObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                // Reset
                setDemoStep(0);
                setDemoText("");

                let currentText = "";
                let index = 0;

                // 1. Wait a bit then start typing
                setTimeout(() => {
                    setDemoStep(1); // Typing/Listening look
                    const typeInterval = setInterval(() => {
                        currentText += demoTargetText.charAt(index);
                        setDemoText(currentText);
                        index++;
                        if (index >= demoTargetText.length) {
                            clearInterval(typeInterval);

                            // 2. Processing
                            setTimeout(() => {
                                setDemoStep(2);

                                // 3. Review (Show Ticket)
                                setTimeout(() => {
                                    setDemoStep(3);

                                    // 4. Auto Confirm after viewing
                                    setTimeout(() => {
                                        setDemoStep(4);
                                    }, 2000);

                                }, 1500);
                            }, 500);
                        }
                    }, 50); // Typing speed
                }, 500);

                demoObserver.unobserve(entries[0].target);
            }
        }, { threshold: 0.6, root: container });

        if (demoRef.current) demoObserver.observe(demoRef.current);

        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            container.removeEventListener('scroll', handleScroll);
            observer.disconnect();
            demoObserver.disconnect();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const scrollToTop = () => {
        if (mainContainerRef.current) {
            mainContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div ref={mainContainerRef} className="h-screen w-full bg-white text-slate-900 font-display selection:bg-orange-200 selection:text-orange-900 overflow-y-auto overflow-x-hidden scroll-smooth pt-0">

            {/* --- NAVBAR (Modern Floating) --- */}
            <nav className={`
                fixed left-0 right-0 z-50 flex justify-center transition-all duration-300
                ${isScrolled ? 'top-4' : 'top-0'}
            `}>
                <div className={`
                    flex items-center justify-between transition-all duration-300 backdrop-blur-xl
                    ${isScrolled
                        ? 'w-auto min-w-[340px] md:min-w-[700px] bg-white/90 border border-slate-200/50 shadow-xl rounded-full py-3 px-6'
                        : 'w-full max-w-7xl px-6 py-6 bg-transparent'
                    }
                `}>
                    <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={scrollToTop}>
                        <Logo className={isScrolled ? "h-10 w-auto" : "h-14 w-auto"} textClassName={isScrolled ? "text-xl" : "text-2xl"} />
                    </div>

                    <div className={`hidden md:flex items-center gap-8 font-bold text-slate-500 tracking-wide transition-all duration-500 ${isScrolled ? 'text-xs gap-6' : 'text-sm gap-8'}`}>
                        <button onClick={() => scrollToSection('ai-demo')} className="hover:text-orange-600 transition-colors">IA</button>
                        <button onClick={() => scrollToSection('features')} className="hover:text-orange-600 transition-colors">Recursos</button>
                        <button onClick={() => scrollToSection('testimonials')} className="hover:text-orange-600 transition-colors">Depoimentos</button>
                        <button onClick={() => scrollToSection('pricing')} className="hover:text-orange-600 transition-colors">Planos</button>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {currentUser ? (
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className={`flex items-center gap-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors ${isScrolled ? 'pl-1 pr-3 py-1' : 'pl-1 pr-4 py-1.5'}`}
                                >
                                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-8 h-8 rounded-full border border-white" />
                                    <span className="text-sm font-bold text-slate-700 hidden sm:block">
                                        {currentUser.name.split(' ')[0]}
                                    </span>
                                </button>
                                <div className={`absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 ring-1 ring-black/5 transform transition-all duration-200 origin-top-right overflow-hidden ${isProfileOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                                    <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                                        <p className="font-bold text-slate-900">{currentUser.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                                    </div>
                                    <div className="p-2">
                                        <button onClick={() => navigate('/app')} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg text-orange-500">dashboard</span>
                                            Acessar Sistema
                                        </button>
                                    </div>
                                    <div className="p-2 border-t border-slate-50">
                                        <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">logout</span>
                                            Sair
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate('/login')}
                                    className={`font-bold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block ${isScrolled ? 'text-xs px-3' : 'text-sm px-4 py-2'}`}
                                >
                                    Entrar
                                </button>
                                <button
                                    onClick={() => navigate('/register')}
                                    className={`bg-primary hover:bg-primary-dark text-white font-bold shadow-lg transition-all hover:scale-105 active:scale-95 ${isScrolled ? 'px-5 py-2 rounded-full text-xs' : 'px-6 py-2.5 rounded-full text-sm'}`}
                                >
                                    Começar Grátis
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION (SHARP, FULL WIDTH, LIGHT EFFECT) --- */}
            <SectionWrapper className="bg-white pt-40 pb-24 md:pt-48 md:pb-32">
                {/* Background Decor */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-orange-100/40 rounded-full blur-[100px] -z-10"></div>

                <div className="flex flex-col items-center text-center max-w-5xl mx-auto space-y-8 animate-fade-in-up">

                    {/* Social Proof Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold mb-4">
                        <div className="flex -space-x-1.5">
                            <img className="w-5 h-5 rounded-full border border-white" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64" alt="User" />
                            <img className="w-5 h-5 rounded-full border border-white" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64" alt="User" />
                            <img className="w-5 h-5 rounded-full border border-white" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64" alt="User" />
                        </div>
                        <span className="ml-1">+2.000 lojistas ativos</span>
                    </div>

                    {/* Headline with Light Animation */}
                    <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.95] tracking-tighter">
                        Gerencie sua loja <br className="hidden sm:block" />
                        <span className="relative inline-block mt-2">
                            {/* The Shimmer Text Effect */}
                            <span className="absolute inset-0 bg-gradient-to-r from-orange-600 via-white to-orange-600 bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent select-none">
                                falando.
                            </span>
                            <span className="invisible">falando.</span>
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
                        Inteligência Artificial que organiza vendas, estoque e crediário.
                        Sem menus complexos, apenas converse com o sistema.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center pt-6 w-full sm:w-auto">
                        <button onClick={() => navigate('/register')} className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-full font-bold text-lg transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group shadow-xl shadow-orange-600/20">
                            Testar Grátis Agora
                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </button>
                        <button onClick={() => scrollToSection('ai-demo')} className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">play_circle</span>
                            Ver Demo
                        </button>
                    </div>
                </div>
            </SectionWrapper>

            {/* --- AI INTERACTIVE DEMO (Dark Full Width) --- */}
            <SectionWrapper id="ai-demo" className="bg-[#0c0a09] border-y border-white/5">
                <div ref={demoRef} className="grid lg:grid-cols-2 gap-16 items-center">

                    <div className="order-2 lg:order-1 text-center lg:text-left space-y-6">
                        <span className="text-green-500 font-mono text-xs font-bold tracking-widest uppercase mb-2 block">/// TECNOLOGIA_GEMINI</span>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">O fim do <br /><span className="text-stone-500 line-through decoration-orange-500 decoration-4">caderninho</span>.</h2>
                        <p className="text-lg text-stone-400 leading-relaxed max-w-md mx-auto lg:mx-0">
                            O CAPI entende o que você fala e lança tudo automaticamente. Vendas, fiado, estoque e relatórios.
                            <br /><br />
                            É como ter um gerente financeiro expert no seu bolso 24h por dia.
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4">
                            <div className="flex items-center gap-2 text-stone-300 text-sm font-bold bg-white/5 px-4 py-2 rounded-full border border-white/10">
                                <span className="material-symbols-outlined text-green-500">mic</span>
                                Reconhecimento de Voz
                            </div>
                            <div className="flex items-center gap-2 text-stone-300 text-sm font-bold bg-white/5 px-4 py-2 rounded-full border border-white/10">
                                <span className="material-symbols-outlined text-blue-500">chat</span>
                                Linguagem Natural
                            </div>
                        </div>
                    </div>

                    {/* INTERACTIVE DEMO CARD */}
                    <div className="order-1 lg:order-2 relative w-full max-w-md mx-auto">
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 rounded-3xl blur opacity-30 animate-pulse-slow"></div>
                        <div className="bg-stone-900 rounded-3xl p-1 shadow-2xl border border-white/10 relative z-10 overflow-hidden">
                            <div className="bg-[#151516] rounded-[1.4rem] p-6 min-h-[400px] flex flex-col relative overflow-hidden">

                                {/* Header Mockup */}
                                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    </div>
                                    <span className="text-[10px] text-stone-500 font-mono">CAPI_AI_AGENT_V3</span>
                                </div>

                                {/* Animation Stages */}
                                <div className="flex-1 flex flex-col justify-center items-center">

                                    {/* Mic Icon Status */}
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 mb-6 ${demoStep === 1 || demoStep === 2 ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'bg-stone-800 text-stone-500'}`}>
                                        <span className="material-symbols-outlined text-3xl">
                                            {demoStep === 2 ? 'sync' : (demoStep === 1 ? 'graphic_eq' : 'mic')}
                                        </span>
                                    </div>

                                    {/* Text Input Simulation */}
                                    <div className="w-full text-center min-h-[60px] flex items-center justify-center">
                                        {demoText ? (
                                            <p className="text-xl font-medium text-white animate-fade-in">"{demoText}"</p>
                                        ) : (
                                            <p className="text-stone-600 text-sm">Aguardando comando...</p>
                                        )}
                                    </div>

                                    {/* Result Card (Slide Up) */}
                                    <div className={`w-full mt-6 transition-all duration-500 ${demoStep >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                                        <div className="bg-stone-800/80 backdrop-blur rounded-xl p-4 border border-white/10">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-bold text-green-400 uppercase bg-green-900/30 px-2 py-1 rounded">Venda Confirmada</span>
                                                <span className="text-xs text-stone-400 font-mono">#8392</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-white font-bold">2x Camisetas</p>
                                                    <p className="text-xs text-stone-400">Método: Pix</p>
                                                </div>
                                                <p className="text-2xl font-black text-white">R$ 90,00</p>
                                            </div>
                                        </div>
                                        {demoStep === 4 && (
                                            <div className="mt-2 text-center">
                                                <span className="text-green-500 text-xs font-bold flex items-center justify-center gap-1 animate-fade-in">
                                                    <span className="material-symbols-outlined text-sm">check_circle</span> Salvo no sistema
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SectionWrapper>

            {/* --- METRICS (Modern Grid) --- */}
            <SectionWrapper className="bg-white">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8 text-center">
                    <div className="space-y-1">
                        <p className="text-5xl font-black text-slate-900 tracking-tighter">
                            <NumberTicker end={2500} prefix="+" />
                        </p>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Lojas Ativas</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-5xl font-black text-slate-900 tracking-tighter">
                            <NumberTicker end={120} prefix="R$ " suffix="M" />
                        </p>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Processados</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-5xl font-black text-slate-900 tracking-tighter">
                            <NumberTicker end={30} suffix="%" />
                        </p>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Mais Lucro</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-5xl font-black text-slate-900 tracking-tighter">
                            <NumberTicker end={99} suffix="%" />
                        </p>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Satisfação</p>
                    </div>
                </div>
            </SectionWrapper>

            {/* --- FEATURES (Clean Grid) --- */}
            <SectionWrapper id="features" className="bg-slate-50 border-t border-slate-100">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Um sistema completo.<br />Sem a complexidade.</h2>
                    <p className="text-slate-500">Tudo o que uma grande rede tem, simplificado para o seu negócio.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        { title: "IA de Verdade", icon: "psychology", desc: "Lance vendas e despesas por voz ou texto natural." },
                        { title: "Gestão de Crediário", icon: "assignment_ind", desc: "Organize o fiado. Saiba quem deve e cobre fácil." },
                        { title: "Relatórios DRE", icon: "analytics", desc: "Lucro real, margens e insights automáticos." },
                        { title: "Frente de Caixa", icon: "point_of_sale", desc: "PDV rápido, leitor de código de barras e Pix." },
                        { title: "Controle de Estoque", icon: "inventory_2", desc: "Baixa automática e alerta de reposição." },
                        { title: "Acesso Equipe", icon: "group_add", desc: "Contas para vendedores com permissões limitadas." }
                    ].map((feature, i) => (
                        <div key={i} className="bg-white p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 group">
                            <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-slate-900 mb-6 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-2xl">{feature.icon}</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </SectionWrapper>

            {/* --- PRICING (Modern Clean) --- */}
            <SectionWrapper id="pricing" className="bg-white">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    <div className="space-y-8">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                            Pare de pagar caro em sistemas complicados.
                        </h2>
                        <p className="text-lg text-slate-500 leading-relaxed">
                            A maioria dos ERPs cobra por módulo, por usuário ou por nota emitida.
                            Aqui a regra é clara: preço único, tudo liberado.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 shrink-0">
                                    <span className="material-symbols-outlined">check</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Sem taxa de implantação</h4>
                                    <p className="text-sm text-slate-500">Comece a usar agora mesmo.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 shrink-0">
                                    <span className="material-symbols-outlined">check</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Sem fidelidade</h4>
                                    <p className="text-sm text-slate-500">Cancele quando quiser, sem multa.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500 to-purple-600 rounded-[2rem] blur-xl opacity-20 transform rotate-3"></div>
                        <div className="bg-[#0c0a09] text-white p-10 md:p-12 rounded-[2rem] shadow-2xl relative z-10 overflow-hidden border border-white/10">
                            <div className="absolute top-0 right-0 bg-orange-600 text-white text-[10px] font-bold px-4 py-2 uppercase tracking-widest">
                                Plano Único
                            </div>

                            <p className="text-stone-400 font-medium mb-6">Assinatura Mensal</p>
                            <div className="flex items-baseline gap-2 mb-8">
                                <span className="text-2xl text-stone-500 line-through">R$ 99</span>
                                <span className="text-7xl font-black tracking-tighter">R$ 49</span>
                                <span className="text-xl text-stone-400 font-medium">,90</span>
                            </div>

                            <ul className="space-y-4 mb-10 border-t border-white/10 pt-8">
                                <li className="flex items-center gap-3 text-sm text-stone-300">
                                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                                    Vendas e Produtos Ilimitados
                                </li>
                                <li className="flex items-center gap-3 text-sm text-stone-300">
                                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                                    Inteligência Artificial Gemini
                                </li>
                                <li className="flex items-center gap-3 text-sm text-stone-300">
                                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                                    Multi-usuários (Equipe)
                                </li>
                                <li className="flex items-center gap-3 text-sm text-stone-300">
                                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                                    Suporte Prioritário
                                </li>
                            </ul>

                            <button onClick={() => navigate('/register')} className="w-full py-5 bg-white text-slate-900 rounded-full font-black text-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                                Testar 7 Dias Grátis
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        </div>
                    </div>

                </div>
            </SectionWrapper>

            {/* --- FAQ --- */}
            <SectionWrapper className="bg-slate-50 border-t border-slate-100">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-black text-center mb-10 text-slate-900">Perguntas Frequentes</h2>
                    <div className="space-y-4">
                        {[
                            { q: "Preciso cadastrar cartão de crédito para testar?", a: "Não! Você pode criar sua conta e usar tudo por 7 dias sem compromisso. Só paga se gostar." },
                            { q: "Funciona no celular e no computador?", a: "Sim! O CAPI é um sistema web que roda liso no navegador do seu celular (Android/iPhone) e no PC." },
                            { q: "Posso cancelar se não gostar?", a: "A qualquer momento. Sem multa, sem letras miúdas. Você tem total controle." },
                            { q: "A IA entende qualquer sotaque?", a: "Sim, usamos a tecnologia Google Gemini, que é treinada para entender português brasileiro natural, gírias e sotaques." }
                        ].map((faq, i) => (
                            <div key={i} className="bg-white border border-slate-200 shadow-sm overflow-hidden group hover:border-slate-300 transition-colors">
                                <button
                                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                                    className="w-full flex justify-between items-center p-6 text-left font-bold text-slate-800"
                                >
                                    {faq.q}
                                    <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : ''}`}>expand_more</span>
                                </button>
                                <div className={`px-6 text-slate-600 bg-slate-50/50 overflow-hidden transition-all duration-300 ${activeFaq === i ? 'max-h-40 py-6 border-t border-slate-100' : 'max-h-0 py-0'}`}>
                                    {faq.a}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </SectionWrapper>

            {/* --- FINAL CTA --- */}
            <section className="py-32 bg-[#0c0a09] text-center px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[120px]"></div>

                <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                        Sua loja organizada hoje.
                    </h2>
                    <p className="text-xl text-stone-400">Junte-se a milhares de lojistas que já automatizaram sua gestão.</p>
                    <button onClick={() => navigate('/register')} className="px-12 py-5 bg-white text-slate-900 rounded-full font-black text-xl hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                        Criar Conta Grátis
                    </button>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        <div className="space-y-6">
                            <div className="flex flex-col items-start gap-1">
                                <Logo className="h-20 -mt-6" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mt-1">CAPI, um sistema Nexus</span>
                            </div>
                            <p className="text-slate-500 text-sm font-medium">A revolução na gestão de pequenas e médias lojas através da Inteligência Artificial.</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-6">Produto</h4>
                            <ul className="space-y-4 text-sm text-slate-500 font-medium">
                                <li><button onClick={() => scrollToSection('features')} className="hover:text-orange-600 transition-colors">Funcionalidades</button></li>
                                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-orange-600 transition-colors">Planos & Preços</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-6">Contato</h4>
                            <ul className="space-y-4 text-sm text-slate-500 font-medium">
                                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">mail</span> nexusdevsystem@gmail.com</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-6">Desenvolvedora</h4>
                            <p className="text-sm text-slate-500">Nexus Devsystem. Transformando ideias em sistemas de alta performance.</p>
                        </div>
                    </div>
                    <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-400">
                        <p>&copy; {new Date().getFullYear()} CAPI. Todos os direitos reservados.</p>

                        <div className="flex flex-col items-center md:items-end opacity-80">
                            <span className="font-bold text-slate-500">CAPI</span>
                            <span className="text-[10px]">um sistema Nexus</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
