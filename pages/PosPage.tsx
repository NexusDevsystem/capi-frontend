
import React, { useState, useEffect, useRef } from 'react';
import { Product, PaymentMethod, CustomerAccount } from '../types';

interface PosPageProps {
    products: Product[];
    customers: CustomerAccount[];
    onFinalizeSale: (cart: { product: Product, quantity: number }[], total: number, method: PaymentMethod, customerId?: string, discount?: number, notes?: string, cashbackAmount?: number) => void;
}

export const PosPage: React.FC<PosPageProps> = ({ products, customers, onFinalizeSale }) => {
    const [cart, setCart] = useState<{ product: Product, quantity: number }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Sale Data
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [discount, setDiscount] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    // Payment Data
    const [amountReceived, setAmountReceived] = useState('');
    const [applyCashback, setApplyCashback] = useState(false); // New state for cashback

    // UI States
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

    // Scanner buffer Logic
    const bufferRef = useRef<string>("");
    const lastKeyTimeRef = useRef<number>(0);
    const receivedInputRef = useRef<HTMLInputElement>(null);

    // --- Cart Logic ---
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { product, quantity: 1 }];
        });
        if (navigator.vibrate) navigator.vibrate(50);
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const subTotal = cart.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);
    const discountValue = parseFloat(discount) || 0;
    const finalTotal = Math.max(0, subTotal - discountValue);
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    // Troco Calculation
    const changeValue = Math.max(0, (parseFloat(amountReceived) || 0) - finalTotal);

    // Cashback Calculation (5% example)
    const cashbackValue = applyCashback ? (finalTotal * 0.05) : 0;

    // --- Scanner Logic ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const char = e.key;
            const currentTime = Date.now();

            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'SELECT') {
                return;
            }

            if (currentTime - lastKeyTimeRef.current > 100) {
                bufferRef.current = "";
            }
            lastKeyTimeRef.current = currentTime;

            if (char === 'Enter') {
                if (bufferRef.current.length > 0) {
                    const scannedCode = bufferRef.current;
                    const foundProduct = products.find(p => p.barcode === scannedCode || p.sku === scannedCode);

                    if (foundProduct) {
                        addToCart(foundProduct);
                    }
                    bufferRef.current = "";
                }
            } else if (char.length === 1) {
                bufferRef.current += char;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [products]);

    useEffect(() => {
        if (isPaymentModalOpen) {
            setAmountReceived('');
            setSelectedMethod(null);
            setApplyCashback(false); // Reset cashback checkbox
        }
    }, [isPaymentModalOpen]);

    const handleInitiatePayment = () => {
        if (cart.length === 0) return;
        setIsPaymentModalOpen(true);
    };

    const handleSelectMethod = (method: PaymentMethod) => {
        setSelectedMethod(method);

        if (method === 'Dinheiro') {
            setTimeout(() => receivedInputRef.current?.focus(), 100);
        } else if (method === 'Pix' && selectedCustomerId) {
            // Stay in menu to offer cashback option, maybe focus on checkbox?
        } else {
            confirmSale(method);
        }
    };

    const confirmSale = (method: PaymentMethod) => {
        onFinalizeSale(
            cart,
            finalTotal,
            method,
            selectedCustomerId || undefined,
            discountValue > 0 ? discountValue : undefined,
            notes || undefined,
            cashbackValue > 0 ? cashbackValue : undefined
        );
        // Reset
        setCart([]);
        setDiscount('');
        setSelectedCustomerId('');
        setNotes('');
        setAmountReceived('');
        setIsPaymentModalOpen(false);
        setIsMobileCartOpen(false);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm)) ||
        (p.sku && p.sku.includes(searchTerm))
    );

    return (
        <div className="flex h-full flex-col md:flex-row overflow-hidden bg-slate-100 dark:bg-background-dark relative">

            {/* LEFT: Product List (Grid) */}
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full pb-[80px] md:pb-0">
                <div className="p-4 bg-white dark:bg-card-dark flex flex-col md:flex-row items-center gap-4 shrink-0 z-20 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between w-full md:w-auto gap-3">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary hidden md:block">
                                <span className="material-symbols-outlined">point_of_sale</span>
                            </div>
                            <div>
                                <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Frente de Caixa</h1>
                                <p className="text-xs text-slate-500 hidden md:block">Caixa Livre</p>
                            </div>
                        </div>
                        <div className="md:hidden">
                            <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold">
                                {products.length} itens
                            </div>
                        </div>
                    </div>

                    <div className="w-full flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar produto, SKU ou código..."
                            className="w-full pl-10 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 bg-slate-50 dark:bg-[#0f172a]">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="bg-white dark:bg-card-dark rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[160px] cursor-pointer hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                                        <span className="material-symbols-outlined text-sm">add</span>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block truncate">
                                        {product.sku || 'SEM SKU'}
                                    </span>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 leading-snug">
                                        {product.name}
                                    </h3>
                                </div>

                                <div className="mt-2">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400">Preço</span>
                                            <span className="font-black text-slate-900 dark:text-white text-lg">
                                                {product.salePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${product.stock <= product.minStock ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                                            {product.stock} un
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {cart.length > 0 && (
                <div
                    onClick={() => setIsMobileCartOpen(true)}
                    className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 dark:bg-black text-white p-4 z-40 flex items-center justify-between cursor-pointer shadow-[0_-4px_20px_rgba(0,0,0,0.2)] animate-slide-in-right"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-lg">
                            {totalItems}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-400">Total a pagar</span>
                            <span className="font-bold text-lg">{formatCurrency(finalTotal)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-sm bg-primary px-4 py-2 rounded-lg">
                        Ver Sacola
                        <span className="material-symbols-outlined text-sm">expand_less</span>
                    </div>
                </div>
            )}

            <div
                className={`
                    fixed inset-0 z-[60] bg-white dark:bg-card-dark flex flex-col shadow-2xl transition-transform duration-300
                    md:relative md:z-20 md:w-[400px] md:translate-y-0 md:border-l md:border-slate-200 dark:md:border-slate-800
                    ${isMobileCartOpen ? 'translate-y-0' : 'translate-y-full'}
                `}
            >
                <div className="p-4 bg-white dark:bg-card-dark border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3 shadow-sm z-10">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Carrinho</h2>
                            <p className="text-slate-500 text-xs">{cart.length} itens lançados</p>
                        </div>
                        <button
                            onClick={() => setIsMobileCartOpen(false)}
                            className="md:hidden w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
                        >
                            <span className="material-symbols-outlined">expand_more</span>
                        </button>
                    </div>

                    <div className="relative">
                        <select
                            value={selectedCustomerId}
                            onChange={(e) => setSelectedCustomerId(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-white appearance-none outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Consumidor Final (Não Identificado)</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm pointer-events-none">person</span>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm pointer-events-none">expand_more</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900/50">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                            <span className="material-symbols-outlined text-6xl mb-4">remove_shopping_cart</span>
                            <p className="font-bold">Carrinho Vazio</p>
                            <p className="text-xs mt-1">Selecione produtos para vender</p>
                        </div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={`${item.product.id}-${idx}`} className="flex items-center gap-3 p-3 bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in group">
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{item.product.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{formatCurrency(item.product.salePrice)} un</span>
                                    </div>
                                </div>
                                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); updateQuantity(item.product.id, -1); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-card-dark shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 active:scale-95 transition-transform"
                                    >
                                        -
                                    </button>
                                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); updateQuantity(item.product.id, 1); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-card-dark shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 active:scale-95 transition-transform"
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="flex flex-col items-end gap-1 min-w-[60px]">
                                    <span className="font-black text-slate-900 dark:text-white text-sm">{formatCurrency(item.product.salePrice * item.quantity)}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFromCart(item.product.id); }}
                                        className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-white dark:bg-card-dark border-t border-slate-200 dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Subtotal</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(subTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 flex items-center gap-1">Desconto (R$)</span>
                            <div className="relative w-24">
                                <input
                                    type="number"
                                    value={discount}
                                    onChange={(e) => setDiscount(e.target.value)}
                                    placeholder="0,00"
                                    className="w-full text-right p-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-red-600 font-bold focus:ring-1 focus:ring-red-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Observação</span>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Opcional..."
                                className="w-1/2 text-right p-1 bg-transparent border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 focus:border-primary outline-none text-xs"
                            />
                        </div>
                        <div className="flex justify-between items-end border-t border-slate-100 dark:border-slate-700 pt-3">
                            <div>
                                <p className="text-slate-500 text-xs font-bold uppercase mb-1">Total Final</p>
                                <p className="text-slate-400 text-xs">{totalItems} volumes</p>
                            </div>
                            <div className="text-right">
                                <span className="text-4xl font-black text-primary tracking-tight">{formatCurrency(finalTotal)}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleInitiatePayment}
                        disabled={cart.length === 0}
                        className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-lg font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        <span>Finalizar Venda</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>
            </div>

            {/* --- PAYMENT MODAL --- */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-card-dark w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-zoom-in">
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                                {selectedMethod === 'Dinheiro' ? 'Calcular Troco' : (selectedMethod === 'Pix' && selectedCustomerId ? 'Fidelidade Pix' : 'Registrar Pagamento')}
                            </h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="text-center mb-6">
                                <p className="text-slate-500 text-sm mb-1 uppercase font-bold">Total a Pagar</p>
                                <p className="text-4xl font-black text-slate-900 dark:text-white">{formatCurrency(finalTotal)}</p>
                                {discountValue > 0 && <p className="text-xs text-red-500 mt-1">Desconto aplicado: {formatCurrency(discountValue)}</p>}
                                {selectedCustomerId && (
                                    <p className="text-xs text-blue-600 mt-1 bg-blue-50 inline-block px-2 py-1 rounded">
                                        Cliente: {customers.find(c => c.id === selectedCustomerId)?.name}
                                    </p>
                                )}
                            </div>

                            {/* --- MODO PIX COM FIDELIDADE --- */}
                            {selectedMethod === 'Pix' && selectedCustomerId ? (
                                <div className="animate-fade-in">
                                    <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-white dark:bg-orange-900 p-2 rounded-full text-orange-600">
                                                <span className="material-symbols-outlined">stars</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-orange-800 dark:text-orange-400 text-sm">Fidelidade Pix</h4>
                                                <p className="text-xs text-orange-700 dark:text-orange-500 mt-1 leading-snug">
                                                    Incentive o cliente a usar Pix devolvendo 5% do valor como crédito na loja.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between bg-white dark:bg-card-dark p-3 rounded-lg border border-orange-100 dark:border-orange-900">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="cashback-toggle"
                                                    checked={applyCashback}
                                                    onChange={(e) => setApplyCashback(e.target.checked)}
                                                    className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500"
                                                />
                                                <label htmlFor="cashback-toggle" className="text-sm font-bold text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                                                    Gerar Cashback (Crédito)
                                                </label>
                                            </div>
                                            <span className="font-black text-green-600">{formatCurrency(finalTotal * 0.05)}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button onClick={() => setSelectedMethod(null)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Voltar</button>
                                        <button onClick={() => confirmSale('Pix')} className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined">check</span> Confirmar Pix
                                        </button>
                                    </div>
                                </div>
                            ) : selectedMethod === 'Dinheiro' ? (
                                <div className="animate-fade-in">
                                    <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Valor Recebido (R$)</label>
                                        <input
                                            ref={receivedInputRef}
                                            type="number"
                                            value={amountReceived}
                                            onChange={e => setAmountReceived(e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-2xl font-black text-center text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-300"
                                            placeholder="0,00"
                                        />
                                        {changeValue > 0 && (
                                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center animate-fade-in">
                                                <span className="text-sm font-bold text-slate-500 uppercase">Troco</span>
                                                <span className="text-2xl font-black text-green-600 dark:text-green-400">{formatCurrency(changeValue)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setSelectedMethod(null)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Voltar</button>
                                        <button onClick={() => confirmSale('Dinheiro')} className="flex-[2] py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined">check</span> Confirmar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-fade-in">
                                    <p className="text-xs text-slate-400 text-center mb-4 uppercase font-bold">Selecione o Método</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <PaymentButton icon="qr_code_2" label="Pix" color="text-emerald-600 bg-emerald-50 border-emerald-200 hover:border-emerald-400" onClick={() => handleSelectMethod('Pix')} />
                                        <PaymentButton icon="payments" label="Dinheiro" color="text-green-600 bg-green-50 border-green-200 hover:border-green-400" onClick={() => handleSelectMethod('Dinheiro')} />
                                        <PaymentButton icon="credit_card" label="Crédito" color="text-blue-600 bg-blue-50 border-blue-200 hover:border-blue-400" onClick={() => handleSelectMethod('Crédito')} />
                                        <PaymentButton icon="credit_card" label="Débito" color="text-indigo-600 bg-indigo-50 border-indigo-200 hover:border-indigo-400" onClick={() => handleSelectMethod('Débito')} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PaymentButton = ({ icon, label, onClick, color }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all hover:-translate-y-1 hover:shadow-lg ${color}`}>
        <span className="material-symbols-outlined text-4xl">{icon}</span>
        <span className="font-bold text-slate-900 dark:text-slate-900">{label}</span>
    </button>
);
