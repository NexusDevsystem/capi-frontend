
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
    const [showContent, setShowContent] = useState(false);

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
        const container = mainContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            // setIsScrolled(container.scrollTop > 50); // Removed as per instruction's implied state removal
        };
        container.addEventListener('scroll', handleScroll);

        // --- GSAP ANIMATIONS CONTEXT ---
        let ctx = gsap.context(() => {

            // 1. Staggered Reveals (Features, Pricing, Metrics)
            // Class 'gsap-reveal' will be added to elements we want to animate
            ScrollTrigger.batch(".gsap-reveal", {
                scroller: container,
                onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, stagger: 0.15, overwrite: true, duration: 0.8, ease: "power3.out" }),
                // onLeave: batch => gsap.set(batch, { opacity: 0, y: 20 }), // Optional: Reset on leave
                start: "top 85%",
            });

            // 2. Parallax Background Blobs
            gsap.to(".gsap-parallax-blob", {
                scrollTrigger: {
                    trigger: "body",
                    scroller: container,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 1,
                },
                y: 200, // Move down slower than scroll
                ease: "none"
            });

            // 3. Magnetic Buttons (Custom Logic)
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

            // 4. Background Clouds Animation (Drift & Breathe)
            gsap.to(".gsap-cloud", {
                y: "random(-50, 50)",
                x: "random(-20, 20)",
                scale: "random(0.9, 1.1)",
                opacity: "random(0.3, 0.6)",
                duration: "random(10, 20)",
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                stagger: {
                    amount: 5,
                    from: "random"
                }
            });

        }, container);


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
                // setIsProfileOpen(false); // Removed as per instruction's implied state removal
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            container.removeEventListener('scroll', handleScroll);
            ctx.revert(); // Cleanup GSAP
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
        <>
            <Preloader onLoadingComplete={() => setShowContent(true)} />
            {showContent && (
                <div ref={mainContainerRef} className="h-screen w-full bg-white text-slate-900 font-display selection:bg-orange-200 selection:text-orange-900 overflow-y-auto overflow-x-hidden scroll-smooth pt-0 relative">

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

                        <div className="flex flex-col items-center text-center max-w-5xl mx-auto space-y-8 animate-fade-in-up relative z-10">

                            {/* Social Proof Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-bold mb-4">
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
                                    <span className="absolute inset-0 bg-gradient-to-r from-orange-600 via-yellow-200 to-orange-600 bg-[length:200%_auto] animate-text-shimmer bg-clip-text text-transparent select-none">
                                        falando.
                                    </span>
                                    <span className="invisible">falando.</span>
                                </span>
                            </h1>

                            <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
                                Inteligência Artificial que organiza vendas, estoque e crediário.
                                Sem menus complexos, apenas converse com o sistema.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center pt-6 w-full sm:w-auto">
                                <button onClick={() => navigate('/register')} className="gsap-magnetic w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-full font-bold text-lg transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group shadow-xl shadow-orange-600/20">
                                    Testar Grátis Agora
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </button>
                                <button onClick={() => scrollToSection('ai-demo')} className="gsap-magnetic w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                                    <span className="material-symbols-outlined">play_circle</span>
                                    Ver Demo
                                </button>
                            </div>
                        </div>

                        {/* Scroll Indicator */}
                        <div className="absolute bottom-8 right-8 flex flex-col items-center gap-1 animate-bounce">
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

                    {/* --- TESTIMONIALS (GSAP) --- */}
                    <BeamDivider />
                    <TestimonialsSection />

                    {/* --- PRICING (Modern Clean) --- */}
                    <BeamDivider />
                    <SectionWrapper id="pricing" className="bg-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-orange-100/50 via-transparent to-transparent opacity-60 pointer-events-none"></div>

                        <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
                            <div className="space-y-8 gsap-reveal opacity-0 translate-y-8">
                                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Investimento que se paga<br />na primeira semana.</h2>
                                <p className="text-lg text-slate-500">Sem setup, sem treinamento caro. Cancele quando quiser.</p>

                                <div className="space-y-4">
                                    {[
                                        "Acesso ilimitado ao CAPI IA",
                                        "Gestão de Estoque e Vendas",
                                        "Emissão de Notas Fiscais",
                                        "Suporte Prioritário WhatsApp"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-green-500">check_circle</span>
                                            <span className="text-slate-700 font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="relative gsap-reveal opacity-0 translate-y-8">
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

                                    <button onClick={() => navigate('/register')} className="gsap-magnetic w-full py-5 bg-white text-slate-900 rounded-full font-black text-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                                        Testar 7 Dias Grátis
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </SectionWrapper >

                    {/* --- FAQ --- */}
                    <BeamDivider />
                    < SectionWrapper className="bg-slate-50" >
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
                    </SectionWrapper >

                    {/* --- FINAL CTA --- */}
                    < section className="py-32 bg-[#0c0a09] text-center px-6 relative overflow-hidden" >
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
                    </section >

                    {/* --- FOOTER --- */}
                    <BeamDivider />
                    < footer className="bg-white pt-20 pb-10" >
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
                                        <li><button onClick={() => navigate('/updates')} className="hover:text-orange-600 transition-colors">Novidades & Updates</button></li>
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
            )}
        </>
    );
};
