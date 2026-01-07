
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Logo } from '../components/Logo';

interface OnboardingPageProps {
    user: User;
    onConfirm: (storeName: string) => void;
    onLogout: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ user, onConfirm, onLogout }) => {
    const [step, setStep] = useState<'OFFER_REVEAL' | 'STORE_SETUP' | 'LOADING'>('OFFER_REVEAL');
    const [storeName, setStoreName] = useState('');
    
    // Loading Animation States
    const [loadingPhase, setLoadingPhase] = useState<'PREPARING' | 'TYPING'>('PREPARING');
    const [typedText, setTypedText] = useState('');

    const handleAcceptTrial = () => {
        setStep('STORE_SETUP');
    };

    const handleFinish = () => {
        if (!storeName.trim()) return alert("Por favor, insira o nome da sua loja.");
        // Start the loading sequence instead of confirming immediately
        setStep('LOADING');
    };

    // Sequence Logic
    useEffect(() => {
        if (step === 'LOADING') {
            // Phase 1: Preparing Environment (2 seconds)
            const prepTimer = setTimeout(() => {
                setLoadingPhase('TYPING');
            }, 2500);

            return () => clearTimeout(prepTimer);
        }
    }, [step]);

    useEffect(() => {
        if (step === 'LOADING' && loadingPhase === 'TYPING') {
            const targetText = "CAPI";
            let currentIndex = 0;
            
            // Phase 2: Typewriter Effect
            const typeInterval = setInterval(() => {
                if (currentIndex <= targetText.length) {
                    setTypedText(targetText.slice(0, currentIndex + 1));
                    currentIndex++;
                } else {
                    clearInterval(typeInterval);
                    // Phase 3: Finish and Enter App
                    setTimeout(() => {
                        onConfirm(storeName);
                    }, 1000); // 1s pause after typing finishes
                }
            }, 300); // Speed of typing

            return () => clearInterval(typeInterval);
        }
    }, [step, loadingPhase, storeName, onConfirm]);

    return (
        <div className="h-full w-full bg-slate-900 font-display flex flex-col relative text-white overflow-hidden">
            
            {/* Background Effects (Fixed to not scroll) */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black z-0 pointer-events-none"></div>
            <div className="fixed inset-0 w-full h-full bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] z-0 pointer-events-none"></div>
            
            {/* LOADING SCREEN OVERLAY */}
            {step === 'LOADING' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 animate-fade-in">
                    
                    {/* PHASE 1: PREPARING */}
                    {loadingPhase === 'PREPARING' && (
                        <div className="text-center animate-fade-in-up">
                            <div className="relative w-24 h-24 mx-auto mb-8">
                                {/* Outer Ring */}
                                <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                                {/* Spinner */}
                                <div className="absolute inset-0 border-4 border-t-orange-500 border-r-orange-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                {/* Icon */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-white animate-pulse">settings</span>
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Preparando seu ambiente de trabalho...</h2>
                            <p className="text-slate-400 text-sm">Configurando banco de dados, IA e permissões.</p>
                        </div>
                    )}

                    {/* PHASE 2: TYPING LOGO */}
                    {loadingPhase === 'TYPING' && (
                        <div className="flex flex-col items-center justify-center">
                            <div className="relative">
                                {/* Glow behind text */}
                                <div className="absolute -inset-10 bg-orange-500/20 blur-[50px] rounded-full"></div>
                                
                                <h1 className="relative text-8xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-amber-600">
                                    {typedText}
                                    <span className="text-orange-400 animate-pulse">|</span>
                                </h1>
                            </div>
                            <p className="mt-8 text-slate-500 text-sm font-mono tracking-widest uppercase animate-fade-in">
                                Sistema Iniciado
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Scrollable Content Wrapper (Hidden during loading) */}
            <div className={`relative z-10 flex flex-col min-h-full transition-opacity duration-500 ${step === 'LOADING' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {/* Header */}
                <header className="px-8 py-6 flex justify-between items-center shrink-0">
                    <Logo className="h-8" textClassName="text-xl text-white" />
                    <button onClick={onLogout} className="text-slate-400 hover:text-white text-sm font-bold transition-colors">
                        Sair
                    </button>
                </header>

                <div className="flex-1 flex flex-col items-center justify-center p-6 w-full">
                    
                    {step === 'OFFER_REVEAL' && (
                        <div className="max-w-4xl w-full animate-fade-in-up my-auto">
                            <div className="text-center mb-10">
                                <h1 className="text-3xl md:text-5xl font-black mb-4">Bem-vindo à elite, {user.name.split(' ')[0]}.</h1>
                                <p className="text-slate-400 text-lg">Preparamos algo especial para o seu início.</p>
                            </div>

                            {/* THE "COOL AD" CARD */}
                            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-1 border border-slate-700 shadow-2xl mx-auto max-w-3xl group hover:scale-[1.01] transition-transform duration-500">
                                {/* Glowing Border Effect */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 rounded-[2.6rem] blur opacity-30 group-hover:opacity-60 transition-opacity duration-1000"></div>
                                
                                <div className="relative bg-[#0F172A] rounded-[2.4rem] p-8 md:p-12 overflow-hidden">
                                    {/* Golden Ticket Visuals */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                                    <div className="flex flex-col md:flex-row items-center gap-10">
                                        
                                        {/* Left Content */}
                                        <div className="flex-1 text-center md:text-left">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-widest mb-6">
                                                <span className="material-symbols-outlined text-sm icon-filled">diamond</span>
                                                Acesso VIP Liberado
                                            </div>
                                            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-4 text-white">
                                                7 Dias de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Poder Ilimitado</span>
                                            </h2>
                                            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                                Esqueça planos básicos. Você vai começar com <strong>tudo liberado</strong>. 
                                                IA conversacional, gestão completa e sem limites.
                                            </p>
                                            
                                            <div className="flex flex-col gap-3">
                                                <button 
                                                    onClick={handleAcceptTrial}
                                                    className="w-full md:w-fit px-8 py-4 bg-white text-slate-900 rounded-xl font-black text-lg hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                                                >
                                                    Ativar Meus 7 Dias Grátis
                                                    <span className="material-symbols-outlined">arrow_forward</span>
                                                </button>
                                                <p className="text-xs text-slate-500 text-center md:text-left pl-2">
                                                    Depois R$ 50/mês. Cancele a qualquer momento.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right Visual (Feature List) */}
                                        <div className="w-full md:w-80 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/5">
                                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">O que está incluso:</h3>
                                            <ul className="space-y-4">
                                                {[
                                                    "IA Gemini (Voz & Texto)", 
                                                    "Vendas Ilimitadas", 
                                                    "Emissão de Recibos",
                                                    "Gestão de Fiado",
                                                    "Acesso Multi-usuário"
                                                ].map((item, i) => (
                                                    <li key={i} className="flex items-center gap-3 text-slate-200 text-sm font-medium">
                                                        <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-xs font-bold">check</span>
                                                        </div>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'STORE_SETUP' && (
                        <div className="max-w-md w-full animate-fade-in-up my-auto">
                            <button onClick={() => setStep('OFFER_REVEAL')} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm transition-colors">
                                <span className="material-symbols-outlined">arrow_back</span> Voltar
                            </button>

                            <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-700 shadow-2xl">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-900/50">
                                        <span className="material-symbols-outlined text-3xl text-white">store</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-white">Qual o nome da sua loja?</h2>
                                    <p className="text-slate-400 text-sm mt-2">Isso aparecerá nos seus recibos e relatórios.</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Nome Fantasia</label>
                                        <input 
                                            type="text" 
                                            autoFocus
                                            value={storeName}
                                            onChange={(e) => setStoreName(e.target.value)}
                                            placeholder="Ex: Capi Modas"
                                            className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700 text-lg font-bold text-white focus:ring-2 focus:ring-orange-500 outline-none placeholder:text-slate-600"
                                        />
                                    </div>

                                    <button 
                                        onClick={handleFinish}
                                        className="w-full py-4 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-200 transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">rocket_launch</span>
                                        Finalizar e Entrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
