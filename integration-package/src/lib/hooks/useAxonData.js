/* ============================================
   Axon — useAxonData
   Hooks REAIS pra dados do admin (Supabase + Meta)
   Devolvem dados na shape que as telas Axon esperam
   ============================================ */
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { fetchExtendedOverviewData, calculateBusinessMetrics } from '../metricsAggregator';
import {
  MOCK_AUDIENCES, MOCK_NOTIFICATIONS, MOCK_GOOGLE_CAMPAIGNS,
  MOCK_KEYWORDS, MOCK_NEGATIVE,
} from '../mocks/axon';

// ---------- CLIENTS (admin) ----------
export function useAllClients(enabled = true) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        const { data: rows, error } = await supabase
          .from('clients')
          .select('id, name, email, phone, active, joined')
          .order('joined', { ascending: false });
        if (error) throw error;
        if (!mounted) return;
        // Hidratar com count de ad_accounts
        const ids = (rows || []).map(r => r.id);
        const { data: accs } = await supabase
          .from('ad_accounts')
          .select('client_id')
          .in('client_id', ids.length ? ids : ['__none__']);
        const byClient = {};
        (accs || []).forEach(a => { byClient[a.client_id] = (byClient[a.client_id] || 0) + 1; });
        setData((rows || []).map(r => ({
          id: r.id,
          name: r.name,
          logo: (r.name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase(),
          color: 'avt-' + ((r.name?.length || 1) % 6 + 1),
          email: r.email,
          phone: r.phone,
          status: r.active === false ? 'inactive' : 'ok',
          plan: 'Pro',
          accounts: byClient[r.id] || 0,
          joined: r.joined,
          spend30: 0, leads30: 0, cpa: 0, roi: 0,  // hidratados sob demanda
        })));
      } catch (e) {
        console.error('[useAllClients]', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [enabled]);

  return { data, loading, error };
}

// ---------- BUSINESS MANAGERS ----------
export function useAllBMs(enabled = true) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        const { data: rows, error } = await supabase
          .from('business_managers')
          .select('*')
          .order('connected_at', { ascending: false });
        if (error) throw error;
        if (!mounted) return;
        // Hidratar count de contas
        const ids = (rows || []).map(r => r.id);
        const { data: accs } = await supabase
          .from('ad_accounts')
          .select('bm_id')
          .in('bm_id', ids.length ? ids : ['__none__']);
        const byBM = {};
        (accs || []).forEach(a => { byBM[a.bm_id] = (byBM[a.bm_id] || 0) + 1; });
        setData((rows || []).map(r => ({
          id: r.meta_id || r.id,
          name: r.name,
          connected: r.created_at,
          accounts: byBM[r.id] || 0,
          status: r.token_status || 'ok',
          health: r.health_score ?? 90,
          owner: r.owner_name || '—',
          tokenExp: r.token_expires_at,
        })));
      } catch (e) {
        console.error('[useAllBMs]', e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [enabled]);

  return { data, loading };
}

// ---------- AD ACCOUNTS ----------
export function useAllAdAccounts(enabled = true) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        const { data: rows, error } = await supabase
          .from('ad_accounts')
          .select(`
            id, meta_id, name, status, client_id, bm_id, spend,
            clients(name),
            business_managers(name)
          `);
        if (error) throw error;
        if (!mounted) return;
        setData((rows || []).map(r => ({
          id: r.meta_id || r.id,
          name: r.name,
          bm: r.business_managers?.name || '—',
          client: r.client_id,
          clientName: r.clients?.name || null,
          spend: r.spend || 0,
          status: r.status || 'active',
          linked: !!r.client_id,
        })));
      } catch (e) {
        console.error('[useAllAdAccounts]', e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [enabled]);

  return { data, loading };
}

// ---------- AGGREGATE OVERVIEW (admin) ----------
export function useAdminOverview(enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        const { data: accs } = await supabase
          .from('ad_accounts')
          .select('meta_id')
          .not('client_id', 'is', null);
        const metrics = await fetchExtendedOverviewData(accs || [], 'last_30d');
        if (metrics._error) setError(metrics._error);
        const biz = calculateBusinessMetrics(metrics.kpis.spend, metrics.kpis.totalLeads);
        if (!mounted) return;
        // Normaliza para a shape que as telas Axon esperam
        setData({
          totalSpend: metrics.kpis.spend || 0,
          totalLeads: metrics.kpis.totalLeads || 0,
          cpa: biz.cpa || 0,            // Number
          roi: biz.roi || 0,           // string percentual (ex "120")
          score: biz.score,
          revenue: biz.revenue,
          profit: biz.profit,
          extended: metrics.kpis,
          daily: metrics.daily,
          demographics: metrics.demographics,
        });
      } catch (e) {
        console.error('[useAdminOverview]', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [enabled]);

  return { data, loading, error };
}

// ---------- ALL CAMPAIGNS (admin) ----------
export function useAllCampaigns(period = 'last_30d', enabled = true) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        const { data: accs } = await supabase
          .from('ad_accounts')
          .select('meta_id, name, client_id, clients(name)');
        // Repurpose unified-insights flow:
        const { fetchUnifiedCampaignsInsights } = await import('../metricsAggregator');
        const list = await fetchUnifiedCampaignsInsights(accs || [], period);
        if (!mounted) return;
        // hidratar account/client names
        const byAcc = {};
        (accs || []).forEach(a => { byAcc[a.meta_id] = { name: a.name, clientId: a.client_id, clientName: a.clients?.name }; });
        setData((list || []).map(c => ({
          ...c,
          cpa: c.ssot?.cpa ?? c.cpa ?? 0,
          account: byAcc[c.account_id]?.name || c.account_id || '—',
          client: byAcc[c.account_id]?.clientId,
          clientName: byAcc[c.account_id]?.clientName,
        })));
      } catch (e) {
        console.error('[useAllCampaigns]', e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [period, enabled]);

  return { data, loading };
}

// ---------- REPORTS ----------
export function useAllReports(enabled = true) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        const { data: rows, error } = await supabase
          .from('reports')
          .select('id, client_id, title, period, status, date, clients(name)')
          .order('date', { ascending: false })
          .limit(100);
        if (error) throw error;
        if (!mounted) return;
        setData((rows || []).map(r => ({
          id: r.id,
          title: 'Relatório Diário',
          client: r.client_id,
          clientName: r.clients?.name,
          period: r.period || 'Últimas 24h',
          date: r.date,
          status: r.status,
          attempts: 1,
        })));
      } catch (e) {
        console.error('[useAllReports]', e);
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [enabled]);

  return { data, loading };
}

// ---------- NOTIFICATIONS ----------
// Quando criar a tabela `notifications` no Supabase (ver MIGRATION.md §8.1),
// descomentar a query real e remover o mock.
export function useNotifications(userId) {
  const [data, setData] = useState(MOCK_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from('notifications')
        .select('id, kind, title, body, priority, action, metadata, read, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!mounted) return;
      if (!error && rows) setData(rows);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [userId]);

  const markRead = async (id) => {
    setData(d => d.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const markAllRead = async () => {
    setData(d => d.map(n => ({ ...n, read: true })));
    if (userId) {
      await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    }
  };

  return { data, loading, markRead, markAllRead };
}

// ---------- AUDIENCES (mock até tabela existir) ----------
export function useAudiences(_clientId) {
  return { data: MOCK_AUDIENCES, loading: false };
}

// ---------- GOOGLE ADS (mock — sem integração ainda) ----------
export function useGoogleCampaigns(_clientId) {
  return { data: MOCK_GOOGLE_CAMPAIGNS, loading: false };
}

export function useGoogleKeywords(_clientId) {
  return { data: { keywords: MOCK_KEYWORDS, negatives: MOCK_NEGATIVE }, loading: false };
}
