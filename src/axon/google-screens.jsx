/* ============================================
   Axon — Google Ads Screens (MOCK até integrar Google Ads API)
   Padrão: replicar src/lib/meta.js → src/lib/google.js no futuro
   ============================================ */
import React from 'react';
import { I } from './icons';
import { KPI, fmt, R, TT, Status } from './common';
import { useAxonData } from './data-bridge';
import { MOCK_PERFORMANCE_30 } from '../lib/mocks/axon';

function PageHeader({ title, sub, actions }) {
  return (
    <div className="page-head">
      <div><h1>{title}</h1>{sub && <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{sub}</div>}</div>
      {actions && <div className="row" style={{ gap: 8 }}>{actions}</div>}
    </div>
  );
}

function MockBanner() {
  return (
    <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: 'rgb(var(--c-warning))', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
      <I.warn /> Dados de demonstração — Google Ads API ainda não conectada. Veja <code>MIGRATION.md §8.3</code>.
    </div>
  );
}

export function GoogleAdsOverview({ onOpen, onNewCampaign, onFilter }) {
  const { googleCampaigns } = useAxonData();
  const totalSpend = googleCampaigns.reduce((s, c) => s + (c.spend || 0), 0);
  const totalConv = googleCampaigns.reduce((s, c) => s + (c.conv || 0), 0);
  const totalClicks = googleCampaigns.reduce((s, c) => s + (c.clicks || 0), 0);
  const cpa = totalConv ? totalSpend / totalConv : 0;

  return (
    <>
      <PageHeader
        title="Google Ads"
        sub="Visão consolidada de todas as campanhas Google"
        actions={
          <>
            <button className="btn" onClick={onFilter}><I.filter />Filtros</button>
            <button className="btn btn-primary" onClick={onNewCampaign}><I.plus />Nova campanha</button>
          </>
        }
      />
      <MockBanner />

      <div className="grid-4">
        <KPI label="Investimento" icon={<I.dollar />} value={totalSpend} fmtVal={fmt.brl} delta={6.4} />
        <KPI label="Cliques" icon={<I.bolt />} value={totalClicks} fmtVal={fmt.int} delta={9.8} />
        <KPI label="Conversões" icon={<I.target />} value={totalConv} fmtVal={fmt.int} delta={14.2} />
        <KPI label="CPA médio" icon={<I.trend />} value={cpa} fmtVal={fmt.brl} delta={-3.1} negative />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head"><h2>Investimento (30d)</h2></div>
        <div style={{ padding: 16, height: 260 }}>
          <R.ResponsiveContainer width="100%" height="100%">
            <R.AreaChart data={MOCK_PERFORMANCE_30.map(d => ({ label: d.label, v: d.spend * 0.7 }))}>
              <defs>
                <linearGradient id="gG" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4285F4" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#4285F4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <R.CartesianGrid stroke="rgb(var(--border-soft))" strokeDasharray="3 3" />
              <R.XAxis dataKey="label" tick={{ fill: 'rgb(var(--text-3))', fontSize: 11 }} />
              <R.YAxis tick={{ fill: 'rgb(var(--text-3))', fontSize: 11 }} />
              <R.Tooltip content={<TT prefix="R$ " />} />
              <R.Area type="monotone" dataKey="v" stroke="#4285F4" strokeWidth={2} fill="url(#gG)" />
            </R.AreaChart>
          </R.ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head"><h2>Campanhas</h2></div>
        <div className="tbl">
          <div className="tbl-row tbl-head"><div>Campanha</div><div>Tipo</div><div className="ta-r">Spend</div><div className="ta-r">Cliques</div><div className="ta-r">Conv.</div><div className="ta-r">CTR</div><div className="ta-r">CPC</div><div>Status</div></div>
          {googleCampaigns.map(c => (
            <div key={c.id} className="tbl-row" onClick={() => onOpen?.(c.id)} style={{ cursor: 'pointer' }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
              <div style={{ fontSize: 12 }}><span className="tag">{c.type}</span></div>
              <div className="ta-r num">{fmt.brl(c.spend)}</div>
              <div className="ta-r num">{fmt.int(c.clicks)}</div>
              <div className="ta-r num">{c.conv}</div>
              <div className="ta-r num">{c.ctr?.toFixed(2)}%</div>
              <div className="ta-r num">{fmt.brl(c.cpc)}</div>
              <div><Status s={c.status === 'active' ? 'ok' : 'off'} label={c.status} /></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function GoogleKeywords({ onNewKeyword, onNewNegative }) {
  const { googleKeywords } = useAxonData();
  const { keywords, negatives } = googleKeywords;
  return (
    <>
      <PageHeader
        title="Palavras-chave"
        sub="Performance de keywords e gestão de negativas"
        actions={
          <>
            <button className="btn" onClick={onNewNegative}><I.plus />Negativa</button>
            <button className="btn btn-primary" onClick={onNewKeyword}><I.plus />Nova palavra-chave</button>
          </>
        }
      />
      <MockBanner />

      <div className="card">
        <div className="card-head"><h2>Palavras-chave ativas</h2></div>
        <div className="tbl">
          <div className="tbl-row tbl-head"><div>Termo</div><div>Match</div><div className="ta-r">Impr.</div><div className="ta-r">Cliques</div><div className="ta-r">CPC</div><div className="ta-r">Conv.</div><div className="ta-r">QS</div></div>
          {keywords.map((k, i) => (
            <div key={i} className="tbl-row">
              <div style={{ fontWeight: 600, fontSize: 13 }}>{k.kw}</div>
              <div><span className="tag">{k.match}</span></div>
              <div className="ta-r num">{fmt.int(k.impr)}</div>
              <div className="ta-r num">{fmt.int(k.clicks)}</div>
              <div className="ta-r num">{fmt.brl(k.cpc)}</div>
              <div className="ta-r num">{k.conv}</div>
              <div className="ta-r num">{k.qs}/10</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head"><h2>Negativas</h2></div>
        <div className="tbl">
          <div className="tbl-row tbl-head"><div>Termo</div><div>Lista</div><div></div></div>
          {negatives.map((n, i) => (
            <div key={i} className="tbl-row">
              <div className="txt-mono" style={{ fontSize: 13 }}>{n.kw}</div>
              <div style={{ fontSize: 13 }}>{n.list}</div>
              <div className="ta-r"><button className="btn btn-sm btn-ghost btn-icon"><I.trash /></button></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function ClientGoogleAds({ clientId, onNewCampaign }) {
  const { googleCampaigns } = useAxonData();
  return (
    <>
      <PageHeader title="Google Ads" sub="Suas campanhas Google" />
      <MockBanner />
      <div className="card">
        <div className="tbl">
          <div className="tbl-row tbl-head"><div>Campanha</div><div>Tipo</div><div className="ta-r">Spend</div><div className="ta-r">Conv.</div><div>Status</div></div>
          {googleCampaigns.map(c => (
            <div key={c.id} className="tbl-row">
              <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
              <div><span className="tag">{c.type}</span></div>
              <div className="ta-r num">{fmt.brl(c.spend)}</div>
              <div className="ta-r num">{c.conv}</div>
              <div><Status s={c.status === 'active' ? 'ok' : 'off'} label={c.status} /></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
