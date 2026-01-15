
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import { compressImage } from '../utils/imageUtils';
import { Logo } from '../components/Logo';

interface AuthPageProps {
    initialMode: 'login' | 'register';
    onSuccess: (user: User) => void;
}

// --- MASK HELPERS ---
const maskCPF = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

const maskPhone = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
};

// --- COMPONENTS ---
const InputField = ({
    type = "text",
    label,
    value,
    onChange,
    placeholder,
    icon,
    required = true,
    autoFocus = false
}: { type?: string, label: string, value: string, onChange: (val: string) => void, placeholder?: string, icon?: string, required?: boolean, autoFocus?: boolean }) => {
    return (
        <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
            <div className={`
                flex items-center bg-white border border-slate-300 rounded-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent
            `}>
                <div className="pl-3 text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                </div>
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-transparent border-none py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:ring-0 text-sm font-medium outline-none"
                    required={required}
                    autoFocus={autoFocus}
                />
            </div>
        </div>
    );
};

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
    const navigate = useNavigate();

    // States
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Flow State: 'initial' | 'register_details'
    const [view, setView] = useState<'initial' | 'register_details'>('initial');

    // Registration Data
    const [googleData, setGoogleData] = useState<any>(null);
    const [storeName, setStoreName] = useState('');
    const [taxId, setTaxId] = useState('');
    const [phone, setPhone] = useState('');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    // Mockup Image URL (Local or Remote)
    const mockupUrl = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop";
    // Or prefer using the generated image if possible, but Unsplash is safer for direct URL usage in code without copy step.
    // The user saw the generated image, but to 'use' it in the code I need to put in public folder.
    // I'll stick to a high quality Unsplash URL for stability in this component code unless I move the file.


    // --- PROCESS USER SESSION ---
    const processUserSession = async (user: any) => {
        setIsLoading(true);
        setError('');

        try {
            const gData = {
                email: user.email || '',
                name: user.user_metadata?.full_name || user.user_metadata?.name || '',
                photoUrl: user.user_metadata?.avatar_url,
                googleId: user.id
            };

            const result = await authService.googleLogin(gData);

            if ('status' in result && result.status === 'new_user') {
                setGoogleData(result.googleData);
                setView('register_details');
                setIsLoading(false);
            } else {
                onSuccess(result as User);
                navigate('/app');
            }

        } catch (err: any) {
            setError(err.message || 'Erro ao autenticar.');
            await supabase.auth.signOut();
            setIsLoading(false);
        }
    };

    // --- GOOGLE HANDLER ---
    useEffect(() => {
        document.title = 'CAPI - Acesse sua conta';

        let isProcessing = false;

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (isProcessing) return;

            // Only process if user actively signed in or has valid session
            if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
                isProcessing = true;

                if (window.location.hash) {
                    window.history.replaceState(null, '', window.location.pathname);
                }

                await processUserSession(session.user);
                isProcessing = false;
            }

            // Handle INITIAL_SESSION - check if user exists in backend before auto-login
            if (session?.user && event === 'INITIAL_SESSION') {
                isProcessing = true;

                try {
                    // Check if user exists in backend
                    const gData = {
                        email: session.user.email || '',
                        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                        photoUrl: session.user.user_metadata?.avatar_url,
                        googleId: session.user.id
                    };

                    const result = await authService.googleLogin(gData);

                    // If user exists in backend, process session
                    if (!('status' in result)) {
                        onSuccess(result as User);
                        navigate('/app');
                    } else {
                        // New user - sign out to prevent auto-login
                        await supabase.auth.signOut();
                    }
                } catch (err) {
                    // User doesn't exist in backend - sign out
                    await supabase.auth.signOut();
                }

                isProcessing = false;
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleGoogleBtnClick = async () => {
        setError('');
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/login`
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (!storeName.trim()) throw new Error('Nome da loja é obrigatório.');
            if (!taxId) throw new Error('CPF é obrigatório.');

            await authService.registerWithGoogle(
                googleData,
                {
                    storeName,
                    taxId,
                    phone,
                    logoUrl,
                    ownerName: googleData.name
                },
                'owner'
            );

            const session = authService.getSession();
            if (session) {
                onSuccess(session);
                navigate('/app');
            } else {
                window.location.reload();
            }

        } catch (err: any) {
            setError(err.message || 'Erro ao finalizar cadastro.');
            setIsLoading(false);
        }
    };

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressed = await compressImage(file);
                setLogoUrl(compressed);
            } catch (e) {
                console.error(e);
            }
        }
    };

    return (
        <div className="h-screen w-full relative bg-[#fbfaf9] font-sans overflow-hidden">
            {/* Background Image - Full Screen */}
            <div className="absolute inset-0 z-0">
                <img src="/images/fundo.png" className="w-full h-full object-cover" alt="Background" />
            </div>

            {/* Content Wrapper */}
            <div className="relative z-10 w-full h-full flex">
                <Link to="/" className="absolute top-6 left-6 z-50 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-all text-slate-600 hover:text-slate-900 border border-slate-200 group">
                    <span className="material-symbols-outlined block group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                </Link>

                <div className="absolute top-6 right-6 z-50">
                    <Logo className="h-16" />
                </div>

                {/* LEFT SIDE: Card */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">

                    <div className="relative w-full max-w-[580px]">
                        {/* Decorative Stacked Cards */}
                        <div className="absolute w-[96%] left-1/2 -translate-x-1/2 h-full top-0 -translate-y-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm z-0 hidden md:block"></div>
                        <div className="absolute w-[92%] left-1/2 -translate-x-1/2 h-full top-0 -translate-y-4 bg-white rounded-[2rem] border border-slate-200 shadow-sm -z-10 hidden md:block"></div>

                        <div className="bg-white w-full rounded-[2rem] shadow-xl shadow-slate-200/60 p-10 md:p-14 border border-slate-200 flex flex-col text-left relative z-10 transition-all">

                            {view === 'initial' && (
                                <div className="w-full animate-fade-in-up text-left">
                                    <h1 className="text-4xl font-semibold text-[#0f172a] mb-2 tracking-tight leading-tight">
                                        Boas vindas ao <span className="text-orange-600 inline-block font-medium">Capi.</span>
                                    </h1>
                                    <p className="text-slate-500 mb-8 text-lg font-normal leading-relaxed">
                                        Teste gratuitamente entrando com a sua conta Google para começar a aproveitar nossa plataforma.
                                    </p>

                                    {error && (
                                        <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-semibold border border-red-100">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleGoogleBtnClick}
                                        disabled={isLoading}
                                        className="w-full py-3.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium text-base transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"
                                    >
                                        {isLoading ? (
                                            <span className="material-symbols-outlined animate-spin text-slate-400">progress_activity</span>
                                        ) : (
                                            <>
                                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6 group-hover:scale-110 transition-transform" alt="Google" />
                                                Entrar com o Google
                                            </>
                                        )}
                                    </button>

                                    <p className="mt-8 text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                                        Ao continuar, você concorda com todos os nossos <a href="#" className="underline hover:text-slate-600">termos e condições</a>.
                                    </p>
                                </div>
                            )}

                            {view === 'register_details' && (
                                <div className="w-full text-left animate-slide-in-right">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Quase lá!</h2>
                                    <p className="text-slate-500 mb-6 text-sm">
                                        Complete os dados do seu estabelecimento para finalizar.
                                    </p>

                                    {error && (
                                        <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-semibold border border-red-100">
                                            {error}
                                        </div>
                                    )}

                                    <form onSubmit={handleRegisterSubmit}>
                                        {/* Logo Upload Mini */}
                                        <div className="flex justify-center mb-6">
                                            <label className="cursor-pointer group relative">
                                                <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden hover:border-green-500 transition-colors">
                                                    {logoUrl ? (
                                                        <img src={logoUrl} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-slate-400 group-hover:text-green-500">add_a_photo</span>
                                                    )}
                                                </div>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                                                <span className="text-[10px] text-slate-400 mt-1 block text-center uppercase font-bold tracking-wide group-hover:text-green-600">Logo</span>
                                            </label>
                                        </div>

                                        <InputField
                                            label="Nome da Loja"
                                            value={storeName}
                                            onChange={setStoreName}
                                            placeholder="Ex: Boutique da Ana"
                                            icon="storefront"
                                            autoFocus
                                        />

                                        <InputField
                                            label="CPF do Responsável"
                                            value={taxId}
                                            onChange={(v) => setTaxId(maskCPF(v))}
                                            placeholder="000.000.000-00"
                                            icon="badge"
                                        />

                                        <InputField
                                            label="Celular / WhatsApp"
                                            value={phone}
                                            onChange={(v) => setPhone(maskPhone(v))}
                                            placeholder="(00) 00000-0000"
                                            icon="call"
                                            required={false}
                                        />

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full mt-2 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200 transform active:scale-95"
                                        >
                                            {isLoading ? (
                                                <span className="material-symbols-outlined animate-spin text-white">progress_activity</span>
                                            ) : (
                                                <>Finalizar Cadastro <span className="material-symbols-outlined">arrow_forward</span></>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>


                {/* RIGHT SIDE: Mockup - Hidden on Mobile */}
                <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-center">
                    <div className="relative z-50 w-full max-w-[95%] perspective-1000">
                        {/* Mockup Container */}
                        <div className="relative transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out">
                            {/* MacBook Frame - White */}
                            <div className="bg-white p-[2%] pt-[2.5%] pb-[4%] rounded-[1.75rem] shadow-2xl shadow-slate-300/50 ring-1 ring-slate-200 relative">
                                {/* Camera Dot */}
                                <div className="absolute top-[1.2%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-300 rounded-full z-20"></div>

                                <img
                                    src="/images/screenshot.png"
                                    alt="Dashboard Mockup"
                                    className="w-full rounded-lg block"
                                />
                            </div>

                            {/* Floating Element 1 - Mobile Mockup Overlay */}
                            <div className="absolute -bottom-12 -left-4 w-48 md:w-56 transform translate-z-20 animate-float-slow">
                                <div className="bg-white p-2 rounded-[2.5rem] shadow-[25px_0_25px_rgba(0,0,0,0.15)]">
                                    <img
                                        src="/images/iPhone-13-PRO-www.capipay.com.br.png"
                                        alt="Mobile Version"
                                        className="w-full rounded-[2rem] border border-slate-100"
                                    />
                                </div>
                            </div>


                        </div>
                    </div>

                    <div className="relative z-10 mt-12 text-center max-w-md px-6">
                        <h3 className="text-2xl font-bold text-white mb-2">Gestão completa para seu negócio</h3>
                        <p className="text-white/90">Controle financeiro, estoque e vendas em um só lugar.</p>
                    </div>
                </div>
            </div>


        </div>
    );
};

