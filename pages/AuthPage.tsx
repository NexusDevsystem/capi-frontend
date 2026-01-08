
import React, { useState, useEffect, useRef } from 'react';
import { Logo } from '../components/Logo';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface AuthPageProps {
    initialMode: 'login' | 'register';
    onSuccess: (user: User) => void;
}

// --- Mask Helpers ---
const maskCNPJ = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

const maskPhone = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
};

// --- Modern Checkbox (Orange) ---
const Checkbox = ({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: (checked: boolean) => void }) => (
    <div className="flex items-center gap-3 relative group">
        <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="peer appearance-none h-5 w-5 border-2 border-slate-300 rounded-md checked:bg-orange-500 checked:border-orange-500 transition-all cursor-pointer shadow-sm"
        />
        <span className="material-symbols-outlined absolute left-[2px] top-[2px] text-white text-base pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity">check</span>
        <label htmlFor={id} className="text-sm text-slate-600 cursor-pointer select-none group-hover:text-slate-900 transition-colors font-medium">{label}</label>
    </div>
);

// --- Modern Input (Orange Focus) ---
const InputField = ({
    type = "text",
    label,
    value,
    onChange,
    placeholder,
    icon,
    required = true
}: { type?: string, label: string, value: string, onChange: (val: string) => void, placeholder?: string, icon?: string, required?: boolean }) => {
    const [focused, setFocused] = useState(false);

    return (
        <div className="relative group">
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ml-1 transition-colors ${focused ? 'text-orange-600' : 'text-slate-500'}`}>{label}</label>
            <div className={`
                flex items-center bg-slate-50/50 border-2 rounded-xl transition-all duration-300 ease-out overflow-hidden
                ${focused ? 'border-orange-500 bg-white shadow-xl shadow-orange-500/10 scale-[1.01]' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
            `}>
                <div className={`pl-4 pr-3 text-slate-400 transition-colors ${focused ? 'text-orange-500' : ''}`}>
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                </div>
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={placeholder}
                    autoComplete="off"
                    className="w-full bg-transparent border-none py-3.5 px-0 text-slate-900 placeholder:text-slate-400 focus:ring-0 text-base font-semibold outline-none"
                    required={required}
                />
            </div>
        </div>
    );
};

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode, onSuccess }) => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'login' | 'register'>(initialMode);
    const [regStep, setRegStep] = useState(0); // 0: Type, 1: Basic, 2: Detail, 3: Success

    // --- Login State ---
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // --- Register State ---
    const [regType, setRegType] = useState<'owner' | 'employee'>('owner');
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPass, setRegPass] = useState('');
    const [regStoreName, setRegStoreName] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regTaxId, setRegTaxId] = useState('');
    const [regStoreLogo, setRegStoreLogo] = useState<string | null>(null);

    // --- Code Input Refs ---
    const [inviteCode, setInviteCode] = useState(['', '', '', '', '', '']);
    const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode]);

    const handleInviteCodeChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newCode = [...inviteCode];
        newCode[index] = value.toUpperCase();
        setInviteCode(newCode);

        // Auto move focus
        if (value && index < 5) {
            codeRefs.current[index + 1]?.focus();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setRegStoreLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const user = await authService.login(loginEmail, loginPass);
            onSuccess(user);
            navigate('/app');
        } catch (err: any) {
            setError(err.message || 'Email ou senha incorretos.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            let user: User;

            if (regType === 'owner') {
                if (!regTaxId) throw new Error('O CNPJ da loja é obrigatório.');
                user = await authService.register(regName, regEmail, regPhone, regPass, regTaxId, undefined, regStoreName, regStoreLogo || undefined);
            } else {
                const phone = regPhone || '00000000000';
                user = await authService.register(regName, regEmail, phone, regPass);
            }

            setRegStep(3);

            setTimeout(() => {
                onSuccess(user);
                navigate('/app');
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Erro ao criar conta. Tente novamente.');
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-full flex flex-col md:flex-row bg-white dark:bg-[#0c0a09] font-display overflow-hidden selection:bg-orange-100 selection:text-orange-900">

            {/* LEFT SIDE: VISUALS */}
            <div className="hidden md:flex w-1/2 lg:w-5/12 bg-slate-900 relative overflow-hidden flex-col justify-between p-12">

                {/* Image Composition */}
                <div className="absolute inset-0 z-0">
                    <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600" className="w-full h-full object-cover opacity-60" alt="Shop Interior" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent mix-blend-multiply"></div>
                </div>

                {/* Decorative Circles */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen"></div>

                <div className="relative z-10 w-full">
                    <div onClick={() => navigate('/')} className="cursor-pointer inline-block group">
                        <img
                            src="/images/favicon.png"
                            alt="CAPI Logo"
                            className="h-16 w-auto mb-6 group-hover:scale-105 transition-transform origin-left"
                        />
                    </div>
                </div>

                <div className="relative z-10 text-white space-y-10 max-w-lg">
                    <h2 className="text-5xl font-black leading-tight tracking-tight drop-shadow-sm">
                        O sistema operacional do seu <span className="text-orange-500">comércio</span>.
                    </h2>

                    <div className="grid gap-6">
                        <div className="flex items-start gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-400 font-bold text-lg group-hover:bg-orange-500 group-hover:text-white group-hover:scale-110 transition-all shadow-lg shadow-black/20">1</div>
                            <div className="pt-1">
                                <h4 className="font-bold text-lg mb-1 group-hover:text-orange-200 transition-colors">Gestão Inteligente</h4>
                                <p className="text-slate-300 text-sm leading-relaxed">Controle estoque, financeiro e clientes em um único lugar.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-400 font-bold text-lg group-hover:bg-orange-500 group-hover:text-white group-hover:scale-110 transition-all shadow-lg shadow-black/20">2</div>
                            <div className="pt-1">
                                <h4 className="font-bold text-lg mb-1 group-hover:text-orange-200 transition-colors">IA Integrada</h4>
                                <p className="text-slate-300 text-sm leading-relaxed">Cadastre produtos e vendas usando apenas sua voz.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-400 font-bold text-lg group-hover:bg-orange-500 group-hover:text-white group-hover:scale-110 transition-all shadow-lg shadow-black/20">3</div>
                            <div className="pt-1">
                                <h4 className="font-bold text-lg mb-1 group-hover:text-orange-200 transition-colors">Crescimento Real</h4>
                                <p className="text-slate-300 text-sm leading-relaxed">Relatórios detalhados para você tomar as melhores decisões.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: FORMS */}
            <div className={`
                md:w-1/2 lg:w-7/12 bg-white dark:bg-[#0c0a09] flex flex-col px-6 py-12 sm:px-12 md:px-24 relative transition-opacity duration-500 overflow-y-auto h-full overflow-x-hidden
                opacity-100
            `}>
                {/* Back Button - Visible on all screens */}
                <div className="mb-8">
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-orange-600 transition-all group">
                        <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Voltar para o site
                    </button>
                </div>

                <div className="w-full max-w-[420px] mx-auto my-auto">

                    {/* --- ERROR MESSAGE --- */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-3 animate-head-shake shadow-sm">
                            <span className="material-symbols-outlined filled">error</span>
                            {error}
                        </div>
                    )}

                    {/* --- LOGIN FORM --- */}
                    {mode === 'login' && regStep !== 3 && (
                        <div className="animate-fade-in-up">
                            <div className="mb-10 text-center md:text-left">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Bem-vindo de volta!</h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">Digite suas credenciais para acessar.</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 ml-1 text-slate-500">Email Profissional</label>
                                    <div className="flex items-center bg-slate-50/50 border-2 rounded-xl border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
                                        <div className="pl-4 pr-3 text-slate-400">
                                            <span className="material-symbols-outlined text-[20px]">mail</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={loginEmail}
                                            onChange={(e) => setLoginEmail(e.target.value)}
                                            placeholder="nome@suaempresa.com"
                                            autoComplete="off"
                                            name="email-random-capi"
                                            className="w-full bg-transparent border-none py-3.5 px-0 text-slate-900 placeholder:text-slate-400 focus:ring-0 text-base font-semibold outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 ml-1 text-slate-500">Sua Senha</label>
                                    <div className="flex items-center bg-slate-50/50 border-2 rounded-xl border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
                                        <div className="pl-4 pr-3 text-slate-400">
                                            <span className="material-symbols-outlined text-[20px]">lock</span>
                                        </div>
                                        <input
                                            type="password"
                                            value={loginPass}
                                            onChange={(e) => setLoginPass(e.target.value)}
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            name="password-random-capi"
                                            className="w-full bg-transparent border-none py-3.5 px-0 text-slate-900 placeholder:text-slate-400 focus:ring-0 text-base font-semibold outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <Checkbox id="remember" label="Lembrar acesso" checked={rememberMe} onChange={setRememberMe} />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg transition-all transform hover:-translate-y-1 active:translate-y-0 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isLoading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <>Entrar no Sistema <span className="material-symbols-outlined">arrow_forward</span></>}
                                </button>
                            </form>

                            <div className="mt-12 text-center pt-6 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-slate-500 dark:text-slate-400 font-medium">
                                    Não tem uma conta? <button onClick={() => { setMode('register'); setRegStep(0); }} className="text-orange-600 font-bold hover:text-orange-700 hover:underline ml-1 transition-colors">Cadastre-se grátis</button>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* --- REGISTER STEP 0: TYPE SELECTION --- */}
                    {mode === 'register' && regStep === 0 && (
                        <div className="animate-fade-in-up">
                            <div className="mb-10 text-center md:text-left">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Criar nova conta</h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">Selecione o seu perfil para continuar.</p>
                            </div>

                            <div className="grid gap-4">
                                <button
                                    onClick={() => { setRegType('owner'); setRegStep(1); }}
                                    className="p-6 rounded-2xl bg-white hover:bg-orange-50/50 transition-all group text-left relative overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-1"
                                >
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className="w-14 h-14 rounded-full bg-slate-100 group-hover:bg-orange-100 group-hover:text-orange-600 flex items-center justify-center text-slate-500 transition-all">
                                            <span className="material-symbols-outlined text-3xl">storefront</span>
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-900 block text-lg group-hover:text-orange-700 transition-colors">Sou Dono(a)</span>
                                            <span className="text-sm text-slate-500 group-hover:text-orange-800/60 font-medium">Quero gerenciar meu negócio e equipe</span>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => { setRegType('employee'); setRegStep(1); }}
                                    className="p-6 rounded-2xl bg-white hover:bg-blue-50/50 transition-all group text-left relative overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-1"
                                >
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className="w-14 h-14 rounded-full bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-600 flex items-center justify-center text-slate-500 transition-all">
                                            <span className="material-symbols-outlined text-3xl">badge</span>
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-900 block text-lg group-hover:text-blue-700 transition-colors">Sou Colaborador</span>
                                            <span className="text-sm text-slate-500 group-hover:text-blue-800/60 font-medium">Tenho um código de convite da loja</span>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            <div className="mt-12 text-center pt-6 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-slate-500 dark:text-slate-400 font-medium">
                                    Já possui cadastro? <button onClick={() => setMode('login')} className="text-orange-600 font-bold hover:text-orange-700 hover:underline ml-1 transition-colors">Fazer Login</button>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* --- REGISTER STEP 1 (OWNER): DATA --- */}
                    {mode === 'register' && regStep === 1 && regType === 'owner' && (
                        <div className="animate-slide-in-right">
                            <div className="flex items-center mb-8 gap-4">
                                <button onClick={() => setRegStep(0)} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors">
                                    <span className="material-symbols-outlined">arrow_back</span>
                                </button>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Sobre a Loja</h2>
                                    <div className="flex gap-1.5 mt-1.5">
                                        <div className="h-1.5 w-8 rounded-full bg-orange-500"></div>
                                        <div className="h-1.5 w-2 rounded-full bg-slate-200"></div>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); setRegStep(2); }} className="space-y-5">
                                {/* Logo Upload */}
                                <div className="flex flex-col items-center gap-4 mb-6">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 self-start ml-1">Logo da Loja</label>
                                    <div className="relative group cursor-pointer">
                                        <div className="w-32 h-32 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-orange-500 group-hover:bg-orange-50/30">
                                            {regStoreLogo ? (
                                                <img src={regStoreLogo} alt="Logo Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-slate-400 text-4xl mb-1 group-hover:text-orange-500 group-hover:scale-110 transition-all">add_photo_alternate</span>
                                                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-orange-600 uppercase">Subir Logo</span>
                                                </>
                                            )}
                                        </div>
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        {regStoreLogo && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setRegStoreLogo(null); }}
                                                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-base">close</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <InputField label="Nome do Estabelecimento" value={regStoreName} onChange={setRegStoreName} placeholder="Ex: Mercado Silva, Boutique Flor..." icon="store" />
                                <InputField label="CNPJ da Loja" value={regTaxId} onChange={(val) => setRegTaxId(maskCNPJ(val))} placeholder="00.000.000/0000-00" icon="corporate_fare" />
                                <InputField label="Seu Nome Completo" value={regName} onChange={setRegName} placeholder="Como quer ser chamado?" icon="person" />
                                <InputField label="Celular / WhatsApp" value={regPhone} onChange={(val) => setRegPhone(maskPhone(val))} placeholder="(00) 00000-0000" icon="call" />

                                <button type="submit" className="w-full py-4 mt-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                                    Continuar <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                            </form>
                        </div>
                    )}

                    {/* --- REGISTER STEP 2 (OWNER): CREDENTIALS --- */}
                    {mode === 'register' && regStep === 2 && regType === 'owner' && (
                        <div className="animate-slide-in-right">
                            <div className="flex items-center mb-8 gap-4">
                                <button onClick={() => setRegStep(1)} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors">
                                    <span className="material-symbols-outlined">arrow_back</span>
                                </button>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Acesso Seguro</h2>
                                    <div className="flex gap-1.5 mt-1.5">
                                        <div className="h-1.5 w-2 rounded-full bg-green-500/30"></div>
                                        <div className="h-1.5 w-8 rounded-full bg-green-500"></div>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-5">
                                <InputField label="Email de Acesso" type="email" value={regEmail} onChange={setRegEmail} placeholder="exemplo@email.com" icon="mail" />
                                <InputField label="Senha Segura" type="password" value={regPass} onChange={setRegPass} placeholder="Mínimo 8 caracteres" icon="lock" />
                                <InputField label="Confirmar Senha" type="password" value={regPass} onChange={() => { }} placeholder="Repita a senha" icon="verified_user" />

                                <button type="submit" disabled={isLoading} className="w-full py-4 mt-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                                    {isLoading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <>Finalizar e Entrar <span className="material-symbols-outlined">check_circle</span></>}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* --- REGISTER STEP (EMPLOYEE): SIMPLE REGISTRATION --- */}
                    {mode === 'register' && regStep === 1 && regType === 'employee' && (
                        <div className="animate-slide-in-right">
                            <div className="flex items-center mb-8 gap-4">
                                <button onClick={() => setRegStep(0)} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors">
                                    <span className="material-symbols-outlined">arrow_back</span>
                                </button>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Criar Conta</h2>
                                    <p className="text-sm text-slate-500">Preencha seus dados para começar</p>
                                </div>
                            </div>

                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">info</span>
                                    <div>
                                        <p className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-1">Como funciona?</p>
                                        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                            Após criar sua conta, peça para o gerente da loja adicionar seu email na aba <strong>"Equipe"</strong>.
                                            Você receberá acesso assim que ele vincular você à loja.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-5">
                                <InputField label="Seu Nome Completo" value={regName} onChange={setRegName} icon="person" />
                                <InputField label="Email Pessoal" value={regEmail} onChange={setRegEmail} icon="mail" />
                                <InputField label="WhatsApp" value={regPhone} onChange={(val) => setRegPhone(maskPhone(val))} icon="call" required={false} />
                                <InputField label="Crie uma Senha" type="password" value={regPass} onChange={setRegPass} icon="lock" />

                                <button type="submit" disabled={isLoading} className="w-full py-4 mt-2 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                                    {isLoading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <>Criar Conta <span className="material-symbols-outlined">check_circle</span></>}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* --- SUCCESS STATE --- */}
                    {regStep === 3 && (
                        <div className="text-center animate-pop-in py-10">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6 shadow-xl">
                                <span className="material-symbols-outlined text-5xl">check_rounded</span>
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Tudo Pronto!</h2>
                            <p className="text-slate-500 text-lg font-medium">Estamos configurando seu ambiente...</p>
                            <div className="mt-10 flex justify-center">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce"></div>
                                    <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce delay-100"></div>
                                    <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce delay-200"></div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div >
        </div >
    );
};
