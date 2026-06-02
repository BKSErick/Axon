import React from 'react';
import { ClientLayout } from './client/ClientLayout';
import { ClientDashboard } from './client/ClientDashboard';

// --- NEW CLIENT ENTRY POINT (HIGH IMPACT) ---
export const ClientHome = ({ user, onLogout, onBackToAdmin }) => {
    return (
        <ClientLayout user={user} onLogout={onLogout} onBackToAdmin={onBackToAdmin}>
            <ClientDashboard user={user} onLogout={onLogout} />
        </ClientLayout>
    );
};

// --- LEGACY EXPORTS (STUBS FOR APP.JSX COMPATIBILITY UNTIL REFACTOR) ---
// These will be removed from App.jsx usage in the next step
export const ClientSidebar = () => null;
export const ClientCampaigns = () => null;
export const ClientReports = () => null;
export const ClientEcommerce = () => null;
export const ClientSettings = () => null;
