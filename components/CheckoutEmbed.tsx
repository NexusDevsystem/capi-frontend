import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { caktoService } from '../services/caktoService';
import { Logo } from './Logo';

interface CheckoutEmbedProps {
    user: User;
    onSuccess: () => void;
    onCancel: () => void;
}

export const CheckoutEmbed: React.FC<CheckoutEmbedProps> = ({ user, onSuccess, onCancel }) => {
    const [step, setStep] = useState<'INTRO' | 'LOADING_CHECKOUT' | 'CHECKING' | 'WAITING_PAYMENT' | 'SUCCESS'>('INTRO');
    const [errorMsg, setErrorMsg] = useState('');
    const pollingInterval = useRef<any>(null);

    // Limpar intervalo ao desmontar
    useEffect(() => {
        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, []);

    // Efeito para Polling Automático
    useEffect(() => {
        if (step === 'WAITING_PAYMENT' && user) {
            checkPaymentAuto();
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
            const status = await caktoService.checkPaymentStatus(user.email);
            if (status === 'ACTIVE') {
                if (pollingInterval.current) clearInterval(pollingInterval.current);
                await authService.activateSubscription(user.id);
                setStep('SUCCESS');
                setTimeout(() => {
                    onSuccess();
                }, 3000);
            }
        } catch (e) {
            console.error("Erro silencioso no polling:", e);
        }
    };

    const handleGoToCheckout = () => {
        if (!user) return;
        setStep('LOADING_CHECKOUT');
        setErrorMsg('');

        try {
            const checkoutUrl = caktoService.getCheckoutUrl();
            window.open(checkoutUrl, '_blank');
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
            const status = await caktoService.checkPaymentStatus(user.email);
            if (status === 'ACTIVE') {
                try {
                    await authService.activateSubscription(user.id);
                    setStep('SUCCESS');
                    setTimeout(() => onSuccess(), 2500);
                } catch (activationError: any) {
                    setStep('INTRO');
                    setErrorMsg(activationError.message || "Erro ao ativar assinatura.");
                }
            } else {
                setStep('INTRO');
                setErrorMsg("Pagamento ainda não identificado. Complete o pagamento via Pix primeiro.");
            }
        } catch (e: any) {
            setStep('INTRO');
            setErrorMsg(e.message || "Erro ao verificar. Tente novamente.");
        }
    };

    if (step === 'SUCCESS') {
        return (
            <div className="w-full bg-[#0c0a09] rounded-[2.5rem] p-12 text-center text-white shadow-2xl relative overflow-hidden animate-zoom-in">
                <div className="w-24 h-24 bg-gradient-to-tr from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-500/20">
                    <span className="material-symbols-outlined text-5xl animate-bounce">verified</span>
                </div>
                <h2 className="text-4xl font-black mb-2 tracking-tight">Pagamento Confirmado!</h2>
                <p className="text-slate-400 mb-8 font-medium text-lg">Seu acesso CAPI Pro foi liberado.</p>
                <div className="h-1.5 w-48 bg-slate-800 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-green-500 animate-[loading_1.5s_ease-in-out_infinite]"></div>
                </div>
            </div>
        );
    }

    if (step === 'CHECKING' || step === 'LOADING_CHECKOUT' || step === 'WAITING_PAYMENT') {
        return (
            <div className="w-full bg-[#0c0a09] rounded-[2.5rem] p-12 text-center text-white shadow-2xl relative overflow-hidden animate-fade-in">
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-green-500 border-r-green-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-green-500">
                            {step === 'LOADING_CHECKOUT' ? 'credit_card' : 'sync'}
                        </span>
                    </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">
                    {step === 'LOADING_CHECKOUT' ? 'Gerando Cobrança...' : 'Aguardando Pagamento...'}
                </h2>
                <div className="text-slate-400 text-sm mb-6 flex items-center justify-center gap-2">
                    {step === 'LOADING_CHECKOUT' ? 'Conectando com AbacatePay' : (
                        <>
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Monitorando em tempo real
                        </>
                    )}
                </div>
                {step === 'WAITING_PAYMENT' && (
                    <button onClick={() => setStep('INTRO')} className="text-xs font-bold text-slate-500 hover:text-white underline transition-colors">
                        Cancelar ou Tentar Novamente
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="w-full bg-white dark:bg-[#1E293B] rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row relative z-10">
            {/* LEFT: Value Proposition (Dark Themed) */}
            <div className="md:w-5/12 bg-[#1c1917] p-5 md:p-10 flex flex-col justify-between relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.8))] z-0"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-500/20 rounded-full blur-[80px]"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-8">
                        <Logo className="h-6" textClassName="text-white text-lg" />
                        <button onClick={onCancel} className="flex items-center gap-1 text-white/50 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-sm">close</span>
                            Fechar
                        </button>
                    </div>

                    <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-black uppercase tracking-widest">
                        <span className="material-symbols-outlined text-sm icon-filled">diamond</span>
                        Plano Pro
                    </div>

                    <h2 className="text-3xl font-black text-white mb-4 leading-[1.1] tracking-tight">
                        Desbloqueie o poder total do <span className="text-green-500">CAPI.</span>
                    </h2>
                    <p className="text-stone-400 text-sm leading-relaxed font-medium">
                        Gestão profissional, IA ilimitada e acesso para toda sua equipe.
                    </p>
                </div>

                {/* Benefits List inside logic if needed, but keeping simple for embed */}
            </div>

            {/* RIGHT: Action (Light Themed) */}
            <div className="md:w-7/12 p-5 md:p-10 bg-white relative flex flex-col justify-center">
                <div className="text-center mb-8">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Assinatura Mensal</p>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-xl text-slate-400 line-through font-bold">R$ 99</span>
                        <span className="text-5xl font-black text-slate-900 tracking-tighter">R$ 49<span className="text-2xl text-slate-400">,90</span></span>
                    </div>
                    <p className="text-slate-500 font-medium mt-2 text-xs">Processado via CAKTO (Pix, Cartão, Boleto).</p>
                </div>

                {errorMsg && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl text-center border border-red-100 animate-fade-in-up">
                        {errorMsg}
                    </div>
                )}

                {/* Warning Alert */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-amber-600 mt-0.5">warning</span>
                        <div className="text-sm">
                            <p className="font-bold text-amber-900 mb-1">Atenção Crítica</p>
                            <p className="text-amber-800 leading-relaxed">
                                Use o <strong>MESMO EMAIL</strong> da sua conta CAPI ({user.email}) na hora do pagamento.
                                <br />
                                <span className="text-xs mt-1 block opacity-80">Se usar outro email, o sistema não reconhecerá o pagamento.</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 max-w-xs mx-auto w-full">
                    <button
                        onClick={handleGoToCheckout}
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-black text-base shadow-lg shadow-green-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Gerar Pagamento
                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </button>

                    <div className="flex items-center gap-4 py-2">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Já realizou o pagamento?</span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <button
                        onClick={handleVerifyPaymentManual}
                        className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl font-bold text-xs transition-colors border border-slate-200 flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-base">sync</span>
                        Verificar Manualmente
                    </button>
                </div>
            </div>
        </div>
    );
};
