import React from 'react';
import { usePageTracking } from '../hooks/usePageTracking';

/**
 * Componente invisível que rastreia page views
 * Deve ser colocado dentro do BrowserRouter
 */
export const AnalyticsTracker: React.FC = () => {
    usePageTracking();
    return null;
};
