
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { processTextCommand, AiCommandResult } from '../services/geminiService';

interface GlobalAiAssistantProps {
    onCommand: (result: AiCommandResult) => void;
}

export const GlobalAiAssistant: React.FC<GlobalAiAssistantProps> = ({ onCommand }) => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [displayTranscript, setDisplayTranscript] = useState('');
    const [error, setError] = useState('');

    const recognitionRef = useRef<any>(null);

    const handleProcess = useCallback(async (text: string) => {
        if (!text.trim()) return;
        setIsProcessing(true);
        setDisplayTranscript(text);

        try {
            const result = await processTextCommand(text);
            onCommand(result);
        } catch (e) {
            console.error(e);
            setError('Erro ao processar comando');
        } finally {
            setIsProcessing(false);
            setDisplayTranscript('');
            setTimeout(() => setError(''), 3000);
        }
    }, [onCommand]);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();

            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'pt-BR';

            recognitionRef.current.onstart = () => {
                console.log('🎤 Reconhecimento de voz iniciado');
                setIsListening(true);
                setDisplayTranscript('');
                setError('');
            };

            recognitionRef.current.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                console.log('📝 Texto reconhecido:', text);
                if (text) handleProcess(text);
            };

            recognitionRef.current.onend = () => {
                console.log('🛑 Reconhecimento de voz finalizado');
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('❌ Erro no reconhecimento de voz:', event.error);
                setIsListening(false);

                // Mensagens de erro mais específicas
                if (event.error === 'not-allowed') {
                    setError('Permissão de microfone negada. Verifique as configurações do navegador.');
                } else if (event.error === 'no-speech') {
                    setError('Nenhuma fala detectada. Tente novamente.');
                } else if (event.error === 'network') {
                    setError('Erro de rede. Verifique sua conexão.');
                } else {
                    setError(`Erro: ${event.error}`);
                }

                setTimeout(() => setError(''), 4000);
            };
        }
    }, [handleProcess]);

    const toggleListening = async () => {
        if (!recognitionRef.current) {
            setError('Reconhecimento de voz não disponível neste navegador.');
            setTimeout(() => setError(''), 3000);
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                // Tentar solicitar permissão de microfone (opcional, alguns navegadores não precisam)
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    try {
                        await navigator.mediaDevices.getUserMedia({ audio: true });
                        console.log('✅ Permissão de microfone concedida via getUserMedia');
                    } catch (permError: any) {
                        console.warn('⚠️ getUserMedia falhou, tentando iniciar reconhecimento mesmo assim:', permError.message);
                        // Não retornar aqui - alguns navegadores não precisam de getUserMedia para speech recognition
                    }
                }

                console.log('🎤 Tentando iniciar reconhecimento de voz...');
                recognitionRef.current.start();
            } catch (e: any) {
                console.error('❌ Erro ao iniciar reconhecimento:', e);
                setError(`Erro ao iniciar: ${e.message || 'Tente novamente'}`);
                setTimeout(() => setError(''), 3000);
            }
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-2 font-display">

            {(isListening || isProcessing || displayTranscript || error) && (
                <div className={`bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl border mb-2 max-w-[320px] animate-fade-in-up origin-bottom-right ${error ? 'border-red-300 dark:border-red-900' : 'border-primary/20 dark:border-slate-700'
                    }`}>
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' :
                            isListening ? 'bg-red-500 animate-pulse' :
                                'bg-blue-500'
                            }`}></div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {error ? "Erro" : isListening ? "Ouvindo" : "Processando"}
                        </span>
                    </div>
                    <p className={`text-sm font-medium leading-snug break-words ${error ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'
                        }`}>
                        {error || displayTranscript || (isListening ? "Fale agora..." : "Analisando")}
                    </p>
                </div>
            )}

            <button
                onClick={toggleListening}
                disabled={isProcessing}
                className={`
                    w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50
                    ${isListening
                        ? 'bg-red-500 ring-4 ring-red-200 dark:ring-red-900 shadow-red-500/30'
                        : 'bg-gradient-to-tr from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 hover:shadow-lg'
                    }
                `}
            >
                <span className={`material-symbols-outlined text-3xl transition-colors ${isListening ? 'text-white' : 'text-white dark:text-slate-900'}`}>
                    {isListening ? 'stop' : 'mic'}
                </span>
            </button>
        </div>
    );
};
