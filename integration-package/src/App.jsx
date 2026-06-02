/* ============================================
   Axon × METABKSFY — App Root
   Real Supabase auth + Axon visual shell
   ============================================ */
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { META_TOKEN_INVALID_EVENT } from './lib/meta';

import { Login } from './axon/login';
import { Sidebar, Topbar, AuditBanner } from './axon/shell';
import { AxonDataProvider } from './axon/data-bridge';
import {
  AdminOverview, AdminBMs, AdminAccounts, AdminCampaigns,
  AdminClients, AdminAudiences, AdminReports, AdminSocial, AdminSettings
} from './axon/admin-screens';
import {
  ClientDashboard, ClientCampaigns, ClientCreatives, ClientLeads,
  ClientSocial, ClientReports, ClientSettings, ClientSupport
} from './axon/client-screens';
import { GoogleAdsOverview, GoogleKeywords, ClientGoogleAds } from './axon/google-screens';
import {
  CampaignDetail, NewAudienceModal, NewKeywordModal, NewNegativeModal,
  NewGoogleCampaignModal, SendReportsModal, ScheduleReportsModal,
  FilterDrawer, GoogleFilterDrawer, NewClientModal, NewBMModal,
  RelinkModal, LeadDetailModal, ToastHost, Confirm,
} from './axon/extras';
import {
  CommandPalette, NotificationDrawer, CopilotDrawer, OnboardingTour, TokenAlert,
} from './axon/overlays';

import { PrivacyPolicy, TermsOfService, DataDeletion } from './components/Legal';
import { I } from './axon/icons';

/* Legal pages route (preserve old paths) */
function legalRoute() {
  const path = window.location.pathname;
  if (path === '/privacidade' || path === '/privacy') return <PrivacyPolicy />;
  if (path === '/termos' || path === '/terms') return <TermsOfService />;
  if (path === '/data-deletion' || path === '/exclusao-dados') return <DataDeletion />;
  return null;
}

/* ============================================
   APP
   ============================================ */
export default function App() {
  const legal = legalRoute();
  if (legal) return legal;

  const [auth, setAuth] = useState(null);          // { role, uuid, id, name, email, agency }
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(() => sessionStorage.getItem('axon_view') || 'admin-overview');
  const [clientId, setClientId] = useState(null);
  const [auditMode, setAuditMode] = useState(false);
  const [tokenAlert, setTokenAlert] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('axon_theme') || 'dark');

  // Overlays
  const [showPalette, setShowPalette] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Modals
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewBM, setShowNewBM] = useState(false);
  const [relinkAccount, setRelinkAccount] = useState(null);
  const [leadDetail, setLeadDetail] = useState(null);
  const [campaignId, setCampaignId] = useState(null);
  const [showNewAudience, setShowNewAudience] = useState(false);
  const [showNewKeyword, setShowNewKeyword] = useState(false);
  const [showNewNegative, setShowNewNegative] = useState(false);
  const [showNewGoogleCampaign, setShowNewGoogleCampaign] = useState(false);
  const [showSendReports, setShowSendReports] = useState(false);
  const [showScheduleReports, setShowScheduleReports] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showGoogleFilter, setShowGoogleFilter] = useState(false);
  const [confirmDlg, setConfirmDlg] = useState(null);

  // Persist view + theme
  useEffect(() => sessionStorage.setItem('axon_view', view), [view]);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('axon_theme', theme);
  }, [theme]);

  /* ---------- Auth wire-up (replicates legacy logic) ---------- */
  useEffect(() => {
    console.log('[Axon] App iniciada. Monitorando autenticação...');
    let active = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      console.log('[Axon] Auth event:', event, session?.user?.email);
      if (session) {
        fetchProfile(session.user).catch((err) => {
          console.error('[Axon] fetchProfile fail (silent):', err);
          setLoading(false);
        });
      } else {
        setAuth(null);
        setLoading(false);
      }
    });

    // Safety net
    const t = setTimeout(() => { if (active) setLoading(false); }, 12000);

    return () => { active = false; subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  const fetchProfile = async (user, retry = 0) => {
    const dbTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));
    try {
      const q = supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: profile, error } = await Promise.race([q, dbTimeout]);
      if (error) {
        const shouldRetry = retry < 5 && (
          error.message?.includes('schema cache') ||
          error.message?.includes('relation') ||
          error.code === 'PGRST116' ||
          error.message === 'Timeout'
        );
        if (shouldRetry) {
          await new Promise(r => setTimeout(r, 2000));
          return fetchProfile(user, retry + 1);
        }
        throw error;
      }
      if (!profile) throw new Error('Perfil não encontrado.');

      let currentClientId = profile.client_id;

      // Auto-cura: tentar vincular client_id pelo email
      if (!currentClientId && profile.role === 'client') {
        const { data: clientLink } = await supabase.from('clients').select('id').eq('email', user.email).single();
        if (clientLink) {
          await supabase.from('profiles').update({ client_id: clientLink.id }).eq('id', user.id);
          currentClientId = clientLink.id;
        }
      }

      setAuth({
        role: profile.role,
        uuid: user.id,
        id: profile.role === 'admin' ? 'admin' : currentClientId,
        name: profile.full_name || user.email.split('@')[0],
        email: user.email,
        agency: profile.agency_name || 'Sua Agência',
        onboardingCompleted: profile.onboarding_completed ?? true,
      });
      setClientId(currentClientId);

      // Restaurar view por role
      if (profile.role === 'admin') {
        const savedClient = sessionStorage.getItem('admin_viewing_client');
        if (savedClient) {
          setClientId(savedClient);
          setAuditMode(true);
        }
      }
      // Mostrar onboarding apenas quando a coluna existir e estiver falsa.
      if (profile.onboarding_completed === false) setShowOnboarding(true);

      setLoading(false);
    } catch (err) {
      console.error('[Axon] Falha perfil:', err.message);
      if (retry < 5 && (err.message === 'Timeout' || err.message?.includes('network') || err.message?.includes('fetch'))) {
        await new Promise(r => setTimeout(r, 2000));
        return fetchProfile(user, retry + 1);
      }
      if (retry >= 5) {
        // Bypass de emergência (mantém comportamento legacy)
        setAuth({
          role: 'admin', id: 'admin', uuid: user.id,
          name: user.email.split('@')[0], email: user.email,
          agency: 'Sua Agência', onboardingCompleted: true,
        });
      }
      setLoading(false);
    }
  };

  /* ---------- Meta token-invalid event ---------- */
  useEffect(() => {
    const handler = (e) => setTokenAlert(e.detail);
    window.addEventListener(META_TOKEN_INVALID_EVENT, handler);
    return () => window.removeEventListener(META_TOKEN_INVALID_EVENT, handler);
  }, []);

  /* ---------- ⌘K shortcut ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowPalette(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ---------- Default view per role (safe: guarded by auth) ---------- */
  useEffect(() => {
    if (!auth) return;
    const isClientView = auth.role === 'client' || (auth.role === 'admin' && auditMode && clientId);
    const r = isClientView ? 'client' : 'admin';
    if (r === 'admin' && !view.startsWith('admin-')) setView('admin-overview');
    if (r === 'client' && !view.startsWith('client-')) setView('client-dashboard');
  }, [auth, auditMode, clientId]); // eslint-disable-line

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('meta_user');
      sessionStorage.removeItem('admin_viewing_client');
      sessionStorage.removeItem('axon_view');
      setAuth(null);
      window.location.href = '/';
    } catch (err) {
      window.location.reload();
    }
  };

  const handleClientChange = (id) => {
    setClientId(id);
    setAuth(a => ({ ...a, id }));
    if (id && id !== 'admin') {
      sessionStorage.setItem('admin_viewing_client', id);
      setAuditMode(true);
    } else {
      sessionStorage.removeItem('admin_viewing_client');
      setAuditMode(false);
    }
  };

  /* ---------- Loading screen ---------- */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'rgb(var(--bg))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, color: 'rgb(var(--text))' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgb(var(--border))', borderTop: '3px solid rgb(var(--accent))', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
        <div style={{ fontWeight: 600, fontSize: 13, color: 'rgb(var(--text-2))' }}>Conectando ao sistema…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!auth) return <Login />;

  /* ---------- Render ---------- */
  const isClientView = auth.role === 'client' || (auth.role === 'admin' && auditMode && clientId);
  const role = isClientView ? 'client' : 'admin';

  const go = (v) => { setCampaignId(null); setView(v); };

  const renderView = () => {
    if (campaignId) return <CampaignDetail campaignId={campaignId} back={() => setCampaignId(null)} />;
    switch (view) {
      // Admin
      case 'admin-overview':   return <AdminOverview go={go} auth={auth} onClientChange={handleClientChange} />;
      case 'admin-bms':        return <AdminBMs onNew={() => setShowNewBM(true)} />;
      case 'admin-accounts':   return <AdminAccounts onLink={setRelinkAccount} />;
      case 'admin-campaigns':  return <AdminCampaigns onOpen={setCampaignId} onFilter={() => setShowFilterDrawer(true)} />;
      case 'admin-google':     return <GoogleAdsOverview onOpen={setCampaignId} onNewCampaign={() => setShowNewGoogleCampaign(true)} onFilter={() => setShowGoogleFilter(true)} />;
      case 'admin-google-kw':  return <GoogleKeywords onNewKeyword={() => setShowNewKeyword(true)} onNewNegative={() => setShowNewNegative(true)} />;
      case 'admin-clients':    return <AdminClients onNew={() => setShowNewClient(true)} onChangeClient={handleClientChange} />;
      case 'admin-audiences':  return <AdminAudiences onNew={() => setShowNewAudience(true)} onConfirm={setConfirmDlg} />;
      case 'admin-reports':    return <AdminReports onSend={() => setShowSendReports(true)} onSchedule={() => setShowScheduleReports(true)} />;
      case 'admin-social':     return <AdminSocial />;
      case 'admin-settings':   return <AdminSettings auth={auth} onUpdate={() => supabase.auth.getUser().then(({ data }) => data.user && fetchProfile(data.user))} />;
      // Client
      case 'client-dashboard': return <ClientDashboard clientId={clientId} go={go} />;
      case 'client-campaigns': return <ClientCampaigns clientId={clientId} onOpen={setCampaignId} />;
      case 'client-google':    return <ClientGoogleAds clientId={clientId} onNewCampaign={() => setShowNewGoogleCampaign(true)} />;
      case 'client-creatives': return <ClientCreatives clientId={clientId} />;
      case 'client-leads':     return <ClientLeads clientId={clientId} onOpen={setLeadDetail} />;
      case 'client-social':    return <ClientSocial clientId={clientId} />;
      case 'client-reports':   return <ClientReports clientId={clientId} />;
      case 'client-settings':  return <ClientSettings clientId={clientId} auth={auth} onLogout={handleLogout} />;
      case 'client-support':   return <ClientSupport clientId={clientId} />;
      default:                 return role === 'admin' ? <AdminOverview go={go} auth={auth} onClientChange={handleClientChange} /> : <ClientDashboard clientId={clientId} go={go} />;
    }
  };

  return (
    <AxonDataProvider clientId={clientId} role={role} isAdmin={auth.role === 'admin'}>
      <div className="app">
        <Sidebar
          role={role}
          view={view}
          setView={go}
          auth={auth}
          onLogout={handleLogout}
        />
        <div className="main">
          {auditMode && role === 'client' && (
            <AuditBanner
              clientId={clientId}
              onBack={() => { handleClientChange('admin'); setView('admin-overview'); }}
            />
          )}
          {tokenAlert && (
            <TokenAlert alert={tokenAlert} onClose={() => setTokenAlert(null)} onConfigure={() => { setView('admin-settings'); setTokenAlert(null); }} />
          )}
          <Topbar
            role={role}
            setRole={(r) => {
              if (r === 'client' && auth.role === 'admin') {
                // admin entering client view requires picking a client - default to first
                setView('admin-clients');
              } else if (r === 'admin' && auth.role === 'admin') {
                handleClientChange('admin');
                setView('admin-overview');
              }
            }}
            canSwitch={auth.role === 'admin'}
            view={view}
            theme={theme}
            setTheme={setTheme}
            onPalette={() => setShowPalette(true)}
            onNotifs={() => setShowNotifs(true)}
            onCopilot={() => setShowCopilot(true)}
          />
          <div className="content">{renderView()}</div>
        </div>

        {/* Overlays */}
        <CommandPalette open={showPalette} onClose={() => setShowPalette(false)} setView={go} />
        <NotificationDrawer open={showNotifs} onClose={() => setShowNotifs(false)} userId={auth.uuid} />
        <CopilotDrawer open={showCopilot} onClose={() => setShowCopilot(false)} />
        <OnboardingTour
          open={showOnboarding}
          onClose={async () => {
            setShowOnboarding(false);
            await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', auth.uuid);
          }}
        />

        {/* Modals */}
        <NewClientModal open={showNewClient} onClose={() => setShowNewClient(false)} />
        <NewBMModal open={showNewBM} onClose={() => setShowNewBM(false)} />
        <RelinkModal open={!!relinkAccount} onClose={() => setRelinkAccount(null)} account={relinkAccount} />
        <LeadDetailModal open={!!leadDetail} onClose={() => setLeadDetail(null)} lead={leadDetail} />
        <NewAudienceModal open={showNewAudience} onClose={() => setShowNewAudience(false)} />
        <NewKeywordModal open={showNewKeyword} onClose={() => setShowNewKeyword(false)} />
        <NewNegativeModal open={showNewNegative} onClose={() => setShowNewNegative(false)} />
        <NewGoogleCampaignModal open={showNewGoogleCampaign} onClose={() => setShowNewGoogleCampaign(false)} />
        <SendReportsModal open={showSendReports} onClose={() => setShowSendReports(false)} />
        <ScheduleReportsModal open={showScheduleReports} onClose={() => setShowScheduleReports(false)} />
        <FilterDrawer open={showFilterDrawer} onClose={() => setShowFilterDrawer(false)} />
        <GoogleFilterDrawer open={showGoogleFilter} onClose={() => setShowGoogleFilter(false)} />
        <Confirm
          open={!!confirmDlg}
          onClose={() => setConfirmDlg(null)}
          title={confirmDlg?.title}
          body={confirmDlg?.body}
          danger={confirmDlg?.danger}
          onConfirm={confirmDlg?.onConfirm}
        />
        <ToastHost />
      </div>
    </AxonDataProvider>
  );
}
