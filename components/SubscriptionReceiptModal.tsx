
import React, { useRef } from 'react';
import { PlatformInvoice, User } from '../types';
import { Logo } from './Logo';

interface SubscriptionReceiptModalProps {
    invoice: PlatformInvoice;
    user: User;
    onClose: () => void;
}

export const SubscriptionReceiptModal: React.FC<SubscriptionReceiptModalProps> = ({ invoice, user, onClose }) => {
    const ticketRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContent = ticketRef.current;
        if (!printContent) return;
        
        // Criar iframe oculto para impressão
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(`
                <html>
                <head>
                    <title>Comprovante CAPI #${invoice.id}</title>
                    <style>
                        body { margin: 0; padding: 20px; font-family: sans-serif; display: flex; justify-content: center; }
                        .ticket { width: 320px; border: 1px solid #ddd; padding: 0; border-radius: 10px; overflow: hidden; }
                        .header { background: #ea580c; color: white; padding: 20px; text-align: center; }
                        .body { padding: 20px; background: white; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
                        .label { color: #666; font-weight: bold; font-size: 10px; text-transform: uppercase; }
                        .value { color: #000; font-weight: bold; }
                        .amount { font-size: 24px; color: #ea580c; text-align: center; margin: 20px 0; font-weight: 900; }
                        .divider { border-top: 2px dashed #ddd; margin: 15px 0; }
                        .footer { text-align: center; font-size: 10px; color: #888; margin-top: 10px; }
                        .status { display: inline-block; padding: 4px 8px; background: #dcfce7; color: #166534; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
                    </style>
                </head>
                <body>
                    <div class="ticket">
                        <div class="header">
                            <h1>CAPI</h1>
                            <p>Comprovante de Assinatura</p>
                        </div>
                        <div class="body">
                            <div class="amount">R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(invoice.amount)}</div>
                            <div style="text-align:center; margin-bottom: 20px;">
                                <span class="status">Pagamento Confirmado</span>
                            </div>
                            
                            <div class="row">
                                <span class="label">Data</span>
                                <span class="value">${new Date(invoice.date).toLocaleDateString()}</span>
                            </div>
                            <div class="row">
                                <span class="label">Método</span>
                                <span class="value">${invoice.method || 'Pix'}</span>
                            </div>
                            <div class="row">
                                <span class="label">Transação ID</span>
                                <span class="value">#${invoice.id.replace('INV-', '')}</span>
                            </div>
                            
                            <div class="divider"></div>
                            
                            <div class="row">
                                <span class="label">Cliente</span>
                                <span class="value">${user.name}</span>
                            </div>
                            <div class="row">
                                <span class="label">Documento</span>
                                <span class="value">${user.taxId || '---'}</span>
                            </div>

                            <div class="footer">
                                Emitido automaticamente por CAPI System.<br/>
                                nexusdevsystem@gmail.com
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `);
            doc.close();
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            
            // Remover iframe após impressão
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-transparent w-full max-w-sm flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>
                
                {/* O TICKET VISUAL */}
                <div ref={ticketRef} className="w-full bg-white dark:bg-slate-50 rounded-3xl overflow-hidden shadow-2xl relative animate-zoom-in">
                    
                    {/* Header Laranja */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 text-center relative overflow-hidden">
                        {/* Círculos decorativos (Punch holes) */}
                        <div className="absolute -left-3 bottom-0 w-6 h-6 bg-black/80 rounded-full"></div>
                        <div className="absolute -right-3 bottom-0 w-6 h-6 bg-black/80 rounded-full"></div>
                        
                        <div className="flex justify-center mb-2 text-white">
                            <Logo showText={true} textClassName="text-white text-3xl" className="h-10 w-auto text-white fill-white" />
                        </div>
                        <p className="text-orange-100 text-xs font-bold uppercase tracking-[0.2em]">Recibo de Pagamento</p>
                    </div>

                    {/* Corpo do Ticket */}
                    <div className="p-8 relative">
                        {/* Linha tracejada do topo */}
                        <div className="absolute top-0 left-4 right-4 border-t-2 border-dashed border-slate-300"></div>

                        <div className="text-center mb-8 mt-2">
                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Valor Pago</p>
                            <h2 className="text-5xl font-black text-slate-900 tracking-tighter">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount)}
                            </h2>
                            <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                                <span className="material-symbols-outlined text-sm icon-filled">check_circle</span>
                                Aprovado
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase">Data</span>
                                <span className="font-bold text-slate-700 text-sm">{new Date(invoice.date).toLocaleDateString()} {new Date(invoice.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase">Método</span>
                                <span className="font-bold text-slate-700 text-sm flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">qr_code_2</span>
                                    {invoice.method || 'Pix'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase">Ref. ID</span>
                                <span className="font-mono text-slate-500 text-xs bg-slate-100 px-2 py-1 rounded">{invoice.id}</span>
                            </div>
                        </div>

                        {/* Linha Divisória */}
                        <div className="my-6 border-t-2 border-dashed border-slate-200"></div>

                        <div className="text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Beneficiário</p>
                            <p className="font-bold text-slate-800 text-sm">CAPI System Tecnologia</p>
                            <p className="text-[10px] text-slate-400 mt-4">Obrigado por assinar o plano Pro.</p>
                        </div>
                    </div>
                </div>

                {/* Ações */}
                <div className="flex gap-3 w-full">
                    <button onClick={onClose} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors backdrop-blur-md">
                        Fechar
                    </button>
                    <button onClick={handlePrint} className="flex-1 py-3 bg-white text-slate-900 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors">
                        <span className="material-symbols-outlined">print</span>
                        Imprimir / PDF
                    </button>
                </div>

            </div>
        </div>
    );
};
