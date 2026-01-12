import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface TrialCountdownProps {
    trialEndsAt?: string;
}

export const TrialCountdown: React.FC<TrialCountdownProps> = ({ trialEndsAt }) => {
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

    useEffect(() => {
        if (!trialEndsAt) return;

        const calculateTimeLeft = () => {
            const difference = new Date(trialEndsAt).getTime() - new Date().getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                setTimeLeft(null); // Trial expirado
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [trialEndsAt]);

    if (!timeLeft) return null;

    // Formatar com dois dígitos
    const pad = (n: number) => n.toString().padStart(2, '0');

    // Determinar cor baseada na urgência (menos de 24h fica vermelho)
    const isUrgent = timeLeft.days === 0;

    return (
        <div className={`
            w-full py-2 px-4 flex items-center justify-center gap-4 text-sm font-bold shadow-sm z-40 relative
            ${isUrgent
                ? 'bg-red-500 text-white animate-pulse-slow'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
            }
        `}>
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">timer</span>
                <span>Teste Grátis:</span>
            </div>

            <div className="font-mono text-base tracking-widest bg-black/20 px-2 py-0.5 rounded-md">
                {timeLeft.days}d {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s
            </div>

            <button
                onClick={() => navigate('/payment')}
                className="bg-white text-orange-600 hover:bg-orange-50 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide transition-colors shadow-sm ml-2"
            >
                Assinar Agora
            </button>
        </div>
    );
};
