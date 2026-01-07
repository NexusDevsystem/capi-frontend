
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { abacatePayService } from '../services/abacatePayService';
import { Logo } from '../components/Logo';
import { useNavigate } from 'react-router-dom';

interface PaymentPageProps {
    // Make user optional, we can try to get it from session
    user?: User;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({ user: initialUser }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(initialUser || authService.getSession());

    // Adicionado estado WAITING_PAYMENT
    const [step, setStep] = useState<'INTRO' | 'LOADING_CHECKOUT' | 'CHECKING' | 'WAITING_PAYMENT' | 'SUCCESS'>('INTRO');
    const [showContent, setShowContent] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Ref para controlar o intervalo de verificação
    const pollingInterval = useRef<any>(null);

    useEffect(() => {
        if (!user) {
            // Se não tem usuário, redireciona para login
            navigate('/login');
            return;
        }
        setTimeout(() => setShowContent(true), 100);

        // Limpar intervalo ao desmontar
        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [user, navigate]);

    // Efeito para Polling Automático
    useEffect(() => {
        if (step === 'WAITING_PAYMENT' && user) {
            // Verifica imediatamente
            checkPaymentAuto();

            // Configura intervalo de 3 segundos
            pollingInterval.current = setInterval(() => {
                checkPaymentAuto();
            }, 3000);
        } else {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        }
    }, [step, user]);

    const checkPaymentAuto = async () => {
        if (!user) return;
        try {
            const status = await abacatePayService.checkPaymentStatus(user.email);

            if (status === 'ACTIVE') {
                if (pollingInterval.current) clearInterval(pollingInterval.current);

                // Ativa a assinatura
                const updatedUser = await authService.activateSubscription(user.id);
                setStep('SUCCESS');

                // Redireciona após animação
                setTimeout(() => {
                    navigate('/app');
                }, 3000);
            }
            // Se for PENDING, continua rodando o intervalo...
        } catch (e) {
            console.error("Erro silencioso no polling:", e);
            // Não muda o estado para erro para não interromper o fluxo do usuário, apenas loga
        }
    };

    const handleGoToCheckout = async () => {
        if (!user) return;
        setStep('LOADING_CHECKOUT');
        setErrorMsg('');

        try {
            // A AbacatePay exige CPF. Se não tiver, pede.
            let taxIdToUse = user.taxId;

            if (!taxIdToUse || taxIdToUse.length < 11) {
                const cpfInput = prompt("Para emitir o Pix, a AbacatePay exige um CPF válido. Digite seu CPF (apenas números):");
                if (cpfInput && cpfInput.length >= 11) {
                    taxIdToUse = cpfInput;
                    // Atualiza localmente o objeto user para esta sessão
                    user.taxId = cpfInput;
                    authService.updateProfile(user);
                    setUser({ ...user, taxId: cpfInput });
                } else {
                    setStep('INTRO');
                    return; // Usuário cancelou ou digitou inválido
                }
            }

            const checkoutUrl = await abacatePayService.createCheckout(user);

            // Redireciona para a página de pagamento
            window.open(checkoutUrl, '_blank');

            // Em vez de voltar para INTRO, vai para WAITING_PAYMENT
            setStep('WAITING_PAYMENT');

        } catch (error: any) {
            console.error(error);
            setStep('INTRO');
            setErrorMsg("Erro: " + (error.message || "Tente novamente."));
        }
    };

    const handleVerifyPaymentManual = async () => {
        if (!user) return;
        setStep('CHECKING');
        setErrorMsg('');

        try {
            const status = await abacatePayService.checkPaymentStatus(user.email);

            if (status === 'ACTIVE') {
                const updatedUser = await authService.activateSubscription(user.id);
                setStep('SUCCESS');
                setTimeout(() => {
                    navigate('/app');
                }, 2500);
            } else {
                setStep('INTRO');
                setErrorMsg("Pagamento ainda não identificado. O Pix é instantâneo, mas pode levar alguns segundos.");
            }
        } catch (e) {
            setStep('INTRO');
            setErrorMsg("Erro ao verificar. Tente novamente.");
        }
    };

    // --- Background Layers ---
    const BackgroundLayers = () => (
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#0c0a09]">
            {/* Mesh Gradients - Green Theme for Avocado */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-green-600/20 rounded-full blur-[120px] opacity-40 animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] opacity-40"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        </div>
    );

    if (step === 'SUCCESS') {
        return (
            <div className="h-screen w-full flex items-center justify-center relative overflow-hidden font-display bg-[#0c0a09]">
                <BackgroundLayers />
                <div className="bg-white/5 backdrop-blur-2xl p-12 rounded-[2.5rem] shadow-2xl border border-white/10 text-center max-w-md w-full relative animate-zoom-in">

                    <div className="w-24 h-24 bg-gradient-to-tr from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-500/20">
                        <span className="material-symbols-outlined text-5xl animate-bounce">verified</span>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Pagamento Confirmado!</h2>
                    <p className="text-slate-400 mb-8 font-medium text-lg">Seu acesso CAPI Pro foi liberado.</p>

                    <div className="h-1.5 w-48 bg-slate-800 rounded-full mx-auto overflow-hidden">
                        <div className="h-full bg-green-500 animate-[loading_1.5s_ease-in-out_infinite]"></div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 mt-4 tracking-widest uppercase">Redirecionando...</p>
                </div>
            </div>
        );
    }

    if (step === 'CHECKING' || step === 'LOADING_CHECKOUT' || step === 'WAITING_PAYMENT') {
        return (
            <div className="h-screen w-full flex items-center justify-center relative overflow-hidden font-display bg-[#0c0a09]">
                <BackgroundLayers />
                <div className="bg-white/5 backdrop-blur-2xl p-12 rounded-[2.5rem] shadow-2xl border border-white/10 text-center max-w-md w-full relative animate-fade-in">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-green-500 border-r-green-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl text-green-500">
                                {step === 'LOADING_CHECKOUT' ? 'credit_card' : 'sync'}
                            </span>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">
                        {step === 'LOADING_CHECKOUT' ? 'Gerando Cobrança...' : 'Aguardando Pagamento...'}
                    </h2>
                    <div className="text-slate-400 text-sm mb-6 flex items-center justify-center gap-2">
                        {step === 'LOADING_CHECKOUT'
                            ? 'Conectando com AbacatePay'
                            : (
                                <>
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Monitorando em tempo real
                                </>
                            )
                        }
                    </div>

                    {step === 'WAITING_PAYMENT' && (
                        <button
                            onClick={() => setStep('INTRO')}
                            className="text-xs font-bold text-slate-500 hover:text-white underline transition-colors"
                        >
                            Cancelar ou Tentar Novamente
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (!user) return null; // Should redirect in useEffect

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative font-display py-8 px-4 sm:px-6">
            <BackgroundLayers />

            <div className={`
                max-w-5xl w-full bg-white dark:bg-[#1E293B] rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row relative z-10 transition-all duration-700
                ${showContent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'}
            `}>

                {/* LEFT: Value Proposition (Dark Themed) */}
                <div className="md:w-5/12 bg-[#1c1917] p-10 md:p-12 flex flex-col justify-between relative overflow-hidden text-white">
                    {/* Texture */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.8))] z-0"></div>
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-500/20 rounded-full blur-[80px]"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-10">
                            <Logo className="h-8" textClassName="text-white text-xl" />
                            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-sm">arrow_back</span>
                                Voltar
                            </button>
                        </div>

                        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-black uppercase tracking-widest">
                            <span className="material-symbols-outlined text-sm icon-filled">diamond</span>
                            Plano Pro
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                            Desbloqueie o poder total do <span className="text-green-500">CAPI.</span>
                        </h2>
                        <p className="text-stone-400 text-lg leading-relaxed font-medium">
                            Gestão profissional, IA ilimitada e acesso para toda sua equipe.
                        </p>
                    </div>

                    <div className="relative z-10 mt-12 space-y-5">
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-green-400 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined">auto_awesome</span>
                            </div>
                            <div>
                                <p className="font-bold text-white">IA Gemini Ilimitada</p>
                                <p className="text-xs text-stone-500">Lance tudo por voz.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-green-400 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined">group_add</span>
                            </div>
                            <div>
                                <p className="font-bold text-white">Multi-usuários</p>
                                <p className="text-xs text-stone-500">Gerentes e Vendedores.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Action (Light Themed) */}
                <div className="md:w-7/12 p-10 md:p-14 bg-white relative flex flex-col justify-center">

                    <div className="text-center mb-10">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Assinatura Mensal</p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-2xl text-slate-400 line-through font-bold">R$ 99</span>
                            <span className="text-7xl font-black text-slate-900 tracking-tighter">R$ 49<span className="text-3xl text-slate-400">,90</span></span>
                        </div>
                        <p className="text-slate-500 font-medium mt-2">Processado via AbacatePay (Pix).</p>
                    </div>

                    {errorMsg && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl text-center border border-red-100 animate-fade-in-up">
                            {errorMsg}
                        </div>
                    )}

                    <div className="space-y-4 max-w-sm mx-auto w-full">
                        {/* Main CTA */}
                        <button
                            onClick={handleGoToCheckout}
                            className="w-full py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-green-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Gerar Pagamento
                                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </span>
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        </button>

                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Já realizou o pagamento?</span>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        {/* Secondary Action */}
                        <button
                            onClick={handleVerifyPaymentManual}
                            className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-2xl font-bold text-sm transition-colors border border-slate-200 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">sync</span>
                            Verificar Manualmente
                        </button>
                    </div>

                    <div className="mt-10 flex items-center justify-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-slate-400">lock</span>
                            <span className="text-[10px] font-bold text-slate-500">Pagamento Seguro via AbacatePay</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
