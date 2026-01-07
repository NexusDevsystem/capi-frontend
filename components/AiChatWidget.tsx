
import React, { useState, useRef, useEffect } from 'react';
import { Transaction, TransactionType, TransactionStatus, Product, ServiceOrder } from '../types';
import { processNaturalLanguageCommand, AiCommandResponse } from '../services/geminiService';
import { Logo } from './Logo';

interface AiChatWidgetProps {
    onSaveTransaction: (transaction: Transaction) => void;
    onSaveDebt?: (customerName: string, amount: number, description: string) => void;
    onSaveProduct?: (product: Product) => void;
    onSaveServiceOrder?: (os: ServiceOrder) => void;
    onNavigate?: (page: string) => void;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    type: 'text' | 'preview' | 'success' | 'error';
    content?: string;
    data?: AiCommandResponse;
    isConfirmed?: boolean;
}

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({ 
    onSaveTransaction, onSaveDebt, onSaveProduct, onSaveServiceOrder, onNavigate 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { 
            id: 'welcome', 
            role: 'assistant', 
            type: 'text', 
            content: 'Olá! Sou o assistente CAPI. Posso lançar vendas, despesas, criar produtos ou ordens de serviço. Diga algo como "Vendi 2 camisas por 50 reais" ou "Nova OS para João".' 
        }
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen, isTyping]);

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
    }, [isOpen]);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'pt-BR';

            recognitionRef.current.onstart = () => setIsListening(true);
            recognitionRef.current.onend = () => setIsListening(false);
            
            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                if (transcript) handleSend(transcript);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return alert("Navegador não suporta voz.");
        if (isListening) recognitionRef.current.stop();
        else recognitionRef.current.start();
    };

    const handleSend = async (textOverride?: string) => {
        const text = textOverride || input;
        if (!text.trim()) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', type: 'text', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const results = await processNaturalLanguageCommand(text);
            setIsTyping(false);

            if (results && results.length > 0) {
                const newMessages = results.map((res, idx) => ({
                    id: Date.now().toString() + idx,
                    role: 'assistant' as const,
                    type: 'preview' as const,
                    data: res,
                    isConfirmed: false
                }));
                setMessages(prev => [...prev, ...newMessages]);
            } else {
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', type: 'error', content: 'Não entendi. Tente reformular.' }]);
            }
        } catch (error) {
            console.error(error);
            setIsTyping(false);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', type: 'error', content: 'Erro ao processar comando.' }]);
        }
    };

    const confirmAction = (msgId: string, cmd: AiCommandResponse) => {
        const { action, payload } = cmd;

        if (action === 'TRANSACTION' && payload.amount !== undefined) {
            const tx: Transaction = {
                id: Date.now().toString() + Math.random(),
                description: payload.description || 'Transação',
                amount: payload.amount,
                type: payload.type as TransactionType || TransactionType.INCOME,
                category: payload.category || 'Geral',
                paymentMethod: (payload.paymentMethod as any) || 'DINHEIRO',
                date: new Date().toISOString(),
                status: TransactionStatus.COMPLETED,
                entity: payload.type === 'INCOME' ? (payload.customerName || 'Cliente Diverso') : 'Fornecedor',
                items: payload.items?.map((i: any) => ({
                    productId: 'temp',
                    productName: i.name,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    total: i.total
                }))
            };
            onSaveTransaction(tx);

            if (onSaveDebt && payload.debtAmount && payload.debtAmount > 0) {
                const debtCustomer = payload.customerName || 'Cliente Não Identificado';
                const debtDesc = `Restante: ${payload.description}`;
                onSaveDebt(debtCustomer, payload.debtAmount, debtDesc);
            }
        } else if (action === 'STOCK' && onSaveProduct) {
            const prod: Product = {
                id: Date.now().toString(),
                name: payload.productName || 'Novo Produto',
                costPrice: payload.costPrice || 0,
                salePrice: payload.salePrice || 0,
                stock: payload.stockQuantity || 0,
                minStock: 5
            };
            onSaveProduct(prod);
        } else if (action === 'OS' && onSaveServiceOrder) {
            const os: ServiceOrder = {
                id: Date.now().toString(),
                customerId: 'temp',
                customerName: payload.customerName || 'Cliente',
                device: payload.device,
                description: payload.problem || 'Serviço',
                status: 'ABERTO',
                partsTotal: 0,
                laborTotal: 0,
                total: 0,
                openDate: new Date().toISOString()
            };
            onSaveServiceOrder(os);
        } else if (action === 'NAVIGATE' && onNavigate && payload.targetPage) {
            onNavigate(payload.targetPage);
        }

        setMessages(prev => prev.map(m => {
            if (m.id === msgId) return { ...m, isConfirmed: true };
            return m;
        }));
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const renderCardContent = (cmd: AiCommandResponse) => {
        const { action, payload } = cmd;

        if (action === 'TRANSACTION') {
            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${payload.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`}>
                            {payload.type === 'INCOME' ? 'Venda' : 'Despesa'}
                        </span>
                        <span className="text-xs font-bold text-stone-700">{payload.description}</span>
                    </div>

                    {/* Lista de Itens no Chat */}
                    {payload.items && payload.items.length > 0 && (
                        <div className="space-y-1 my-2 bg-stone-50 p-2 rounded-lg border border-stone-100">
                             {payload.items.map((item: any, i: number) => (
                                 <div key={i} className="flex justify-between text-[10px] text-stone-600">
                                     <span>{item.quantity}x {item.name}</span>
                                     <span className="font-bold">{formatCurrency(item.total)}</span>
                                 </div>
                             ))}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-stone-50 p-2 rounded border border-stone-100">
                            <span className="block text-[9px] font-bold text-stone-400 uppercase">Valor Total</span>
                            <span className="block text-sm font-bold text-stone-800">{formatCurrency(payload.amount || 0)}</span>
                        </div>
                        <div className="bg-stone-50 p-2 rounded border border-stone-100">
                            <span className="block text-[9px] font-bold text-stone-400 uppercase">Método</span>
                            <span className="block text-sm font-bold text-stone-800 uppercase">{payload.paymentMethod}</span>
                        </div>
                    </div>
                    {payload.debtAmount && payload.debtAmount > 0 ? (
                        <div className="bg-red-50 border border-red-100 p-2 rounded flex items-center justify-between">
                            <div>
                                <span className="block text-[9px] font-bold text-red-400 uppercase">Restante (Fiado)</span>
                                <span className="block text-xs font-bold text-red-700">{payload.customerName || 'Cliente'}</span>
                            </div>
                            <span className="text-sm font-black text-red-600">{formatCurrency(payload.debtAmount)}</span>
                        </div>
                    ) : null}
                </div>
            );
        }

        if (action === 'STOCK') {
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500 text-white">Estoque</span>
                        <span className="text-xs font-bold text-stone-700">{payload.productName}</span>
                    </div>
                    <div className="flex justify-between text-xs text-stone-600 bg-stone-50 p-2 rounded">
                        <span>Qtd: <b>{payload.stockQuantity}</b></span>
                        <span>Venda: <b>{formatCurrency(payload.salePrice || 0)}</b></span>
                    </div>
                </div>
            );
        }

        if (action === 'OS') {
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500 text-white">OS</span>
                        <span className="text-xs font-bold text-stone-700">{payload.customerName}</span>
                    </div>
                    <div className="text-xs text-stone-500 bg-stone-50 p-2 rounded">
                        <p>Aparelho: <b>{payload.device}</b></p>
                        <p>Defeito: {payload.problem}</p>
                    </div>
                </div>
            );
        }

        if (action === 'NAVIGATE') {
            return (
                <div className="flex items-center gap-2 p-2">
                    <span className="material-symbols-outlined text-stone-400">login</span>
                    <span className="text-xs font-bold text-stone-700">Ir para: {payload.targetPage}</span>
                </div>
            );
        }

        return <div className="text-xs text-slate-500">Ação desconhecida</div>;
    };

    return (
        <>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-[90] w-14 h-14 bg-[#1E1E1E] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group"
                >
                    <span className="material-symbols-outlined text-3xl">chat_bubble</span>
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1E1E1E]"></span>
                </button>
            )}

            <div 
                className={`
                    fixed bottom-6 right-6 z-[100] w-[400px] max-w-[calc(100vw-32px)] bg-[#FDFCF8] rounded-[2rem] shadow-2xl border border-stone-200 overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right
                    ${isOpen ? 'scale-100 opacity-100 h-[600px] max-h-[85vh]' : 'scale-0 opacity-0 h-0 pointer-events-none'}
                `}
            >
                <div className="p-5 bg-white border-b border-stone-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="font-bold text-stone-800 text-sm tracking-wide uppercase">Assistente Capi</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 transition-colors">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#F8F9FA]">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            
                            {msg.role === 'assistant' && (
                                <div className="flex items-start gap-3 max-w-[90%]">
                                    <div className="shrink-0 pt-1">
                                        <div className="w-8 h-8 rounded-full bg-white border border-stone-100 shadow-sm flex items-center justify-center overflow-hidden p-1">
                                            {msg.type === 'success' || msg.isConfirmed ? (
                                                <span className="material-symbols-outlined text-green-500 text-sm font-bold">check</span>
                                            ) : (
                                                <Logo className="w-full h-full" showText={false} />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1 w-full">
                                        {(msg.type === 'text' || msg.type === 'error') && (
                                            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-stone-100 text-stone-600 text-sm leading-relaxed">
                                                {msg.content}
                                            </div>
                                        )}

                                        {msg.type === 'preview' && msg.data && (
                                            <div className={`bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-stone-100 w-full animate-fade-in-up ${msg.isConfirmed ? 'opacity-60' : ''}`}>
                                                
                                                {renderCardContent(msg.data)}

                                                {!msg.isConfirmed ? (
                                                    <button 
                                                        onClick={() => confirmAction(msg.id, msg.data!)}
                                                        className="mt-3 w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2"
                                                    >
                                                        Confirmar
                                                        <span className="material-symbols-outlined text-sm">check</span>
                                                    </button>
                                                ) : (
                                                    <div className="mt-2 w-full py-2 bg-green-50 text-green-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                                                        <span className="material-symbols-outlined text-sm">verified</span>
                                                        Confirmado
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {msg.role === 'user' && (
                                <div className="bg-[#1E1E1E] text-white py-3 px-5 rounded-2xl rounded-tr-sm max-w-[80%] text-sm shadow-md leading-relaxed animate-fade-in-up">
                                    {msg.content}
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {isTyping && (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white border border-stone-100 shadow-sm flex items-center justify-center p-1">
                                <Logo className="w-full h-full" showText={false} />
                            </div>
                            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-stone-100 shadow-sm flex gap-1 items-center">
                                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce delay-100"></span>
                                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-stone-100 flex items-center gap-3">
                    <button 
                        onClick={toggleListening}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-600'}`}
                    >
                        <span className="material-symbols-outlined text-xl">{isListening ? 'mic' : 'mic_none'}</span>
                    </button>
                    
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Digite..."
                        className="flex-1 bg-stone-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-stone-200 outline-none text-stone-800 placeholder:text-stone-400 font-medium"
                    />

                    <button 
                        onClick={() => handleSend()}
                        disabled={!input.trim()}
                        className="w-10 h-10 rounded-full bg-[#1E1E1E] hover:bg-black text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-90"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_upward</span>
                    </button>
                </div>
            </div>
        </>
    );
};
