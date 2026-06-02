/* ============================================
   Axon — Data Bridge (Context Provider)
   Centraliza dados pra todas as telas via Context.
   Cada hook chama Supabase/Meta real.
   ============================================ */
import React, { createContext, useContext } from 'react';
import {
  useAllClients, useAllBMs, useAllAdAccounts, useAdminOverview,
  useAllCampaigns, useAllReports, useNotifications,
  useAudiences, useGoogleCampaigns, useGoogleKeywords,
} from '../lib/hooks/useAxonData';
import { useKpis, useCampaigns, useAds, useEngagementAnalytics, useReports } from '../lib/hooks/useClientData';

const AxonDataCtx = createContext({
  // admin
  clients: [], bms: [], accounts: [], adminOverview: null,
  campaigns: [], reports: [], audiences: [],
  // client (filled when clientId provided)
  clientKpis: null, clientCampaigns: [], clientAds: [], clientReports: [], clientEngagement: null,
  // shared
  googleCampaigns: [], googleKeywords: { keywords: [], negatives: [] },
  loading: {},
});

export function AxonDataProvider({ clientId, role, isAdmin = false, children }) {
  // Admin queries — só rodam se o usuário logado é admin (evita erros de RLS
  // pra clientes). Em modo auditoria (admin vendo como cliente) seguem ativas.
  const enableAdmin = isAdmin;
  const clients = useAllClients(enableAdmin);
  const bms = useAllBMs(enableAdmin);
  const accounts = useAllAdAccounts(enableAdmin);
  const adminOverview = useAdminOverview(enableAdmin);
  const campaigns = useAllCampaigns('last_30d', enableAdmin);
  const reports = useAllReports(enableAdmin);
  const audiences = useAudiences();

  // Client queries (quando há clientId)
  const clientKpis = useKpis(clientId);
  const clientCampaigns = useCampaigns(clientId);
  const clientAds = useAds(clientId);
  const clientEngagement = useEngagementAnalytics(clientId);
  const clientReportsData = useReports(clientId);

  // Google (mock)
  const googleCampaigns = useGoogleCampaigns(clientId);
  const googleKeywords = useGoogleKeywords(clientId);

  const value = {
    role,
    clientId,
    // admin
    clients: clients.data,
    bms: bms.data,
    accounts: accounts.data,
    adminOverview: adminOverview.data,
    campaigns: campaigns.data,
    reports: reports.data,
    audiences: audiences.data,
    // client
    clientKpis: clientKpis.data,
    clientCampaigns: clientCampaigns.data,
    clientAds: clientAds.data,
    clientReports: clientReportsData.data,
    clientEngagement: clientEngagement.data,
    clientEngagementReason: clientEngagement.reason,
    // shared
    googleCampaigns: googleCampaigns.data,
    googleKeywords: googleKeywords.data,
    // loading flags
    loading: {
      clients: clients.loading,
      bms: bms.loading,
      accounts: accounts.loading,
      adminOverview: adminOverview.loading,
      campaigns: campaigns.loading,
      reports: reports.loading,
      clientKpis: clientKpis.loading,
      clientCampaigns: clientCampaigns.loading,
      clientAds: clientAds.loading,
      clientEngagement: clientEngagement.loading,
      clientReports: clientReportsData.loading,
    },
    errors: {
      adminOverview: adminOverview.error,
      clientKpis: clientKpis.error,
    },
  };

  return <AxonDataCtx.Provider value={value}>{children}</AxonDataCtx.Provider>;
}

export const useAxonData = () => useContext(AxonDataCtx);
