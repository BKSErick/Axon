/* ============================================
   Axon — Client Screens (real client data)
   ============================================ */
import React, { useState } from 'react';
import { I } from './icons';
import { KPI, Spark, Status, TT, fmt, R } from './common';
import { useAxonData } from './data-bridge';
import { MOCK_PERFORMANCE_30, MOCK_FUNNEL, MOCK_AGE_DIST, MOCK_REGIONS } from '../lib/mocks/axon';

// Heavy legacy components — kept in original src/components/ location so their
// internal imports stay valid. Namespace import tolerates default OR named export.
import * as LeadsCenterMod from '../components/client/LeadsCenter';
import * as ClientSettingsMod from '../components/client/ClientSettings';
import * as ReportsViewMod from '../components/client/ReportsView';
import * as SocialMediaViewMod from '../components/client/SocialMediaView';
import * as SuporteWhatsAppMod from '../components/client/SuporteWhatsApp';
const LeadsCenter = LeadsCenterMod.LeadsCenter;
const LegacyClientSettings = ClientSettingsMod.ClientSettings;
const ReportsView = ReportsViewMod.ReportsView;
const SocialMediaView = SocialMediaViewMod.SocialMediaView;
const SuporteWhatsApp = SuporteWhatsAppMod.SuporteWhatsApp;

/* -------- helpers (skeleton/empty/header) -------- */
function Skel({ h = 80, w = '100%' }) { return <div style={{ height: h, width: w, borderRadius: 8, background: 'rgb(var(--bg-card))', animation: 'shimmer 1.6s linear infinite' }} />; }
function Empty({ icon, title, sub }) {
  return (
    <div style={{ padding: 40, textAlign: 'center', border: '1px dashed rgb(var(--border))', borderRadius: 12, background: 'rgb(var(--bg-card))' }}>
      <div style={{ marginBottom: 12, color: 'rgb(var(--text-3))' }}>{icon}</div>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>
      {sub && <div className="muted" style={{ fontSize: 13, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>{sub}</div>}
    </div>
  );
}
function PageHeader({ title, sub, actions }) {
  return (
    <div className="page-head">
      <div><h1>{title}</h1>{sub && <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{sub}</div>}</div>
      {actions && <div className="row" style={{ gap: 8 }}>{actions}</div>}
    </div>
  );
}

/* ============================================
   1. CLIENT DASHBOARD
   ============================================ */
export function ClientDashboard({ clientId, go }) {
  const { clientKpis, loading, errors, clients } = useAxonData();
  const client = clients.find(c => c.id === clientId);
  const k = clientKpis;
  const spend = k?.extended?.spend ?? k?.raw?.spend ?? 0;
  const leads = k?.extended?.totalLeads ?? k?.raw?.leads ?? 0;
  const daily = k?.daily?.length ? k.daily : MOCK_PERFORMANCE_30;

  return (
    <>
      <PageHeader
        title={client?.name || 'Dashboard'}
        sub="Sua performance dos últimos 30 dias"
        actions={
          <>
            <button className="btn"><I.cal />Últimos 30d</button>
            <button className="btn"><I.download />PDF</button>
          </>
        }
      />

      {errors.clientKpis && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: 'rgb(var(--c-danger))', fontSize: 13 }}>
          ⚠ {errors.clientKpis}
        </div>
      )}

      <div className="grid-4">
        {loading.clientKpis ? (
          <><Skel h={110} /><Skel h={110} /><Skel h={110} /><Skel h={110} /></>
        ) : (
          <>
            <KPI label="Investido" icon={<I.dollar />} value={spend} fmtVal={fmt.brl} delta={5.2} spark={daily.slice(-10).map(d => ({ v: d.spend }))} />
            <KPI label="Leads" icon={<I.users />} value={leads} fmtVal={fmt.int} delta={11.8} spark={daily.slice(-10).map(d => ({ v: d.leads || 0 }))} />
            <KPI label="CPA" icon={<I.target />} value={k?.cpa || 0} fmtVal={fmt.brl} delta={-3.4} negative />
            <KPI label="ROI" icon={<I.trend />} value={Number(k?.roi) || 0} fmtVal={n => (n || 0) + '%'} delta={1.6} />
          </>
        )}
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-head"><h2>Performance diária</h2></div>
          <div style={{ padding: 16, height: 280 }}>
            <R.ResponsiveContainer width="100%" height="100%">
              <R.LineChart data={daily.map(d => ({ label: d.date || d.label, spend: d.spend, leads: d.leads }))}>
                <R.CartesianGrid stroke="rgb(var(--border-soft))" strokeDasharray="3 3" />
                <R.XAxis dataKey="label" tick={{ fill: 'rgb(var(--text-3))', fontSize: 11 }} stroke="rgb(var(--border))" />
                <R.YAxis yAxisId="l" tick={{ fill: 'rgb(var(--text-3))', fontSize: 11 }} stroke="rgb(var(--border))" />
                <R.YAxis yAxisId="r" orientation="right" tick={{ fill: 'rgb(var(--text-3))', fontSize: 11 }} stroke="rgb(var(--border))" />
                <R.Tooltip content={<TT />} />
                <R.Line yAxisId="l" type="monotone" dataKey="spend" name="Spend" stroke="rgb(var(--accent))" strokeWidth={2} dot={false} />
                <R.Line yAxisId="r" type="monotone" dataKey="leads" name="Leads" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </R.LineChart>
            </R.ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h2>Atalhos</h2></div>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button className="card-action" onClick={() => go('client-campaigns')}><I.trend /><span>Ver campanhas</span></button>
            <button className="card-action" onClick={() => go('client-creatives')}><I.image /><span>Criativos</span></button>
            <button className="card-action" onClick={() => go('client-leads')}><I.users /><span>Leads recentes</span></button>
            <button className="card-action" onClick={() => go('client-social')}><I.insta /><span>Instagram</span></button>
            <button className="card-action" onClick={() => go('client-reports')}><I.file /><span>Relatórios</span></button>
            <button className="card-action" onClick={() => go('client-support')}><I.chat /><span>Suporte WhatsApp</span></button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================================
   2. CLIENT CAMPAIGNS
   ============================================ */
export function ClientCampaigns({ clientId, onOpen }) {
  const { clientCampaigns, loading } = useAxonData();
  return (
    <>
      <PageHeader title="Campanhas Meta" sub={`${clientCampaigns.length} campanhas ativas`} />
      <div className="card">
        <div className="tbl">
          <div className="tbl-row tbl-head"><div>Campanha</div><div className="ta-r">Spend</div><div className="ta-r">Leads</div><div className="ta-r">CPA</div><div className="ta-r">CTR</div><div>Status</div></div>
          {loading.clientCampaigns && Array.from({ length: 4 }, (_, i) => <div key={i} className="tbl-row"><Skel h={20} /><Skel h={20} /><Skel h={20} /><Skel h={20} /><Skel h={20} /><Skel h={20} /></div>)}
          {!loading.clientCampaigns && clientCampaigns.length === 0 && <div style={{ padding: 30 }}><Empty icon={<I.trend />} title="Sem campanhas ativas" sub="Nenhuma campanha encontrada para este período." /></div>}
          {!loading.clientCampaigns && clientCampaigns.map(c => (
            <div key={c.id} className="tbl-row" onClick={() => onOpen(c.id)} style={{ cursor: 'pointer' }}>
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div></div>
              <div className="ta-r num" style={{ fontSize: 13 }}>{fmt.brl(c.spend)}</div>
              <div className="ta-r num">{c.leads || '—'}</div>
              <div className="ta-r num">{c.cpa ? fmt.brl(c.cpa) : '—'}</div>
              <div className="ta-r num">{c.ctr != null ? c.ctr.toFixed(2) + '%' : '—'}</div>
              <div><Status s={c.status === 'active' ? 'ok' : 'warn'} label={c.status} /></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ============================================
   3. CLIENT CREATIVES
   ============================================ */
export function ClientCreatives({ clientId }) {
  const { clientAds, loading } = useAxonData();
  return (
    <>
      <PageHeader title="Criativos" sub="Performance de cada anúncio (imagem, vídeo, carrossel)" />
      {loading.clientAds ? (
        <div className="grid-3"><Skel h={220} /><Skel h={220} /><Skel h={220} /></div>
      ) : clientAds.length === 0 ? (
        <Empty icon={<I.image />} title="Nenhum criativo encontrado" sub="Não há anúncios ativos sincronizados." />
      ) : (
        <div className="grid-3">
          {clientAds.map(ad => (
            <div key={ad.id || ad.ad_id} className="card">
              <div style={{ aspectRatio: '1', background: 'linear-gradient(135deg, rgb(var(--bg-card)) 0%, rgb(var(--bg-card-2)) 100%)', display: 'grid', placeItems: 'center', color: 'rgb(var(--text-3))', borderRadius: '10px 10px 0 0' }}>
                {ad.thumbnail_url ? <img src={ad.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px 10px 0 0' }} /> : <I.image style={{ width: 48, height: 48 }} />}
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{ad.name || ad.ad_name || 'Criativo'}</div>
                <div className="row" style={{ gap: 14, fontSize: 11, color: 'rgb(var(--text-2))' }}>
                  <span>CTR <span className="num" style={{ fontWeight: 600, color: 'rgb(var(--text))' }}>{ad.ctr?.toFixed(2) || '—'}%</span></span>
                  <span>CPA <span className="num" style={{ fontWeight: 600, color: 'rgb(var(--text))' }}>{ad.cpa ? fmt.brl(ad.cpa) : '—'}</span></span>
                  <span>Leads <span className="num" style={{ fontWeight: 600, color: 'rgb(var(--text))' }}>{ad.leads || '—'}</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ============================================
   4. CLIENT LEADS — bridge to legacy LeadsCenter
   Legacy props: ({ user })  — usa user.id como clientId
   ============================================ */
export function ClientLeads({ clientId }) {
  return (
    <div className="legacy-scope" style={{ marginTop: -24, marginLeft: -24, marginRight: -24 }}>
      <LeadsCenter user={{ id: clientId }} />
    </div>
  );
}

/* ============================================
   5. CLIENT SOCIAL — bridge
   Legacy props: ({ user })
   ============================================ */
export function ClientSocial({ clientId }) {
  return (
    <div className="legacy-scope" style={{ marginTop: -24, marginLeft: -24, marginRight: -24 }}>
      <SocialMediaView user={{ id: clientId }} />
    </div>
  );
}

/* ============================================
   6. CLIENT REPORTS — bridge
   Legacy props: ({ user, kpis, campaigns }) — usa dados do contexto
   ============================================ */
export function ClientReports({ clientId }) {
  const { clientKpis, clientCampaigns } = useAxonData();
  return (
    <div className="legacy-scope" style={{ marginTop: -24, marginLeft: -24, marginRight: -24 }}>
      <ReportsView user={{ id: clientId }} kpis={clientKpis} campaigns={clientCampaigns} />
    </div>
  );
}

/* ============================================
   7. CLIENT SETTINGS — bridge
   Legacy props: ({ user, onLogout })
   ============================================ */
export function ClientSettings({ clientId, auth, onLogout }) {
  return (
    <div className="legacy-scope" style={{ marginTop: -24, marginLeft: -24, marginRight: -24 }}>
      <LegacyClientSettings user={auth || { id: clientId }} onLogout={onLogout} />
    </div>
  );
}

/* ============================================
   8. CLIENT SUPPORT — bridge to legacy WhatsApp support
   Legacy props: () — sem props
   ============================================ */
export function ClientSupport() {
  return (
    <div className="legacy-scope" style={{ marginTop: -24, marginLeft: -24, marginRight: -24 }}>
      <SuporteWhatsApp />
    </div>
  );
}
