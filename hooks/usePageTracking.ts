import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { firebaseAnalytics } from '../services/firebase';

/**
 * Hook para rastrear page views automaticamente
 * Deve ser usado dentro de um componente que está dentro do BrowserRouter
 */
export const usePageTracking = () => {
    const location = useLocation();

    useEffect(() => {
        // Extrai o nome da página da rota
        const pageName = location.pathname === '/'
            ? 'landing_page'
            : location.pathname.replace(/^\//, '').replace(/\//g, '_');

        firebaseAnalytics.pageView(pageName);
    }, [location]);
};

export default usePageTracking;
