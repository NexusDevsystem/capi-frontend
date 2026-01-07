
import React, { useEffect, useRef } from 'react';
import { Transaction, StoreSettings, User } from '../types';

interface ReceiptModalProps {
    transaction: Transaction;
    settings: StoreSettings;
    onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, settings, onClose }) => {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    // Helper to calculate totals
    const subtotal = transaction.items 
        ? transaction.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0) 
        : transaction.amount;

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:p-0 print:bg-white">
            
            {/* Modal Container */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] print:max-w-none print:shadow-none print:max-h-none print:w-full print:rounded-none">
                
                {/* Screen Header (Hidden on Print) */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 print:hidden">
                    <h3 className="font-bold text-slate-900 dark:text-white">Visualizar Recibo</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                {/* Receipt Content (Scrollable on Screen, Full on Print) */}
                <div className="flex-1 overflow-y-auto bg-slate-200/50 dark:bg-black/20 p-6 print:p-0 print:overflow-visible">
                    
                    {/* The Actual Receipt Ticket */}
                    <div 
                        id="receipt-content" 
                        ref={componentRef}
                        className="bg-[#fffdf0] text-slate-900 font-mono text-xs md:text-sm shadow-sm mx-auto w-full max-w-[320px] p-5 print:max-w-full print:shadow-none print:w-full print:mx-0"
                        style={{ fontFamily: '"Courier New", Courier, monospace' }}
                    >
                        {/* Header */}
                        <div className="text-center mb-4">
                            <h2 className="text-xl font-bold uppercase tracking-widest border-b-2 border-dashed border-slate-300 pb-2 mb-2">
                                {settings.storeName}
                            </h2>
                            <p className="text-[10px] text-slate-500 uppercase">Comprovante de Venda</p>
                            <p className="text-[10px] text-slate-500">{formatDate(transaction.date)}</p>
                            <p className="text-[10px] text-slate-500">ID: {transaction.id.slice(-8)}</p>
                        </div>

                        {/* Items */}
                        <div className="mb-4">
                            <div className="flex justify-between border-b border-dashed border-slate-400 pb-1 mb-2 font-bold text-[10px] uppercase">
                                <span>Item</span>
                                <div className="text-right flex gap-4">
                                    <span>Qtd</span>
                                    <span>Valor</span>
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                {transaction.items && transaction.items.length > 0 ? (
                                    transaction.items.map((item, idx) => (
                                        <div key={idx} className="flex flex-col">
                                            <span className="uppercase font-bold truncate">{item.productName}</span>
                                            <div className="flex justify-between text-slate-600">
                                                <span className="pl-2 text-[10px]">x {formatCurrency(item.unitPrice)}</span>
                                                <div className="flex gap-4">
                                                    <span>{item.quantity}</span>
                                                    <span className="font-bold text-slate-900">{formatCurrency(item.total)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex justify-between">
                                        <span className="uppercase">{transaction.description}</span>
                                        <span className="font-bold">{formatCurrency(transaction.amount)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="border-t-2 border-dashed border-slate-300 pt-2 space-y-1 mb-6">
                            <div className="flex justify-between text-slate-500">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            {/* Can add discounts here if implemented later */}
                            <div className="flex justify-between text-lg font-bold border-t border-slate-300 pt-1 mt-1">
                                <span>TOTAL</span>
                                <span>{formatCurrency(transaction.amount)}</span>
                            </div>
                            <div className="flex justify-between text-xs pt-1">
                                <span className="uppercase">Pagamento ({transaction.paymentMethod})</span>
                                <span>{formatCurrency(transaction.amount)}</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center text-[10px] text-slate-500 border-t border-dashed border-slate-300 pt-4">
                            <p>Obrigado pela preferência!</p>
                            <p className="mt-1">Volte sempre.</p>
                            <div className="mt-4 pt-2 border-t border-slate-200 flex justify-center items-center gap-1 opacity-50">
                                <span className="material-symbols-outlined text-[10px]">bolt</span>
                                <span>Emitido via CAPI</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Actions (Hidden on Print) */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3 print:hidden">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3 text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                        Fechar
                    </button>
                    <button 
                        onClick={handlePrint} 
                        className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined">print</span>
                        Imprimir
                    </button>
                </div>
            </div>

            {/* Print Styling Injection */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #receipt-content, #receipt-content * {
                        visibility: visible;
                    }
                    #receipt-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        background: white !important;
                        color: black !important;
                    }
                    @page {
                        size: auto;
                        margin: 0mm;
                    }
                }
            `}</style>
        </div>
    );
};
