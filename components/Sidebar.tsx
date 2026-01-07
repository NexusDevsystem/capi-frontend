
import React, { useState, useRef, useEffect } from 'react';
import { StoreSettings, User } from '../types';
import { Logo } from './Logo';
import { StoreSwitcher } from './StoreSwitcher';

interface SidebarProps {
    currentPage: string;
    onNavigate: (page: string) => void;
    settings: StoreSettings;
    user: User;
    isOpen: boolean;
    onClose: () => void;
    isDesktopOpen: boolean;
    onDesktopToggle: () => void;
    onLogout: () => void;
    onCreateStore?: () => void;
}

// --- SUBCOMPONENTS DEFINED OUTSIDE TO PREVENT RE-RENDERING ISSUES ---

interface NavItemProps {
    id: string;
    icon: string;
    label: string;
    badge?: string;
    currentPage: string;
    isDesktopOpen: boolean;
    onClick: (id: string) => void;
}

const NavItem: React.FC<NavItemProps> = ({ id, icon, label, badge, currentPage, isDesktopOpen, onClick }) => {
    const isActive = currentPage === id;

    return (
        <button
            onClick={() => onClick(id)}
            title={!isDesktopOpen ? label : ''}
            className={`
                group flex items-center transition-all duration-200 font-medium relative outline-none mb-1
                ${isDesktopOpen
                    ? 'w-full px-3 py-2.5 gap-3 rounded-xl mx-auto'
                    : 'w-12 h-12 justify-center rounded-xl mx-auto'
                }
                ${isActive
                    ? 'text-primary font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }
            `}
        >
            <span className={`material-symbols-outlined text-[22px] transition-colors ${isActive ? 'icon-filled' : ''}`}>
                {icon}
            </span>

            {isDesktopOpen && (
                <span className="truncate">{label}</span>
            )}

            {/* Badge */}
            {badge && (
                <span className={`
                    absolute ${isDesktopOpen ? 'right-3' : 'top-2 right-2'} 
                    bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full
                `}>
                    {badge}
                </span>
            )}
        </button>
    );
};

const SectionLabel = ({ label, isDesktopOpen }: { label: string, isDesktopOpen: boolean }) => {
    if (!isDesktopOpen) return <div className="h-4"></div>;
    return (
        <div className="px-4 py-2 mt-4 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {label}
        </div>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, settings, user, isOpen, onClose, isDesktopOpen, onDesktopToggle, onLogout, onCreateStore }) => {

    // Permissions Helper
    const isAdminOrManager = user.role === 'Administrador' || user.role === 'Gerente';

    // Profile Menu State
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigation = (page: string) => {
        onNavigate(page);
        onClose();
        setIsProfileMenuOpen(false);
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`
                    fixed md:relative top-0 left-0 h-full bg-white dark:bg-card-dark border-r border-slate-200 dark:border-slate-800 z-50 transition-all duration-300 flex flex-col
                    ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
                    ${isDesktopOpen ? 'md:w-64' : 'md:w-20'}
                `}
            >
                {/* Header with Store Logo/Name */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className={`${!isDesktopOpen && 'hidden md:flex justify-center w-full'}`}>
                        {user.storeLogo ? (
                            <img src={user.storeLogo} alt="Store Logo" className="h-12 w-auto object-contain" />
                        ) : (
                            isDesktopOpen ? <Logo className="h-14" /> : <Logo className="h-14" showText={false} />
                        )}
                    </div>
                    {/* Desktop Toggle */}
                    <button
                        onClick={onDesktopToggle}
                        className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <span className="material-symbols-outlined text-lg">
                            {isDesktopOpen ? 'menu_open' : 'menu'}
                        </span>
                    </button>
                    {/* Mobile Close */}
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 text-slate-400"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">

                    {/* Store Switcher - Multi-Store Support */}
                    {/* Show if user has stores array OR legacy storeId */}
                    {((user.stores && user.stores.length > 0) || user.storeId) && (
                        <div className="mb-4">
                            <StoreSwitcher onCreateStore={onCreateStore} />
                        </div>
                    )}

                    <NavItem id="dashboard" icon="grid_view" label="Visão Geral" currentPage={currentPage} isDesktopOpen={isDesktopOpen} onClick={handleNavigation} />

                    <SectionLabel label="Comercial" isDesktopOpen={isDesktopOpen} />
                    {settings.modules.pos && <NavItem id="pos" icon="point_of_sale" label="Frente de Caixa" currentPage={currentPage} isDesktopOpen={isDesktopOpen} onClick={handleNavigation} />}
                    {settings.modules.crm && <NavItem id="crm" icon="view_kanban" label="CRM / Vendas" currentPage={currentPage} isDesktopOpen={isDesktopOpen} onClick={handleNavigation} />}
                    {settings.modules.customerAccounts && <NavItem id="customer_accounts" icon="assignment_ind" label="Crediário" currentPage={currentPage} isDesktopOpen={isDesktopOpen} onClick={handleNavigation} />}
                    {settings.modules.services && <NavItem id="services" icon="build" label="Serviços (OS)" currentPage={currentPage} isDesktopOpen={isDesktopOpen} onClick={handleNavigation} />}
                    {settings.modules.inventory && <NavItem id="products" icon="inventory_2" label="Produtos" currentPage={currentPage} isDesktopOpen={isDesktopOpen} onClick={handleNavigation} />}

                    <SectionLabel label="Gestão" isDesktopOpen={isDesktopOpen} />
                    {settings.modules.finance && (
                        <>
                            {isAdminOrManager && <NavItem id="invoices" icon="receipt_long" label="Contas a Pagar" currentPage={currentPage} isDesktopOpen={isDesktopOpen} onClick={handleNavigation} />}
                        </>
                    )}
                    {settings.modules.reports && <NavItem id="reports" icon="bar_chart" label="Relatórios" currentPage={currentPage} isDesktopOpen={isDesktopOpen} onClick={handleNavigation} />}
                    <NavItem id="closings" icon="lock_clock" label="Fechamentos" currentPage={currentPage} isDesktopOpen={isDesktopOpen} onClick={handleNavigation} />

                    {(isAdminOrManager) && (
                        <>
                            <SectionLabel label="Admin" isDesktopOpen={isDesktopOpen} />
                            {settings.modules.team && <NavItem id="users" icon="group" label="Equipe" currentPage={currentPage} isDesktopOpen={isDesktopOpen} onClick={handleNavigation} />}
                            {settings.modules.suppliers && <NavItem id="suppliers" icon="local_shipping" label="Fornecedores" currentPage={currentPage} isDesktopOpen={isDesktopOpen} onClick={handleNavigation} />}
                        </>
                    )}
                </div>

                {/* Footer / Profile Menu */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 relative" ref={profileRef}>

                    {/* Pop-up Menu */}
                    {isProfileMenuOpen && (
                        <div className={`
                            absolute bg-white dark:bg-card-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 min-w-[220px] animate-fade-in-up
                            ${isDesktopOpen
                                ? 'bottom-[calc(100%+8px)] left-3 w-[calc(100%-24px)]'
                                : 'left-[calc(100%+8px)] bottom-0'
                            }
                        `}>
                            <div className="p-2 space-y-1">
                                <div className="px-3 py-2 mb-1 border-b border-slate-100 dark:border-slate-800 md:hidden">
                                    <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase">{user.storeName || 'Minha Loja'}</p>
                                    <p className="text-[10px] text-slate-500 font-bold truncate">{user.name}</p>
                                </div>

                                <button
                                    onClick={() => handleNavigation('profile')}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                                >
                                    <span className="material-symbols-outlined text-lg text-primary">person</span>
                                    Perfil
                                </button>

                                {isAdminOrManager && (
                                    <>
                                        <button
                                            onClick={() => handleNavigation('profile_billing')}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                                        >
                                            <span className="material-symbols-outlined text-lg text-primary">receipt_long</span>
                                            Faturas & Plano
                                        </button>
                                        <button
                                            onClick={() => handleNavigation('settings')}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                                        >
                                            <span className="material-symbols-outlined text-lg text-primary">settings</span>
                                            Configurações
                                        </button>
                                    </>
                                )}

                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

                                <button
                                    onClick={() => { onLogout(); setIsProfileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-left"
                                >
                                    <span className="material-symbols-outlined text-lg">logout</span>
                                    Sair
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className={`flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isProfileMenuOpen ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
                    >
                        <img src={user.avatarUrl} alt="User" className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700" />

                        {isDesktopOpen && (
                            <div className="text-left overflow-hidden flex-1">
                                <p className="text-sm font-black text-slate-900 dark:text-white truncate leading-tight uppercase tracking-tight">{user.storeName || 'Minha Loja'}</p>
                                <p className="text-[10px] text-slate-500 font-bold truncate tracking-wide">{user.name}</p>
                            </div>
                        )}

                        {isDesktopOpen && (
                            <span className={`material-symbols-outlined text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`}>expand_less</span>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
};
