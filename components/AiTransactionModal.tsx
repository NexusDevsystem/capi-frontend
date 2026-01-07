
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, TransactionType, TransactionStatus, Product, BankAccount, ServiceOrder } from '../types';
import { predictTransactionDetails, AiTransactionPrediction } from '../services/geminiService';

interface AiTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Transaction) => void;
    onSaveDebt?: (customerName: string, amount: number, description: string) => void;
    currentContext: string;
    onSaveProduct?: (product: Product) => void;
    onUpdateBank?: (account: BankAccount) => void;
    onNavigate?: (page: string) => void;
    onSaveServiceOrder?: (os: ServiceOrder) => void;
}

export const AiTransactionModal: React.FC<AiTransactionModalProps> = ({
    isOpen, onClose, onSave, onSaveDebt,
    currentContext, onSaveProduct, onUpdateBank, onNavigate, onSaveServiceOrder
}) => {
    const [step, setStep] = useState<'INPUT' | 'PROCESSING' | 'REVIEW' | 'SUCCESS'>('INPUT');
    const [textInput, setTextInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [editableData, setEditableData] = useState<AiTransactionPrediction | null>(null);

    const recognitionRef = useRef<any>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setStep('INPUT');
            setTextInput('');
            setEditableData(null);
            setTimeout(() => textareaRef.current?.focus(), 300);
        } else {
            if (recognitionRef.current) recognitionRef.current.stop();
        }
    }, [isOpen]);

    const [statusText, setStatusText] = useState('');

    const toggleListening = async () => {
        if (isListening || isInitializing) {
            console.log('🛑 Usuário forçou parada');
            recognitionRef.current?.stop();
            setIsListening(false);
            setIsInitializing(false);
            setStatusText('');
            return;
        }

        console.log('🎤 Iniciando novo reconhecimento...');
        setStatusText('Iniciando...');
        setIsInitializing(true);
        const startTime = Date.now();

        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            alert("Seu navegador não suporta reconhecimento de voz.");
            setIsInitializing(false);
            setStatusText('Navegador incompatível');
            return;
        }

        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (e) { }
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        // Configuração simplificada para estabilidade
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';
        recognition.maxAlternatives = 1;

        // Safety timeout
        const initTimeout = setTimeout(() => {
            console.warn('⚠️ Safety timeout: Sem resposta do browser');
            if (isInitializing) {
                setStatusText('Falha ao iniciar. Tente novamente.');
                setIsInitializing(false);
            }
        }, 5000);

        recognition.onstart = () => {
            console.log(`✅ onstart: Reconhecimento iniciado (${Date.now() - startTime}ms)`);
            clearTimeout(initTimeout);
            setIsListening(true);
            setIsInitializing(false);
            setStatusText('Ouvindo... Fale agora');
        };

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                console.log('📝 Texto capturado:', finalTranscript);
                setTextInput(prev => prev ? prev + ' ' + finalTranscript : finalTranscript);
                recognition.stop();
            }
        };

        recognition.onend = () => {
            const duration = Date.now() - startTime;
            console.log(`🛑 onend: Reconhecimento encerrado (${duration}ms)`);
            clearTimeout(initTimeout); // Limpa o timeout para evitar aviso falso

            // Se fechou muito rápido (< 500ms) sem onstart, provavelmente é erro
            if (duration < 500 && isInitializing) {
                console.warn('⚠️ Fechamento imediato detectado');
                setStatusText('Microfone desconectado ou bloqueado?');
            } else {
                setStatusText('');
            }

            setIsListening(false);
            setIsInitializing(false);
        };

        recognition.onerror = (event: any) => {
            console.error('❌ onerror:', event.error);
            clearTimeout(initTimeout);
            setIsListening(false);
            setIsInitializing(false);

            if (event.error === 'not-allowed') {
                setStatusText('Permissão negada (verifique URL)');
            } else if (event.error === 'no-speech') {
                setStatusText('Nenhuma fala detectada');
            } else if (event.error === 'network') {
                setStatusText('Erro de conexão/rede');
            } else {
                setStatusText(`Erro: ${event.error}`);
            }
        };

        try {
            recognition.start();
        } catch (e: any) {
            console.error('❌ Exceção ao iniciar:', e);
            setStatusText('Erro ao iniciar');
            setIsInitializing(false);
            clearTimeout(initTimeout);
        }
    };

    const handleAnalyze = async () => {
        const text = textInput.trim();
        if (!text) return;

        setStep('PROCESSING');
        try {
            const results = await predictTransactionDetails(text, currentContext);
            if (results && results.length > 0) {
                setEditableData(results[0]);
                setStep('REVIEW');
            } else {
                setStep('INPUT');
                alert("Não entendi. Pode repetir?");
            }
        } catch (error) {
            setStep('INPUT');
            alert("Erro na conexão com a IA.");
        }
    };

    const handleConfirm = () => {
        if (!editableData) return;
        const action = editableData.action || 'TRANSACTION';

        if (action === 'STOCK' && onSaveProduct) {
            onSaveProduct({
                id: Date.now().toString(),
                name: editableData.productName || 'Novo Produto',
                costPrice: editableData.costPrice || 0,
                salePrice: editableData.salePrice || 0,
                stock: editableData.stockQuantity || 0,
                minStock: 5
            });
        } else if (action === 'OS' && onSaveServiceOrder) {
            onSaveServiceOrder({
                id: Date.now().toString(),
                customerId: 'temp',
                customerName: editableData.customerName || 'Cliente',
                device: editableData.device || 'Equipamento',
                description: editableData.description || 'Serviço',
                status: 'ABERTO',
                partsTotal: 0,
                laborTotal: 0,
                total: 0,
                openDate: new Date().toISOString()
            });
        } else if (action === 'NAVIGATE' && onNavigate && editableData.targetPage) {
            onNavigate(editableData.targetPage);
        } else {
            // Lógica de Transação + Dívida
            const tx: Transaction = {
                id: Date.now().toString(),
                description: editableData.description,
                amount: editableData.amount, // Valor PAGO (Entrada)
                type: editableData.type,
                category: editableData.category,
                paymentMethod: editableData.paymentMethod as any,
                date: new Date().toISOString(),
                status: TransactionStatus.COMPLETED,
                entity: editableData.type === 'INCOME' ? (editableData.customerName || 'Cliente Diverso') : 'Fornecedor',
                items: editableData.items?.map(i => ({
                    productId: 'temp',
                    productName: i.name,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    total: i.total
                }))
            };

            // Só salva transação se houve entrada de dinheiro (> 0)
            if (tx.amount > 0) onSave(tx);

            // Salva Dívida se houver
            if (onSaveDebt && editableData.debtAmount && editableData.debtAmount > 0) {
                const customer = editableData.customerName || 'Cliente';
                const desc = `Restante: ${editableData.description} (Total era ${formatCurrency((editableData.amount || 0) + editableData.debtAmount)})`;
                onSaveDebt(customer, editableData.debtAmount, desc);
            }
        }
        setStep('SUCCESS');
        setTimeout(onClose, 1000);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center font-display">
            {/* Backdrop Blur */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

            {/* Main Container */}
            <div className="relative w-full max-w-lg mx-4">

                {/* --- RAINBOW BORDER EFFECT --- */}
                <div className="absolute -inset-[3px] bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 rounded-2xl blur-sm opacity-70 animate-pulse-slow"></div>

                {/* --- STANDARD WHITE CARD --- */}
                <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300">

                    {/* Header Clean */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">smart_toy</span>
                            Assistente IA
                        </h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {step === 'INPUT' || step === 'PROCESSING' ? (
                        <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">

                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">O que aconteceu?</h2>

                            {/* Standard Mic Button */}
                            <button
                                onClick={toggleListening}
                                disabled={isInitializing}
                                className={`
                                    w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 mb-6 shadow-lg
                                    ${isInitializing
                                        ? 'bg-amber-400 text-white animate-pulse cursor-wait ring-4 ring-amber-200 dark:ring-amber-900'
                                        : isListening
                                            ? 'bg-red-500 text-white animate-pulse ring-4 ring-200 dark:ring-red-900'
                                            : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-primary hover:border-primary border-2 border-slate-100 dark:border-slate-700'
                                    }
                                `}
                            >
                                <span className="material-symbols-outlined text-4xl">
                                    {isInitializing ? 'hourglass_top' : isListening ? 'stop' : 'mic_none'}
                                </span>
                            </button>

                            {/* Status Text Display */}
                            <p className={`text-sm font-medium mb-4 h-5 transition-colors ${statusText.includes('Erro') || statusText.includes('negada') ? 'text-red-500' :
                                statusText.includes('Ouvindo') ? 'text-green-500 animate-pulse' : 'text-slate-500'
                                }`}>
                                {statusText}
                            </p>

                            {/* Text Input */}
                            <div className="w-full relative">
                                <textarea
                                    ref={textareaRef}
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Ex: 'Vendi 2 camisas por 100 reais no pix'"
                                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-center text-lg font-medium outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none shadow-inner"
                                    rows={2}
                                    disabled={step === 'PROCESSING'}
                                />
                            </div>

                            <div className="mt-6 h-10 flex items-center justify-center w-full">
                                {step === 'PROCESSING' ? (
                                    <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></span>
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></span>
                                        Processando...
                                    </div>
                                ) : (
                                    textInput.length > 2 && (
                                        <button
                                            onClick={handleAnalyze}
                                            className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg"
                                        >
                                            Processar <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 animate-slide-in-right">

                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${editableData?.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {editableData?.type === 'INCOME' ? 'Receita' : 'Despesa'}
                                    </span>
                                    {editableData?.category && <span className="text-xs text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{editableData.category}</span>}
                                </div>
                                <span className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(editableData?.amount || 0)}</span>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Descrição</p>
                                    <input
                                        type="text"
                                        value={editableData?.description}
                                        onChange={(e) => setEditableData(prev => prev ? { ...prev, description: e.target.value } : null)}
                                        className="w-full bg-transparent font-bold text-slate-900 dark:text-white outline-none border-b border-transparent focus:border-slate-300"
                                    />
                                </div>

                                {editableData?.items && editableData.items.length > 0 && (
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                        <p className="text-xs text-slate-400 uppercase font-bold">Itens Identificados</p>
                                        {editableData.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="text-slate-700 dark:text-slate-300">{item.quantity}x {item.name}</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.total)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {editableData?.debtAmount && editableData.debtAmount > 0 && (
                                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-orange-600 font-bold uppercase">Saldo Devedor (Fiado)</p>
                                            <p className="text-slate-900 font-bold text-sm">{editableData.customerName}</p>
                                        </div>
                                        <span className="text-lg font-black text-orange-600">{formatCurrency(editableData.debtAmount)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep('INPUT')}
                                    className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-[2] py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
                                >
                                    Confirmar Lançamento
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
