
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
                    <title>Recibo CAPI #${invoice.id}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                    <style>
                        @page { margin: 0; size: A4; }
                        body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; background: #f8fafc; }
                        * { box-sizing: border-box; }
                        
                        .page {
                            width: 210mm;
                            min-height: 297mm;
                            padding: 20mm;
                            margin: 0 auto;
                            background: white;
                            box-shadow: 0 0 10px rgba(0,0,0,0.1);
                            position: relative;
                        }
                        
                        /* Header */
                        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 60px; padding-bottom: 20px; border-bottom: 2px solid #f1f5f9; }
                        .logo { color: #f97316; font-size: 32px; font-weight: 900; letter-spacing: -1px; display: flex; align-items: center; gap: 8px; }
                        .logo-icon { width: 32px; height: 32px; background: #f97316; color: white; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 20px; }
                        
                        .company-info { text-align: right; color: #64748b; font-size: 12px; line-height: 1.5; }
                        .company-name { color: #0f172a; font-weight: 700; font-size: 14px; margin-bottom: 4px; display: block; }

                        /* Invoice Title & Status */
                        .invoice-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                        .invoice-title { font-size: 42px; font-weight: 800; color: #0f172a; letter-spacing: -1px; }
                        .status-badge { 
                            padding: 8px 16px; 
                            background: #dcfce7; 
                            color: #15803d; 
                            border-radius: 99px; 
                            font-size: 12px; 
                            font-weight: 700; 
                            text-transform: uppercase; 
                            letter-spacing: 0.5px; 
                            border: 1px solid #bbf7d0;
                        }

                        /* Details Grid */
                        .details-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
                        .detail-item { display: flex; flex-direction: column; gap: 4px; }
                        .detail-label { color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
                        .detail-value { color: #0f172a; font-size: 14px; font-weight: 600; }

                        /* Bill To */
                        .bill-section { margin-bottom: 40px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
                        .section-title { color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
                        .bill-name { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
                        .bill-info { font-size: 13px; color: #64748b; line-height: 1.6; }

                        /* Table */
                        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                        .items-table th { text-align: left; padding: 12px 0; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; }
                        .items-table td { padding: 20px 0; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px; }
                        .items-table .amount-col { text-align: right; font-weight: 600; color: #0f172a; }

                        /* Totals */
                        .totals { display: flex; justify-content: flex-end; }
                        .totals-box { width: 200px; }
                        .total-row { display: flex; justify-content: space-between; padding: 8px 0; color: #64748b; font-size: 13px; }
                        .grand-total { border-top: 2px solid #0f172a; padding-top: 15px; margin-top: 10px; color: #0f172a; font-weight: 800; font-size: 18px; display: flex; justify-content: space-between; align-items: center; }

                        /* Footer */
                        .footer { position: absolute; bottom: 40px; left: 20px; right: 20px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 30px; }
                        .footer-text { color: #94a3b8; font-size: 11px; margin-bottom: 5px; }
                        .footer-brand { color: #cbd5e1; font-weight: 900; font-size: 20px; letter-spacing: -1px; margin-top: 15px; display: block;}
                    </style>
                </head>
                <body>
                    <div class="page">
                        <div class="header">
                            <div class="logo">
                                <div class="logo-icon">C</div>
                                CAPI
                            </div>
                            <div class="company-info">
                                <span class="company-name">CAPI System Tecnologia LTDA</span>
                                CNPJ: 54.123.456/0001-89<br>
                                Avenida Paulista, 1000 - São Paulo, SP<br>
                                contato@capisystem.com.br
                            </div>
                        </div>

                        <div class="invoice-meta">
                            <div class="invoice-title">RECIBO</div>
                            <div class="status-badge">Pagamento Confirmado</div>
                        </div>

                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">Número do Recibo</span>
                                <span class="detail-value">#${invoice.id.replace('INV-', '')}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Data de Emissão</span>
                                <span class="detail-value">${new Date(invoice.date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Método</span>
                                <span class="detail-value">${invoice.method || 'PIX'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Transação</span>
                                <span class="detail-value text-xs truncate" style="font-family: monospace;">${invoice.id}</span>
                            </div>
                        </div>

                        <div class="bill-section">
                            <div class="section-title">Faturado Para</div>
                            <div class="bill-name">${user.name}</div>
                            <div class="bill-info">
                                Email: ${user.email}<br>
                                Documento: ${user.taxId || 'Não informado'}
                            </div>
                        </div>

                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th style="width: 50%">Descrição</th>
                                    <th style="width: 25%">Período</th>
                                    <th class="amount-col" style="width: 25%">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">Assinatura CAPI Pro</div>
                                        <div style="font-size: 12px; color: #64748b;">Acesso completo a todas ferramentas de IA e Gestão.</div>
                                    </td>
                                    <td>Mensal</td>
                                    <td class="amount-col">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount)}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="totals">
                            <div class="totals-box">
                                <div class="total-row">
                                    <span>Subtotal</span>
                                    <span>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount)}</span>
                                </div>
                                <div class="total-row">
                                    <span>Descontos</span>
                                    <span>R$ 0,00</span>
                                </div>
                                <div class="grand-total">
                                    <span>Total Pago</span>
                                    <span>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount)}</span>
                                </div>
                            </div>
                        </div>

                        <div class="footer">
                            <p class="footer-text">Obrigado por sua confiança. Este documento é um comprovante de pagamento válido.</p>
                            <p class="footer-text">Em caso de dúvidas, entre em contato através do email nexusdevsystem@gmail.com</p>
                            <span class="footer-brand">CAPI</span>
                        </div>
                    </div>
                </body>
                </html>
            `);
            doc.close();
            iframe.contentWindow?.focus();
            setTimeout(() => {
                iframe.contentWindow?.print();
                // Remover iframe após impressão
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }, 500); // Pequeno delay para garantir carregamento de fontes
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
                                <span className="font-bold text-slate-700 text-sm">{new Date(invoice.date).toLocaleDateString()} {new Date(invoice.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
