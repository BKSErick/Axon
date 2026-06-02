/* ============================================
   Axon — Google Ads Screens (Axon visual)
   ============================================ */
import React, { useMemo, useState } from 'react';
import { I } from './icons';
import { KPI, fmt, R, TT, Status } from './common';
import { useAxonData } from './data-bridge';

function PageHead({ eyebrow, title, sub, actions }) {
  return <div className="page-head"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1 className="page-title">{title}</h1>{sub && <div className="page-sub">{sub}</div>}</div>{actions && <div className="page-actions">{actions}</div>}</div>;
}

function GoogleMark() {
  return <span style={{ width: 18, height: 18, borderRadius: 999, display: 'inline-grid', placeItems: 'center', fontWeight: 800, fontSize: 12, color: '#fff', background: 'linear-gradient(135deg,#4285F4,#34A853,#FBBC05,#EA4335)' }}>G</span>;
}

function GoogleNote() {
  return <div className="alert warning" style={{ marginBottom: 16 }}><I.warn className="ic" /><div><strong>Google Ads em modo preview.</strong> A integração real ainda deve seguir o mesmo padrão da Meta API quando o token Google for conectado.</div></div>;
}

export function GoogleAdsOverview({ onOpen, onNewCampaign, onFilter }) {
  const { googleCampaigns } = useAxonData();
  const [range, setRange] = useState('30d');
  const totalSpend = googleCampaigns.reduce((s, c) => s + (c.spend || 0), 0);
  const totalConv = googleCampaigns.reduce((s, c) => s + (c.conv || 0), 0);
  const totalClicks = googleCampaigns.reduce((s, c) => s + (c.clicks || 0), 0);
  const cpa = totalConv ? totalSpend / totalConv : 0;
  const rows = [...googleCampaigns].sort((a, b) => (b.spend || 0) - (a.spend || 0));
  const chartData = rows.map(c => ({ label: c.name?.slice(0, 12) || c.id, v: c.spend || 0 }));

  return <div className="fadein">
    <PageHead eyebrow="Google Ads" title="Visão geral" sub="Campanhas Search, Performance Max e Display" actions={<><div className="seg"><button className={range === '7d' ? 'on' : ''} onClick={() => setRange('7d')}>7d</button><button className={range === '30d' ? 'on' : ''} onClick={() => setRange('30d')}>30d</button><button className={range === '90d' ? 'on' : ''} onClick={() => setRange('90d')}>90d</button></div><button className="btn" onClick={onFilter}><I.filter />Filtros</button><button className="btn btn-primary" onClick={onNewCampaign}><I.plus />Nova campanha</button></>} />
    <GoogleNote />
    <div className="kpi-row"><KPI label={<><GoogleMark /> Investimento</>} value={totalSpend} fmtVal={fmt.brl} delta={null} /><KPI label="Cliques" value={totalClicks} fmtVal={fmt.int} delta={null} /><KPI label="Conversões" value={totalConv} fmtVal={fmt.int} delta={null} /><KPI label="CPA médio" value={cpa} fmtVal={fmt.brl} delta={null} negative /></div>
    <div className="sp-20" />
    <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr' }}>
      <div className="card"><div className="card-head"><div><div className="card-title">Investimento por campanha</div><div className="card-sub">Disponível quando Google Ads estiver conectado</div></div></div><div style={{ padding: '12px 8px 8px', height: 280 }}>{chartData.length ? <R.ResponsiveContainer width="100%" height="100%"><R.AreaChart data={chartData}><defs><linearGradient id="googleSpend" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#4285F4" stopOpacity={0.32}/><stop offset="100%" stopColor="#4285F4" stopOpacity={0}/></linearGradient></defs><R.CartesianGrid stroke="rgb(var(--border-soft))" vertical={false}/><R.XAxis dataKey="label" tickLine={false} axisLine={false}/><R.YAxis tickLine={false} axisLine={false}/><R.Tooltip content={<TT prefix="R$ " />} /><R.Area type="monotone" dataKey="v" stroke="#4285F4" fill="url(#googleSpend)" strokeWidth={1.8}/></R.AreaChart></R.ResponsiveContainer> : <div className="empty" style={{ height: '100%', display: 'grid', placeItems: 'center' }}>Nenhum dado Google conectado.</div>}</div></div>
      <div className="card"><div className="card-head"><div><div className="card-title">Distribuição</div><div className="card-sub">Por tipo de campanha</div></div></div><div className="card-pad" style={{ display: 'grid', gap: 14 }}>{['Search', 'Performance Max', 'Display'].map((type, i) => { const count = rows.filter(r => r.type === type || (type === 'Performance Max' && r.type === 'PMax')).length; return <div key={type}><div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 13 }}>{type}</span><span className="num muted" style={{ fontSize: 12 }}>{count} campanhas</span></div><div className="bar"><span style={{ width: `${Math.max(12, 70 - i * 18)}%`, background: ['#4285F4', '#34A853', '#FBBC05'][i] }} /></div></div>; })}</div></div>
    </div>
    <div className="sp-20" />
    <div className="card"><div className="card-head"><div><div className="card-title">Campanhas Google</div><div className="card-sub">Ordenado por investimento</div></div><button className="btn btn-sm btn-ghost"><I.search /></button></div>{rows.length ? <table className="tbl"><thead><tr><th>Campanha</th><th>Tipo</th><th className="right">Spend</th><th className="right">Cliques</th><th className="right">Conv.</th><th className="right">CTR</th><th className="right">CPC</th><th>Status</th></tr></thead><tbody>{rows.map(c => <tr key={c.id} onClick={() => onOpen?.(c.id)} style={{ cursor: 'pointer' }}><td><div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div><div className="mono-id">{c.id}</div></td><td><span className="badge info">{c.type}</span></td><td className="right num">{fmt.brl(c.spend || 0)}</td><td className="right num">{fmt.int(c.clicks || 0)}</td><td className="right num">{c.conv || 0}</td><td className="right num">{c.ctr?.toFixed?.(2).replace('.', ',')}%</td><td className="right num">{fmt.brl(c.cpc || 0)}</td><td><Status s={c.status === 'active' ? 'ok' : 'off'} label={c.status === 'active' ? 'Ativa' : 'Pausada'} /></td></tr>)}</tbody></table> : <div className="card-pad empty">Nenhuma campanha Google conectada.</div>}</div>
  </div>;
}

export function GoogleKeywords({ onNewKeyword, onNewNegative }) {
  const { googleKeywords } = useAxonData();
  const { keywords, negatives } = googleKeywords;
  const clicks = keywords.reduce((s, k) => s + (k.clicks || 0), 0);
  const impr = keywords.reduce((s, k) => s + (k.impr || 0), 0);
  return <div className="fadein"><PageHead eyebrow="Google Ads" title="Palavras-chave" sub="Keywords, negativas e qualidade de busca" actions={<><button className="btn" onClick={onNewNegative}><I.plus />Negativa</button><button className="btn btn-primary" onClick={onNewKeyword}><I.plus />Nova palavra-chave</button></>} /><GoogleNote /><div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}><KPI label="Impressões" value={impr} fmtVal={fmt.int} delta={null} /><KPI label="Cliques" value={clicks} fmtVal={fmt.int} delta={null} /><KPI label="CTR médio" value={impr ? `${((clicks / impr) * 100).toFixed(2).replace('.', ',')}%` : '—'} delta={null} /></div><div className="sp-20" /><div className="card"><div className="card-head"><div><div className="card-title">Palavras-chave ativas</div><div className="card-sub">Termos com entrega no período</div></div></div>{keywords.length ? <table className="tbl"><thead><tr><th>Termo</th><th>Match</th><th className="right">Impr.</th><th className="right">Cliques</th><th className="right">CPC</th><th className="right">Conv.</th><th className="right">QS</th></tr></thead><tbody>{keywords.map((k, i) => <tr key={`${k.kw}-${i}`}><td style={{ fontWeight: 600, fontSize: 13 }}>{k.kw}</td><td><span className="badge">{k.match}</span></td><td className="right num">{fmt.int(k.impr || 0)}</td><td className="right num">{fmt.int(k.clicks || 0)}</td><td className="right num">{fmt.brl(k.cpc || 0)}</td><td className="right num">{k.conv || 0}</td><td className="right num">{k.qs || 0}/10</td></tr>)}</tbody></table> : <div className="card-pad empty">Nenhuma keyword Google conectada.</div>}</div><div className="sp-20" /><div className="card"><div className="card-head"><div><div className="card-title">Negativas</div><div className="card-sub">Listas aplicadas para limpar tráfego</div></div></div>{negatives.length ? <table className="tbl"><thead><tr><th>Termo</th><th>Lista</th><th className="right">Ações</th></tr></thead><tbody>{negatives.map((n, i) => <tr key={`${n.kw}-${i}`}><td className="txt-mono" style={{ fontSize: 13 }}>{n.kw}</td><td className="muted" style={{ fontSize: 12 }}>{n.list}</td><td className="right"><button className="btn btn-sm btn-ghost btn-icon"><I.trash /></button></td></tr>)}</tbody></table> : <div className="card-pad empty">Nenhuma negativa Google conectada.</div>}</div></div>;
}

export function ClientGoogleAds({ onNewCampaign }) {
  const { googleCampaigns } = useAxonData();
  const rows = googleCampaigns.slice(0, 8);
  return <div className="fadein"><PageHead eyebrow="Mídia paga" title="Google Ads" sub="Suas campanhas Google" actions={<button className="btn btn-primary" onClick={onNewCampaign}><I.plus />Nova campanha</button>} /><GoogleNote /><div className="card"><div className="card-head"><div><div className="card-title">Campanhas</div><div className="card-sub">Resumo de performance</div></div></div>{rows.length ? <table className="tbl"><thead><tr><th>Campanha</th><th>Tipo</th><th className="right">Spend</th><th className="right">Conv.</th><th>Status</th></tr></thead><tbody>{rows.map(c => <tr key={c.id}><td style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</td><td><span className="badge info">{c.type}</span></td><td className="right num">{fmt.brl(c.spend || 0)}</td><td className="right num">{c.conv || 0}</td><td><Status s={c.status === 'active' ? 'ok' : 'off'} label={c.status === 'active' ? 'Ativa' : 'Pausada'} /></td></tr>)}</tbody></table> : <div className="card-pad empty">Nenhuma campanha Google conectada.</div>}</div></div>;
}
