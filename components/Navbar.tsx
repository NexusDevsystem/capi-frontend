import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { Logo } from '../components/Logo';
import { User } from '../types';

interface NavbarProps {
    transparent?: boolean;
    currentUser?: User | null;
    onLogout?: () => void;
    scrollContainerRef?: React.RefObject<HTMLElement>;
}

export const Navbar: React.FC<NavbarProps> = ({ transparent = false, currentUser, onLogout, scrollContainerRef }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = React.useRef<HTMLDivElement>(null);
    const navbarRef = React.useRef<HTMLDivElement>(null);
    const navContainerRef = React.useRef<HTMLElement>(null);

    // Hover States for Dropdowns
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // Scroll Listener
    useEffect(() => {
        const handleScroll = () => {
            if (scrollContainerRef && scrollContainerRef.current) {
                setIsScrolled(scrollContainerRef.current.scrollTop > 50);
            } else {
                setIsScrolled(window.scrollY > 50);
            }
        };

        const target = scrollContainerRef?.current || window;
        target.addEventListener('scroll', handleScroll as EventListener);

        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            target.removeEventListener('scroll', handleScroll as EventListener);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [scrollContainerRef]);

    // GSAP Elastic Animation on state change
    useEffect(() => {
        if (navbarRef.current && navContainerRef.current) {
            const tl = gsap.timeline();

            if (isScrolled) {
                // Transitioning to floating state - PULL FROM EDGES TO CENTER
                tl.to(navbarRef.current, {
                    scaleY: 0.85,
                    duration: 0.2,
                    ease: 'power2.in'
                })
                    .to(navbarRef.current, {
                        scaleY: 1,
                        duration: 0.5,
                        ease: 'elastic.out(1, 0.5)'
                    }, '-=0.05');

                // Animate container width with ELASTIC - creates edge-pulling effect
                gsap.to(navContainerRef.current, {
                    width: '95%',
                    maxWidth: '896px',
                    top: '1rem',
                    duration: 0.8,
                    ease: 'elastic.out(1, 0.4)'
                });
            } else {
                // Transitioning to fixed state
                tl.to(navbarRef.current, {
                    scaleX: 0.92,
                    duration: 0.25,
                    ease: 'power2.in'
                })
                    .to(navbarRef.current, {
                        scaleX: 1,
                        duration: 0.6,
                        ease: 'elastic.out(1, 0.6)'
                    }, '-=0.05');

                // Animate container
                gsap.to(navContainerRef.current, {
                    width: '100%',
                    maxWidth: 'none',
                    top: '0rem',
                    duration: 0.7,
                    ease: 'power3.out'
                });
            }
        }
    }, [isScrolled]);

    const scrollToTop = () => {
        if (scrollContainerRef && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleNavigation = (path: string, hash?: string) => {
        if (location.pathname !== '/' && !path.startsWith('http')) {
            navigate('/' + (hash ? hash : ''));
        } else if (hash) {
            const element = document.getElementById(hash.replace('#', ''));
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        } else {
            navigate(path);
        }
    };

    const isFloating = isScrolled || !transparent;

    return (
        <nav ref={navContainerRef} className={`
            fixed z-50 left-1/2 -translate-x-1/2
            ${isFloating ? 'top-4 w-[95%] max-w-4xl' : 'top-0 w-full'}
        `}
            onMouseLeave={() => setActiveMenu(null)}
        >
            <div ref={navbarRef} className={`
                relative flex items-center justify-between
                ${isFloating
                    ? 'bg-white border border-slate-200/50 shadow-2xl rounded-full py-3 px-6'
                    : 'bg-transparent px-6 py-3 w-full'
                }
            `}>
                {/* LOGO */}
                <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => navigate('/')}>
                    <Logo className={isFloating ? "h-10 w-auto" : "h-12 w-auto"} textClassName={isFloating ? "text-xl" : "text-2xl"} />
                </div>

                {/* DESKTOP MENU */}
                <div className={`hidden md:flex items-center gap-8 font-bold text-slate-500 tracking-wide transition-all duration-500 h-full ${isFloating ? 'text-xs gap-6' : 'text-sm gap-8'}`}>

                    <button onClick={() => handleNavigation('/', '#ai-demo')} className="hover:text-orange-600 transition-colors">IA</button>

                    {/* DROPDOWN: PRODUTO */}
                    <div className="relative group text-left h-full flex items-center"
                        onMouseEnter={() => setActiveMenu('produto')}>
                        <button className="flex items-center gap-1 hover:text-orange-600 transition-colors py-2">
                            Produto
                            <span className="material-symbols-outlined text-sm">expand_more</span>
                        </button>

                        {/* Mega Menu */}
                        {activeMenu === 'produto' && (
                            <div className="absolute top-[100%] left-1/2 -translate-x-1/2 pt-4 w-[200px]">
                                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <button onClick={() => handleNavigation('/', '#features')} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl flex items-start gap-3 group/item transition-colors">
                                        <div>
                                            <div className="font-bold text-slate-900 mb-0.5 group-hover/item:text-orange-600 transition-colors">Funcionalidades</div>
                                            <div className="text-xs text-slate-400 font-normal">Tudo o que o CAPI oferece</div>
                                        </div>
                                    </button>
                                    <button onClick={() => handleNavigation('/', '#pricing')} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl flex items-start gap-3 group/item transition-colors">
                                        <div>
                                            <div className="font-bold text-slate-900 mb-0.5 group-hover/item:text-green-600 transition-colors">Planos & Preços</div>
                                            <div className="text-xs text-slate-400 font-normal">Opções acessíveis</div>
                                        </div>
                                    </button>
                                    <div className="h-px bg-slate-100 my-1"></div>
                                    <button onClick={() => navigate('/updates')} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl flex items-start gap-3 group/item transition-colors">
                                        <div>
                                            <div className="font-bold text-slate-900 mb-0.5 group-hover/item:text-blue-600 transition-colors">Novidades</div>
                                            <div className="text-xs text-slate-400 font-normal">Changelog & Updates</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* DROPDOWN: RECURSOS */}
                    <div className="relative group text-left h-full flex items-center"
                        onMouseEnter={() => setActiveMenu('recursos')}>
                        <button className="flex items-center gap-1 hover:text-orange-600 transition-colors py-2">
                            Recursos
                            <span className="material-symbols-outlined text-sm">expand_more</span>
                        </button>

                        {/* Mega Menu */}
                        {activeMenu === 'recursos' && (
                            <div className="absolute top-[100%] left-1/2 -translate-x-1/2 pt-4 w-[180px]">
                                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <button onClick={() => navigate('/docs')} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl flex items-center gap-3 hover:text-orange-600 transition-colors">
                                        <span className="font-bold text-slate-700 hover:text-orange-600">Documentação</span>
                                    </button>
                                    <button className="w-full text-left p-3 hover:bg-slate-50 rounded-xl flex items-center gap-3 hover:text-orange-600 transition-colors">
                                        <span className="font-bold text-slate-700 hover:text-orange-600">Blog</span>
                                    </button>
                                    <button className="w-full text-left p-3 hover:bg-slate-50 rounded-xl flex items-center gap-3 hover:text-orange-600 transition-colors">
                                        <span className="font-bold text-slate-700 hover:text-orange-600">Suporte</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* USER ACTIONS */}
                <div className="flex items-center gap-4">
                    {currentUser ? (
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className={`flex items-center gap-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors ${isFloating ? 'pl-1 pr-3 py-1' : 'pl-1 pr-4 py-1.5'}`}
                            >
                                {currentUser.avatarUrl ? (
                                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-8 h-8 rounded-full border border-white" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold border border-white">
                                        {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                                    </div>
                                )}
                                <span className="text-sm font-bold text-slate-700 hidden sm:block">
                                    {currentUser.name ? currentUser.name.split(' ')[0] : 'Usuário'}
                                </span>
                                <span className={`material-symbols-outlined text-sm text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`}>expand_more</span>
                            </button>

                            {/* Profile Dropdown */}
                            {isProfileOpen && (
                                <div className="absolute top-[120%] right-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-50">
                                        <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                                    </div>
                                    <div className="p-1">
                                        <button onClick={() => navigate('/app')} className="w-full text-left px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">dashboard</span>
                                            Acessar Sistema
                                        </button>
                                        <button onClick={() => navigate('/app/settings')} className="w-full text-left px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">settings</span>
                                            Configurações
                                        </button>
                                        <div className="h-px bg-slate-100 my-1"></div>
                                        <button onClick={onLogout} className="w-full text-left px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">logout</span>
                                            Sair
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <button onClick={() => navigate('/login')} className={`${isFloating ? 'px-6 py-2 text-xs' : 'px-8 py-2.5 text-sm'} bg-orange-600 text-white rounded-full font-bold hover:bg-orange-700 transition-all hover:scale-105 shadow-lg shadow-orange-500/20`}>
                                Login
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};
