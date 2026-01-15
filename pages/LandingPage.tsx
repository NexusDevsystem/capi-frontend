
import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Logo } from '../components/Logo';
import { Navbar } from '../components/Navbar';
import { Preloader } from '../components/Preloader';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
    onLoginClick?: () => void;
    onRegisterClick?: () => void;
    currentUser?: User | null;
    onGoToDashboard?: () => void;
    onLogout?: () => void;
}

// --- COMPONENTE DE TICKER (NUMBERS) - SIMPLIFIED ---
const NumberTicker = ({ end, suffix = '', prefix = '', duration = 2 }: { end: number, suffix?: string, prefix?: string, duration?: number }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const elementRef = useRef<HTMLSpanElement>(null);
    const hasAnimatedRef = useRef(false);

    useEffect(() => {
        const target = elementRef.current;
        if (!target || hasAnimatedRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasAnimatedRef.current) {
                    hasAnimatedRef.current = true;

                    // Simple counter animation without GSAP
                    const startTime = Date.now();
                    const durationMs = duration * 1000;

                    const animate = () => {
                        const elapsed = Date.now() - startTime;
                        const progress = Math.min(elapsed / durationMs, 1);

                        // Easing function (ease-out)
                        const easeOut = 1 - Math.pow(1 - progress, 3);
                        const currentValue = Math.floor(easeOut * end);

                        setDisplayValue(currentValue);

                        if (progress < 1) {
                            requestAnimationFrame(animate);
                        } else {
                            setDisplayValue(end);
                        }
                    };

                    requestAnimationFrame(animate);
                    observer.disconnect();
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(target);

        return () => observer.disconnect();
    }, [end, duration]);

    return (
        <span ref={elementRef} className="tabular-nums">
            {prefix}{new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(displayValue)}{suffix}
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

// --- BEAM DIVIDER COMPONENT ---
const BeamDivider = ({ className = "" }: { className?: string }) => (
    <div className={`relative w-full h-px bg-slate-100 overflow-hidden ${className}`}>
        <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-beam opacity-50 blur-[2px]"></div>
    </div>
);

// --- TESTIMONIALS SECTION (GSAP MARQUEE) ---
const TESTIMONIALS = [
    { name: "Carlos Silva", role: "Proprietário", store: "Silva Modas", text: "O sistema organizou meu estoque de um jeito que eu nunca consegui antes.", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
    { name: "Ana Pereira", role: "Gerente", store: "Mercadinho Feliz", text: "A IA facilita muito lançar as vendas na correria. Falo e tá pronto.", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
    { name: "Roberto Costa", role: "Dono", store: "Ferragens Costa", text: "Controle de fiado impecável. Recuperei 30% do que me deviam.", avatar: "https://randomuser.me/api/portraits/men/86.jpg" },
    { name: "Juliana Santos", role: "Sócia", store: "Boutique Juju", text: "O design é lindo e muito fácil de usar. Minha equipe aprendeu em 10 minutos.", avatar: "https://randomuser.me/api/portraits/women/68.jpg" },
    { name: "Marcos Oliveira", role: "Gerente", store: "Padaria Central", text: "Relatórios precisos. Agora sei exatamente quanto lucro por dia.", avatar: "https://randomuser.me/api/portraits/men/46.jpg" },
    { name: "Fernanda Lima", role: "CEO", store: "Tech Imports", text: "Melhor sistema que já usei. Simples, direto e poderoso.", avatar: "https://randomuser.me/api/portraits/women/24.jpg" },
    { name: "Ricardo Alves", role: "Proprietário", store: "Barbearia Vip", text: "Agiliza muito o fechamento do caixa. Recomendo demais.", avatar: "https://randomuser.me/api/portraits/men/54.jpg" },
    { name: "Amanda Souza", role: "Gerente", store: "Café & Prosa", text: "Atendimento do suporte é nota 10. E o sistema não trava.", avatar: "https://randomuser.me/api/portraits/women/33.jpg" },
];

const TestimonialCard: React.FC<{ testimonial: typeof TESTIMONIALS[0] }> = ({ testimonial }) => (
    <div className="w-[350px] shrink-0 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-shadow duration-300 mx-3">
        <div className="flex items-center gap-3 mb-4">
            <img src={testimonial.avatar} alt={testimonial.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
            <div>
                <p className="text-sm font-bold text-slate-900">{testimonial.name}</p>
                <p className="text-xs text-slate-500">{testimonial.role} - <span className="text-orange-600 font-medium">{testimonial.store}</span></p>
            </div>
        </div>
        <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(i => <span key={i} className="material-symbols-outlined text-orange-400 text-sm icon-filled">star</span>)}
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">"{testimonial.text}"</p>
    </div>
);

const TestimonialsSection = () => {
    const row1Ref = useRef<HTMLDivElement>(null);
    const row2Ref = useRef<HTMLDivElement>(null);
    const timeline1 = useRef<gsap.core.Timeline | null>(null);
    const timeline2 = useRef<gsap.core.Timeline | null>(null);

    // Split testimonials into two unique sets
    const halfIndex = Math.ceil(TESTIMONIALS.length / 2);
    const testimonialsRow1 = TESTIMONIALS.slice(0, halfIndex);
    const testimonialsRow2 = TESTIMONIALS.slice(halfIndex);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const row1 = row1Ref.current;
            const row2 = row2Ref.current;

            if (row1 && row2) {
                // Determine width of content
                const contentWidth1 = row1.scrollWidth / 4;
                const contentWidth2 = row2.scrollWidth / 4;

                // Row 1: Left direction
                timeline1.current = gsap.to(row1, {
                    x: -contentWidth1,
                    duration: 40,
                    ease: "none",
                    repeat: -1
                });

                // Row 2: Right direction
                gsap.set(row2, { x: -contentWidth2 });
                timeline2.current = gsap.to(row2, {
                    x: 0,
                    duration: 45,
                    ease: "none",
                    repeat: -1
                });
            }
        });

        return () => ctx.revert();
    }, []);

    const handleMouseEnter = () => {
        timeline1.current?.pause();
        timeline2.current?.pause();
    };

    const handleMouseLeave = () => {
        timeline1.current?.play();
        timeline2.current?.play();
    };

    return (
        <section id="testimonials" className="py-24 bg-slate-50 overflow-hidden relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className="text-center max-w-3xl mx-auto mb-16 px-6">
                <span className="text-orange-600 font-bold tracking-widest uppercase text-xs mb-2 block animate-fade-in">Depoimentos</span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">O que dizem nossos parceiros</h2>
                <p className="text-slate-500">Junte-se a quem já transformou a gestão do seu negócio.</p>
            </div>

            <div className="relative w-full">
                {/* Gradient Masks */}
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>

                {/* Row 1 */}
                <div className="flex mb-8 w-fit" ref={row1Ref}>
                    {[...testimonialsRow1, ...testimonialsRow1, ...testimonialsRow1, ...testimonialsRow1].map((t, i) => (
                        <TestimonialCard key={`r1-${i}`} testimonial={t} />
                    ))}
                </div>

                {/* Row 2 */}
                <div className="flex w-fit" ref={row2Ref}>
                    {[...testimonialsRow2, ...testimonialsRow2, ...testimonialsRow2, ...testimonialsRow2].map((t, i) => (
                        <TestimonialCard key={`r2-${i}`} testimonial={t} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export const LandingPage: React.FC<LandingPageProps> = ({ currentUser, onLogout }) => {
    const navigate = useNavigate();
    const [activeFaq, setActiveFaq] = useState<number | null>(null);

    useEffect(() => {
        document.title = 'CAPI - Gestão Inteligente de Lojas';
    }, []);
    const [showContent, setShowContent] = useState(false);
    const [containerReady, setContainerReady] = useState(false);

    // AI Demo States
    // Steps: 0=Idle, 1=Typing, 2=Processing, 3=Review(Pending), 4=Success
    const [demoStep, setDemoStep] = useState(0);
    const [demoText, setDemoText] = useState("");
    const demoTargetText = "Vendi 2 camisetas por 90 reais";
    const demoRef = useRef<HTMLDivElement>(null);

    const profileRef = useRef<HTMLDivElement>(null);
    // mainContainerRef no longer needed for scroll container, but maybe for context?
    const mainContainerRef = useRef<HTMLDivElement>(null);

    // Hero Refs for Animation
    const heroRef = useRef<HTMLElement>(null);
    const heroContentRef = useRef<HTMLDivElement>(null);

    // --- Scroll & Navbar Logic ---
    useEffect(() => {
        if (!showContent) return; // Wait for content to render

        // Wait for container to be in DOM before initializing animations
        const container = mainContainerRef.current;
        if (!container) return;

        // Signal that container is ready for child components
        setContainerReady(true);

        // --- GSAP ANIMATIONS CONTEXT ---
        let ctx: gsap.Context;

        // Wait for layout to be fully painted/reflowed
        const initAnimation = setTimeout(() => {
            ctx = gsap.context(() => {

                // 0. Hero Sequence (RePLACES animate-fade-in-up)
                // We target elements with 'hero-animate' class
                const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
                heroTl.fromTo(".hero-animate",
                    { y: 50, opacity: 0 },
                    { y: 0, opacity: 1, duration: 1, stagger: 0.15 }
                );

                // Scroll Indicator Bounce (GSAP)
                gsap.to(".scroll-indicator", {
                    y: 10,
                    duration: 1.5,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut"
                });

                // 1. Staggered Reveals (Features, Pricing, Metrics)
                ScrollTrigger.batch(".gsap-reveal", {
                    scroller: container,
                    onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, stagger: 0.15, overwrite: true, duration: 0.8, ease: "power3.out" }),
                    start: "top 85%",
                });

                // 2. Parallax
                gsap.to(".gsap-parallax-blob", {
                    scrollTrigger: {
                        trigger: "body",
                        scroller: container,
                        start: "top top",
                        end: "bottom bottom",
                        scrub: 1,
                    },
                    y: 200,
                    ease: "none"
                });

                // 3. Magnetic Buttons
                const buttons = document.querySelectorAll<HTMLElement>(".gsap-magnetic");
                buttons.forEach(btn => {
                    btn.addEventListener("mousemove", (e) => {
                        const rect = btn.getBoundingClientRect();
                        const x = e.clientX - rect.left - rect.width / 2;
                        const y = e.clientY - rect.top - rect.height / 2;
                        gsap.to(btn, { x: x * 0.2, y: y * 0.2, duration: 0.3, ease: "power2.out" });
                    });
                    btn.addEventListener("mouseleave", () => {
                        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
                    });
                });

                // 4. Clouds
                gsap.to(".gsap-cloud", {
                    y: "random(-50, 50)",
                    x: "random(-20, 20)",
                    scale: "random(0.9, 1.1)",
                    opacity: "random(0.3, 0.6)",
                    duration: "random(10, 20)",
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    stagger: { amount: 5, from: "random" }
                });

                // 5. AI DEMO TRIGGER
                if (demoRef.current) {
                    ScrollTrigger.create({
                        trigger: demoRef.current,
                        scroller: container,
                        start: "top 70%",
                        once: true,
                        onEnter: () => {
                            setDemoStep(0);
                            setDemoText("");
                            let currentText = "";
                            let index = 0;
                            setTimeout(() => {
                                setDemoStep(1);
                                const typeInterval = setInterval(() => {
                                    currentText += demoTargetText.charAt(index);
                                    setDemoText(currentText);
                                    index++;
                                    if (index >= demoTargetText.length) {
                                        clearInterval(typeInterval);
                                        setTimeout(() => {
                                            setDemoStep(2);
                                            setTimeout(() => { setDemoStep(3); setTimeout(() => { setDemoStep(4); }, 2000); }, 1500);
                                        }, 500);
                                    }
                                }, 50);
                            }, 500);
                        }
                    });
                }

                // Force strict refresh after setup
                ScrollTrigger.refresh();

            }, container);
        }, 100);

        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                // setIsProfileOpen(false); // Removed as per instruction's implied state removal
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            clearTimeout(initAnimation);
            ctx?.revert();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showContent]); // Dependency on showContent added!

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
        <>
            <Preloader onLoadingComplete={() => setShowContent(true)} />
            {showContent && (
                <div id="main-scroll-container" ref={mainContainerRef} className="h-screen w-full bg-white text-slate-900 font-display selection:bg-orange-200 selection:text-orange-900 overflow-y-auto overflow-x-hidden scroll-smooth pt-0 relative">

                    {/* --- BACKGROUND CLOUDS (Atmosphere) --- */}
                    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                        <div className="gsap-cloud absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-orange-100/40 rounded-full blur-[120px] mix-blend-multiply opacity-50"></div>
                        <div className="gsap-cloud absolute top-[20%] right-[-20%] w-[60vw] h-[60vw] bg-purple-100/30 rounded-full blur-[120px] mix-blend-multiply opacity-50"></div>
                        <div className="gsap-cloud absolute bottom-[-10%] left-[20%] w-[80vw] h-[60vw] bg-blue-50/40 rounded-full blur-[100px] mix-blend-multiply opacity-40"></div>
                    </div>

                    {/* --- NAVBAR (Modern Floating) --- */}
                    <Navbar
                        currentUser={currentUser}
                        onLogout={onLogout}
                        transparent={true}
                        scrollContainerRef={mainContainerRef as React.RefObject<HTMLElement>}
                    />

                    {/* --- HERO SECTION (SHARP, FULL WIDTH) --- */}
                    <SectionWrapper className="bg-white min-h-screen flex items-center relative py-0">

                        {/* Background Decor */}
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-10"></div>

                        <div className="flex flex-col items-center text-center max-w-5xl mx-auto space-y-8 relative z-10">

                            {/* Social Proof Badge */}
                            <div className="hero-animate opacity-0 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-bold mb-4">
                                <div className="flex -space-x-1.5">
                                    <img className="w-5 h-5 rounded-full border border-white" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64" alt="User" />
                                    <img className="w-5 h-5 rounded-full border border-white" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64" alt="User" />
                                    <img className="w-5 h-5 rounded-full border border-white" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64" alt="User" />
                                </div>
                                <span className="ml-1">+2.000 lojistas ativos</span>
                            </div>

                            {/* Headline with Light Animation */}
                            <h1 className="hero-animate opacity-0 text-6xl md:text-8xl font-black text-slate-900 leading-[0.95] tracking-tighter">
                                Gerencie sua loja <br className="hidden sm:block" />
                                <span className="relative inline-block mt-2">
                                    {/* The Shimmer Text Effect */}
                                    <span className="absolute inset-0 bg-gradient-to-r from-orange-600 via-yellow-200 to-orange-600 bg-[length:200%_auto] animate-text-shimmer bg-clip-text text-transparent select-none">
                                        falando.
                                    </span>
                                    <span className="invisible">falando.</span>
                                </span>
                            </h1>

                            <p className="hero-animate opacity-0 text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
                                Inteligência Artificial que organiza vendas, estoque e crediário.
                                Sem menus complexos, apenas converse com o sistema.
                            </p>

                            {/* CTA Buttons */}
                            <div className="hero-animate opacity-0 flex flex-col sm:flex-row items-center gap-4 justify-center pt-6 w-full sm:w-auto">
                                <button onClick={() => navigate('/register')} className="gsap-magnetic w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-full font-bold text-lg transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group shadow-xl shadow-orange-600/20">
                                    Testar 2 dias Grátis
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </button>
                                <button onClick={() => scrollToSection('ai-demo')} className="gsap-magnetic w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                                    <span className="material-symbols-outlined">play_circle</span>
                                    Ver Demo
                                </button>
                            </div>
                        </div>

                        {/* Scroll Indicator */}
                        <div className="scroll-indicator absolute bottom-8 right-8 flex flex-col items-center gap-1">
                            <span className="material-symbols-outlined text-slate-400 text-2xl">keyboard_arrow_down</span>
                            <span className="material-symbols-outlined text-slate-400 text-2xl -mt-3">keyboard_arrow_down</span>
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
                    </SectionWrapper >

                    {/* --- METRICS (Modern Grid) --- */}
                    < BeamDivider />
                    <SectionWrapper className="bg-white">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8 text-center">
                            <div className="gsap-reveal opacity-0 translate-y-8 space-y-1">
                                <p className="text-5xl font-black text-slate-900 tracking-tighter">
                                    <NumberTicker end={2500} prefix="+" />
                                </p>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Lojas Ativas</p>
                            </div>
                            <div className="gsap-reveal opacity-0 translate-y-8 space-y-1">
                                <p className="text-5xl font-black text-slate-900 tracking-tighter">
                                    <NumberTicker end={120} prefix="R$ " suffix="M" />
                                </p>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Processados</p>
                            </div>
                            <div className="gsap-reveal opacity-0 translate-y-8 space-y-1">
                                <p className="text-5xl font-black text-slate-900 tracking-tighter">
                                    <NumberTicker end={30} suffix="%" />
                                </p>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Mais Lucro</p>
                            </div>
                            <div className="gsap-reveal opacity-0 translate-y-8 space-y-1">
                                <p className="text-5xl font-black text-slate-900 tracking-tighter">
                                    <NumberTicker end={99} suffix="%" />
                                </p>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Satisfação</p>
                            </div>
                        </div>
                    </SectionWrapper>

                    {/* --- FEATURES (Clean Grid) --- */}
                    <BeamDivider />
                    <SectionWrapper id="features" className="bg-slate-50 relative">
                        <div className="gsap-parallax-blob absolute top-1/2 left-0 w-[500px] h-[500px] bg-orange-300/10 rounded-full blur-[120px] pointer-events-none"></div>

                        <div className="text-center max-w-3xl mx-auto mb-16 relative z-10 gsap-reveal opacity-0 translate-y-8">
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Um sistema completo.<br />Sem a complexidade.</h2>
                            <p className="text-slate-500">Tudo o que uma grande rede tem, simplificado para o seu negócio.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                            {[
                                { icon: "schedule", title: "Rotina Inteligente", desc: "O sistema sugere o que fazer hoje para vender mais." },
                                { icon: "inventory_2", title: "Estoque Automático", desc: "Baixa automática ao vender. Avisa quando repor." },
                                { icon: "attach_money", title: "Controle de Fiado", desc: "Cobre clientes automaticamente pelo WhatsApp." },
                                { icon: "insights", title: "Relatórios Simples", desc: "Entenda seu lucro sem precisar de contador." },
                                { icon: "group", title: "Gestão de Equipe", desc: "Metas e comissões calculadas na hora." },
                                { icon: "cloud_sync", title: "Backup em Nuvem", desc: "Seus dados seguros e acessíveis de qualquer lugar." }
                            ].map((feature, i) => (
                                <div key={i} className="gsap-reveal opacity-0 translate-y-8 p-8 bg-white rounded-2xl border border-slate-100 hover:border-orange-200 hover:shadow-xl transition-all group">
                                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-2xl">{feature.icon}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                    <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </SectionWrapper>

                    {/* --- MODULES SECTION (NEW) --- */}
                    <BeamDivider />
                    <SectionWrapper id="modules" className="bg-white relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-200/50 to-transparent"></div>

                        <div className="text-center max-w-3xl mx-auto mb-16 relative z-10 gsap-reveal opacity-0 translate-y-8">
                            <span className="text-orange-600 font-bold tracking-widest uppercase text-xs mb-2 block">Personalização Total</span>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Ative apenas o que usar.</h2>
                            <p className="text-slate-500 text-lg">O CAPI é modular. Você escolhe quais ferramentas quer ver no seu menu, mantendo o sistema limpo e focado no seu negócio.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 max-w-6xl mx-auto">
                            {[
                                { icon: "point_of_sale", title: "Frente de Caixa (PDV)", desc: "Venda rápida com leitor de código de barras e QR Code Pix.", color: "text-orange-500" },
                                { icon: "store", title: "CRM / Vendas", desc: "Gestão de leads, funil de vendas e oportunidades.", color: "text-blue-500" },
                                { icon: "badge", title: "Gestão de Crediário", desc: "Controle total de fiado e contas a receber.", color: "text-purple-500" },
                                { icon: "inventory_2", title: "Controle de Estoque", desc: "Gerencie produtos, margens e reposição.", color: "text-emerald-500" },
                                { icon: "local_shipping", title: "Fornecedores", desc: "Cadastro e gestão de compras e pedidos.", color: "text-amber-600" },
                                { icon: "account_balance", title: "Gestão Financeira", desc: "DRE, contas a pagar/receber e fluxo de caixa.", color: "text-cyan-600" },
                                { icon: "analytics", title: "Relatórios & AI", desc: "Análises automáticas e insights sobre o negócio.", color: "text-pink-500" },
                                { icon: "build", title: "Serviços (OS)", desc: "Ordens de serviço e assistência técnica.", color: "text-indigo-500" },
                            ].map((mod, i) => (
                                <div key={i} className="gsap-reveal opacity-0 translate-y-8 p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-lg hover:border-orange-200 transition-all duration-300 group cursor-default">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center ${mod.color} shadow-sm group-hover:scale-110 transition-transform`}>
                                            <span className="material-symbols-outlined">{mod.icon}</span>
                                        </div>
                                        {/* Toggle Simulation */}
                                        <div className="w-10 h-6 bg-green-500 rounded-full p-1 relative shadow-inner">
                                            <div className="w-4 h-4 bg-white rounded-full shadow-sm absolute right-1 top-1"></div>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-slate-900 mb-2">{mod.title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{mod.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Visual Connector Line */}
                        <div className="hidden lg:block absolute left-1/2 bottom-0 w-px h-24 bg-gradient-to-b from-transparent to-slate-200"></div>
                    </SectionWrapper>

                    {/* --- TESTIMONIALS (GSAP) --- */}
                    <BeamDivider />
                    <TestimonialsSection />

                    {/* --- PRICING (Modern Clean) --- */}
                    <BeamDivider />
                    <SectionWrapper id="pricing" className="bg-slate-50 relative overflow-hidden">
                        {/* Enhanced Background Gradients */}
                        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-orange-200/40 via-purple-200/20 to-transparent opacity-60 pointer-events-none blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-200/30 via-transparent to-transparent opacity-40 pointer-events-none blur-3xl"></div>

                        <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
                            {/* Left Content */}
                            <div className="space-y-8 gsap-reveal opacity-0 translate-y-8 order-2 lg:order-1">
                                <span className="inline-block px-4 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold tracking-widest uppercase border border-orange-200 mb-2">
                                    Custo-Benefício Imbatível
                                </span>
                                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
                                    Investimento que se paga <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">na primeira semana.</span>
                                </h2>
                                <p className="text-xl text-slate-600 leading-relaxed font-medium">
                                    Substitua sistemas caros e complexos por uma solução que cabe no bolso e funciona de verdade.
                                </p>

                                <div className="space-y-5 pt-4">
                                    {[
                                        { text: "Acesso ilimitado ao CAPI IA", sub: "Sem limites de mensagens ou comandos" },
                                        { text: "Gestão Completa de Estoque", sub: "Baixa automática e alertas de reposição" },
                                        { text: "Relatórios Financeiros Avançados", sub: "Análises detalhadas de vendas e lucro" },
                                        { text: "Suporte VIP via WhatsApp", sub: "Atendimento humano e rápido" }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-4 group p-3 rounded-2xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all duration-300">
                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined text-green-600 text-xl font-bold">check</span>
                                            </div>
                                            <div>
                                                <p className="text-slate-900 font-bold text-lg">{item.text}</p>
                                                <p className="text-slate-500 text-sm">{item.sub}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Pricing Card */}
                            <div className="relative gsap-reveal opacity-0 translate-y-8 order-1 lg:order-2 group">
                                {/* LIGHTNING EFFECT LAYERS */}
                                <div className="absolute -inset-[3px] rounded-[2.2rem] bg-gradient-to-r from-orange-400 via-amber-200 to-orange-400 opacity-75 blur-md animate-pulse group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="absolute -inset-[1px] rounded-[2.1rem] bg-gradient-to-r from-orange-500 via-yellow-300 to-orange-500 opacity-100 blur-[1px] animate-shimmer-fast"></div>

                                <div className="bg-[#0c0a09] text-white p-10 md:p-14 rounded-[2rem] shadow-2xl relative z-10 overflow-hidden">

                                    {/* Inner Lightning Texture (Subtle) */}
                                    <div className="absolute inset-0 bg-none opacity-20 mix-blend-overlay"></div>

                                    {/* Badge */}
                                    <div className="absolute top-0 right-0 z-20">
                                        <div className="bg-orange-600 text-white text-xs font-black px-6 py-3 rounded-bl-3xl shadow-lg uppercase tracking-widest flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">bolt</span>
                                            Plano Único
                                        </div>
                                    </div>

                                    <div className="mb-10 pt-4">
                                        <p className="text-stone-400 font-bold mb-3 uppercase tracking-widest text-[11px]">Assinatura Mensal</p>
                                        <h3 className="text-4xl font-black text-white tracking-tight">Plano Pro</h3>
                                    </div>

                                    <div className="flex items-end gap-2 mb-12 pb-12 border-b border-white/5">
                                        <div className="flex flex-col mb-2 mr-2">
                                            <span className="text-lg text-stone-500 font-medium line-through decoration-red-500/50 decoration-2">R$ 99</span>
                                        </div>
                                        <div className="flex items-end leading-none">
                                            <span className="text-3xl font-bold text-stone-300 mb-2 mr-1">R$</span>
                                            <span className="text-[7rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-stone-200 to-stone-400 leading-[0.8]">49</span>
                                        </div>
                                        <div className="flex flex-col justify-end mb-2 ml-1">
                                            <span className="text-3xl font-bold text-stone-300">,90</span>
                                            <span className="text-sm text-stone-500 font-bold uppercase tracking-wide">/mês</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-6 mb-14">
                                        {[
                                            "Tudo incluso, sem taxas extras",
                                            "Cancele quando quiser",
                                            "2 dias de teste grátis"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-4 text-stone-300 group">
                                                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                                                    <span className="material-symbols-outlined text-orange-500 text-lg">verified</span>
                                                </div>
                                                <span className="font-bold text-lg">{item}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button onClick={() => navigate('/register')} className="relative w-full py-6 bg-white text-slate-900 rounded-full font-black text-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3 overflow-hidden group/btn shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98]">
                                        <span className="relative z-10">Começar Teste de 2 Dias</span>
                                        <span className="material-symbols-outlined relative z-10 group-hover/btn:translate-x-1 transition-transform font-bold">arrow_forward</span>
                                    </button>

                                    <p className="text-center text-sm text-stone-500 mt-8 font-medium">
                                        Não pede cartão de crédito para testar.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </SectionWrapper>

                    {/* --- FAQ --- */}
                    <BeamDivider />
                    < SectionWrapper className="bg-slate-50" >
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-3xl font-black text-center mb-10 text-slate-900">Perguntas Frequentes</h2>
                            <div className="space-y-4">
                                {[
                                    { q: "Preciso cadastrar cartão de crédito para testar?", a: "Não! Você pode criar sua conta e usar tudo por 2 dias sem compromisso. Só paga se gostar." },
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
                    </SectionWrapper >

                    {/* --- FINAL CTA --- */}
                    < section className="py-32 bg-[#0c0a09] text-center px-6 relative overflow-hidden" >
                        <div className="absolute inset-0 bg-none opacity-20"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[120px]"></div>

                        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                                Sua loja organizada hoje.
                            </h2>
                            <p className="text-xl text-stone-400">Junte-se a milhares de lojistas que já automatizaram sua gestão.</p>
                            <button onClick={() => navigate('/register')} className="px-12 py-5 bg-white text-slate-900 rounded-full font-black text-xl hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                                Criar Conta e Testar 2 Dias
                            </button>
                        </div>
                    </section >

                    {/* --- FOOTER --- */}
                    <BeamDivider />
                    < footer className="bg-white pt-20 pb-10" >
                        <div className="max-w-7xl mx-auto px-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                                <div className="space-y-6">
                                    <div className="flex flex-col items-start gap-1">
                                        <Logo className="h-20 -mt-6" />
                                    </div>
                                    <p className="text-slate-500 text-sm font-medium">A revolução na gestão de pequenas e médias lojas através da Inteligência Artificial.</p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-6">Produto</h4>
                                    <ul className="space-y-4 text-sm text-slate-500 font-medium">
                                        <li><button onClick={() => scrollToSection('features')} className="hover:text-orange-600 transition-colors">Funcionalidades</button></li>
                                        <li><button onClick={() => scrollToSection('pricing')} className="hover:text-orange-600 transition-colors">Planos & Preços</button></li>
                                        <li><button onClick={() => navigate('/updates')} className="hover:text-orange-600 transition-colors">Novidades & Updates</button></li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-6">Contato</h4>
                                    <ul className="space-y-4 text-sm text-slate-500 font-medium">
                                        <li className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">mail</span>
                                            nexusdevsystem@gmail.com
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-6">Desenvolvedora</h4>
                                    <p className="text-sm text-slate-500">Nexus Devsystem. Transformando ideias em sistemas de alta performance.</p>
                                </div>
                            </div>
                            <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-400">
                                <p>&copy; {new Date().getFullYear()} CAPI. Desenvolvido por <strong className="text-slate-500">Nexus Devsystem</strong> • CNPJ 64.334.547/0001-06.</p>

                                <div className="flex items-center gap-6">
                                    <a href="https://instagram.com/capipay.erp" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-orange-600 transition-colors" title="Instagram">
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                        </svg>
                                    </a>

                                    <div className="flex flex-col items-center md:items-end opacity-80">
                                        <span className="font-bold text-slate-500">CAPI</span>
                                        <span className="text-[10px]">um sistema Nexus</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </footer>
                </div>
            )}
        </>
    );
};
