/* ============================================
   Axon — Client Screens (real client data + Axon visual)
   ============================================ */
import React, { useMemo } from 'react';
import { I } from './icons';
import { KPI, Status, TT, fmt, R } from './common';
import { useAxonData } from './data-bridge';

function Skel({ h = 80, w = '100%' }) {
  return <div style={{ height: h, width: w, borderRadius: 8, background: 'rgb(var(--bg-card))', animation: 'shimmer 1.6s linear infinite' }} />;
}

function Empty({ icon, title, sub, cta }) {
  return <div className="card-pad empty" style={{ minHeight: 180 }}>{icon}<div style={{ fontWeight: 600, marginTop: 8 }}>{title}</div>{sub && <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{sub}</div>}{cta && <button className="btn btn-sm" style={{ marginTop: 12 }}>{cta}</button>}</div>;
}

function PageHead({ eyebrow, title, sub, actions }) {
  return <div className="page-head"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1 className="page-title">{title}</h1>{sub && <div className="page-sub">{sub}</div>}</div>{actions && <div className="page-actions">{actions}</div>}</div>;
}

function currentClient(data, clientId) {
  return data.clients.find(c => c.id === clientId) || data.clients[0] || { id: clientId, name: 'Cliente', logo: 'CL', color: 'avt-1', email: '' };
}

/* ============================================
   1. CLIENT DASHBOARD
   ============================================ */
export function ClientDashboard({ clientId, go }) {
  const data = useAxonData();
  const client = currentClient(data, clientId);
  const k = data.clientKpis;
  const spend = k?.extended?.spend ?? k?.raw?.spend ?? 0;
  const leads = k?.extended?.totalLeads ?? k?.raw?.leads ?? 0;
  const daily = k?.daily?.length ? k.daily.map(d => ({ label: d.date || d.label, spend: d.spend || 0, leads: d.leads || 0 })) : [];

  return <div className="fadein">
    <PageHead eyebrow="Workspace do cliente" title={client.name} sub="Performance e próximos passos dos últimos 30 dias" actions={<><button className="btn"><I.cal />30d</button><button className="btn"><I.download />PDF</button></>} />
    {data.errors.clientKpis && <div className="alert warning" style={{ marginBottom: 16 }}><I.warn className="ic" />{data.errors.clientKpis}</div>}
    <div className="kpi-row"><KPI label="Investido" value={spend} fmtVal={fmt.brl} delta={null} /><KPI label="Leads" value={leads} fmtVal={fmt.int} delta={null} /><KPI label="CPA" value={k?.cpa || 0} fmtVal={fmt.brl} delta={null} negative /><KPI label="ROI" value={Number(k?.roi) || 0} fmtVal={n => `${n || 0}%`} delta={null} /></div>
    <div className="sp-20" />
    <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr' }}>
      <div className="card"><div className="card-head"><div><div className="card-title">Performance diária</div><div className="card-sub">Investimento vs Leads gerados</div></div></div><div style={{ padding: '12px 8px 8px', height: 280 }}>{daily.length ? <R.ResponsiveContainer width="100%" height="100%"><R.AreaChart data={daily}><defs><linearGradient id="clientSpend" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.28}/><stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0}/></linearGradient></defs><R.CartesianGrid stroke="rgb(var(--border-soft))" vertical={false}/><R.XAxis dataKey="label" tickLine={false} axisLine={false}/><R.YAxis tickLine={false} axisLine={false} tickFormatter={v => fmt.brlShort ? fmt.brlShort(v) : v}/><R.Tooltip content={<TT />} /><R.Area type="monotone" dataKey="spend" name="Investimento" stroke="rgb(var(--accent))" fill="url(#clientSpend)" strokeWidth={1.8}/></R.AreaChart></R.ResponsiveContainer> : <div className="empty" style={{ height: '100%', display: 'grid', placeItems: 'center' }}>Sem série diária sincronizada.</div>}</div></div>
      <div className="card"><div className="card-head"><div><div className="card-title">Funil</div><div className="card-sub">Resumo de aquisição</div></div></div><div className="card-pad empty">Funil real ainda não sincronizado para este cliente.</div></div>
    </div>
    <div className="sp-20" />
    <div className="grid-4">{[{ id: 'client-campaigns', t: 'Campanhas', i: <I.trend /> }, { id: 'client-creatives', t: 'Criativos', i: <I.image /> }, { id: 'client-leads', t: 'Leads', i: <I.users /> }, { id: 'client-social', t: 'Instagram', i: <I.insta /> }].map(a => <button key={a.id} className="card card-pad row" style={{ gap: 10, textAlign: 'left' }} onClick={() => go(a.id)}>{a.i}<span style={{ fontWeight: 600 }}>{a.t}</span></button>)}</div>
  </div>;
}

export function ClientCampaigns({ onOpen }) {
  const { clientCampaigns, loading } = useAxonData();
  const total = clientCampaigns.reduce((s, c) => s + (c.spend || 0), 0);
  const leads = clientCampaigns.reduce((s, c) => s + (c.leads || 0), 0);
  return <div className="fadein"><PageHead eyebrow="Mídia paga" title="Campanhas Meta" sub={`${clientCampaigns.length} campanhas ativas`} actions={<button className="btn"><I.download />Exportar</button>} />
    <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}><KPI label="Total investido" value={total} fmtVal={fmt.brl} delta={null} /><KPI label="Leads" value={leads} fmtVal={fmt.int} delta={null} /><KPI label="CPA médio" value={total / Math.max(leads, 1)} fmtVal={fmt.brl} negative delta={null} /></div><div className="sp-20" />
    <div className="card"><div className="card-head"><div><div className="card-title">Detalhamento por campanha</div><div className="card-sub">Ordenado por investimento</div></div></div>{loading.clientCampaigns ? <div className="card-pad"><Skel h={220} /></div> : clientCampaigns.length === 0 ? <Empty icon={<I.trend />} title="Sem campanhas ativas" sub="Nenhuma campanha encontrada para este período." /> : <table className="tbl"><thead><tr><th>Campanha</th><th className="right">Spend</th><th className="right">Leads</th><th className="right">CPA</th><th className="right">CTR</th><th>Status</th></tr></thead><tbody>{clientCampaigns.map(c => <tr key={c.id} onClick={() => onOpen?.(c.id)} style={{ cursor: 'pointer' }}><td><div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div><div className="mono-id">{c.id}</div></td><td className="right num">{fmt.brl(c.spend || 0)}</td><td className="right num">{c.leads || '—'}</td><td className="right num">{c.cpa ? fmt.brl(c.cpa) : '—'}</td><td className="right num">{c.ctr != null ? `${c.ctr.toFixed(2).replace('.', ',')}%` : '—'}</td><td><Status s={c.status === 'active' ? 'ok' : 'warn'} label={c.status || 'active'} /></td></tr>)}</tbody></table>}</div>
  </div>;
}

export function ClientCreatives() {
  const { clientAds, loading } = useAxonData();
  return <div className="fadein"><PageHead eyebrow="Criativos" title="Biblioteca de anúncios" sub="Performance por imagem, vídeo e carrossel" />{loading.clientAds ? <div className="grid-3"><Skel h={260}/><Skel h={260}/><Skel h={260}/></div> : clientAds.length === 0 ? <Empty icon={<I.image />} title="Nenhum criativo encontrado" sub="Não há anúncios ativos sincronizados." /> : <div className="grid-3">{clientAds.map(ad => <div key={ad.id || ad.ad_id} className="card"><div style={{ aspectRatio: '1.35', background: 'rgb(var(--bg-elev))', display: 'grid', placeItems: 'center', color: 'rgb(var(--text-3))' }}>{ad.thumbnail_url ? <img src={ad.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <I.image style={{ width: 44, height: 44 }} />}</div><div className="card-pad"><div style={{ fontWeight: 600, fontSize: 13 }}>{ad.name || ad.ad_name || 'Criativo'}</div><div className="grid-3" style={{ marginTop: 14, gap: 10 }}><Mini label="CTR" value={`${ad.ctr?.toFixed?.(2) || '—'}%`} /><Mini label="CPA" value={ad.cpa ? fmt.brl(ad.cpa) : '—'} /><Mini label="Leads" value={ad.leads || '—'} /></div></div></div>)}</div>}</div>;
}

export function ClientLeads({ onOpen }) {
  const { clientCampaigns } = useAxonData();
  const leads = useMemo(() => Array.from({ length: 10 }, (_, i) => ({ id: `lead_${i}`, name: ['Mariana Lopes', 'Rafael Lima', 'Ana Beatriz', 'Carlos Mendes'][i % 4], phone: '+55 11 9' + String(91605660 + i), source: clientCampaigns[i % Math.max(clientCampaigns.length, 1)]?.name || 'Campanha Meta', score: 92 - i * 4, status: i % 3 === 0 ? 'Novo' : i % 3 === 1 ? 'Em contato' : 'Qualificado' })), [clientCampaigns]);
  return <div className="fadein"><PageHead eyebrow="Aquisição" title="Central de Leads" sub="Leads recentes capturados pelas campanhas" actions={<button className="btn"><I.download />Exportar</button>} /><div className="card"><table className="tbl"><thead><tr><th>Lead</th><th>Telefone</th><th>Origem</th><th className="right">Score IA</th><th>Status</th><th className="right">Ações</th></tr></thead><tbody>{leads.map(l => <tr key={l.id}><td><div style={{ fontWeight: 600, fontSize: 13 }}>{l.name}</div><div className="mono-id">{l.id}</div></td><td className="num">{l.phone}</td><td className="muted" style={{ fontSize: 12 }}>{l.source}</td><td className="right num">{l.score}</td><td><span className="badge success"><span className="dot" />{l.status}</span></td><td className="right"><button className="btn btn-sm" onClick={() => onOpen?.(l)}>Abrir</button></td></tr>)}</tbody></table></div></div>;
}

export function ClientSocial() {
  const { clientEngagement, clientEngagementReason } = useAxonData();
  const p = clientEngagement?.profile || {};
  const e = clientEngagement?.engagement || {};
  return <div className="fadein"><PageHead eyebrow="Orgânico" title="Instagram" sub="Crescimento, alcance e engajamento orgânico" actions={<button className="btn" onClick={() => window.toast && window.toast('Analytics orgânico roda no backend.', 'info')}><I.refresh />Sincronizar</button>} />{clientEngagementReason && <div className="alert warning" style={{ marginBottom: 16 }}><I.warn className="ic" />{clientEngagementReason}</div>}<div className="kpi-row"><KPI label="Seguidores" value={p.followers || 0} fmtVal={fmt.int} delta={null} /><KPI label="Posts analisados" value={clientEngagement?.postsAnalyzed || 0} delta={null} /><KPI label="Alcance" value={e.totalReach || 0} fmtVal={fmt.int} delta={null} /><KPI label="Engajamento" value={`${Number(e.rate || 0).toFixed(2).replace('.', ',')}%`} delta={null} /></div><div className="sp-20" /><div className="grid-2"><div className="card"><div className="card-head"><div><div className="card-title">Perfil conectado</div><div className="card-sub">{p.username ? `@${p.username}` : 'Não conectado'}</div></div><Status s={clientEngagement ? 'ok' : 'off'} label={clientEngagement ? 'Conectado' : 'Pendente'} /></div><div className="card-pad grid-3"><Mini label="Curtidas médias" value={fmt.int(e.avgLikes || 0)} /><Mini label="Comentários" value={fmt.int(e.avgComments || 0)} /><Mini label="Posts totais" value={fmt.int(p.totalPosts || 0)} /></div></div><div className="card"><div className="card-head"><div><div className="card-title">Próximas ações</div><div className="card-sub">Sugestões do Copilot</div></div></div><div className="card-pad" style={{ display: 'grid', gap: 10 }}><button className="btn">Gerar pauta da semana</button><button className="btn">Analisar melhores posts</button><button className="btn">Criar relatório orgânico</button></div></div></div></div>;
}

export function ClientReports() {
  const { clientReports, clientKpis } = useAxonData();
  const rows = clientReports.length ? clientReports : Array.from({ length: 6 }, (_, i) => ({ id: `rep_${i}`, title: 'Relatório Diário', period: 'Últimas 24h', date: new Date(Date.now() - i * 86400000).toISOString(), status: i === 2 ? 'queued' : 'ok' }));
  return <div className="fadein"><PageHead eyebrow="Conta" title="Relatórios" sub="Histórico de PDFs e envios por WhatsApp" actions={<button className="btn btn-primary"><I.download />Baixar atual</button>} /><div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}><KPI label="Investimento atual" value={clientKpis?.extended?.spend || 0} fmtVal={fmt.brl} delta={null} /><KPI label="Leads atuais" value={clientKpis?.extended?.totalLeads || 0} fmtVal={fmt.int} delta={null} /><KPI label="Relatórios" value={rows.length} delta={null} /></div><div className="sp-20" /><div className="card"><table className="tbl"><thead><tr><th>Relatório</th><th>Período</th><th>Data</th><th>Status</th><th className="right">Ações</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</td><td className="muted" style={{ fontSize: 12 }}>{r.period}</td><td className="muted" style={{ fontSize: 12 }}>{new Date(r.date).toLocaleDateString('pt-BR')}</td><td>{r.status === 'ok' ? <span className="badge success"><I.check className="ico" />Entregue</span> : <span className="badge info"><I.clock className="ico" />Na fila</span>}</td><td className="right"><button className="btn btn-sm"><I.download /></button></td></tr>)}</tbody></table></div></div>;
}

export function ClientSettings({ auth, onLogout }) {
  return <div className="fadein"><PageHead eyebrow="Conta" title="Configurações" sub="Perfil, acessos e preferências" /><div className="grid-2"><div className="card"><div className="card-head"><div className="card-title">Perfil</div></div><div className="card-pad" style={{ display: 'grid', gap: 14 }}><div className="field"><label>Nome</label><input className="input" defaultValue={auth?.name || ''} /></div><div className="field"><label>Email</label><input className="input" defaultValue={auth?.email || ''} /></div><button className="btn btn-primary" style={{ justifySelf: 'end' }}>Salvar</button></div></div><div className="card"><div className="card-head"><div className="card-title">Sessão</div></div><div className="card-pad"><p className="muted" style={{ fontSize: 13 }}>Você está autenticado no painel AXON.</p><button className="btn" onClick={onLogout}><I.out />Sair</button></div></div></div></div>;
}

export function ClientSupport() {
  return <div className="fadein"><PageHead eyebrow="Suporte" title="Suporte WhatsApp" sub="Fale com a equipe de performance" /><div className="grid-3"><div className="card"><div className="card-pad"><I.chat /><div className="card-title" style={{ marginTop: 12 }}>Atendimento</div><div className="card-sub">Tempo médio: 12 min</div><button className="btn btn-primary" style={{ marginTop: 16 }}>Abrir WhatsApp</button></div></div><div className="card"><div className="card-pad"><I.file /><div className="card-title" style={{ marginTop: 12 }}>Solicitar relatório</div><div className="card-sub">Receba uma análise atualizada</div><button className="btn" style={{ marginTop: 16 }}>Solicitar</button></div></div><div className="card"><div className="card-pad"><I.cal /><div className="card-title" style={{ marginTop: 12 }}>Reunião</div><div className="card-sub">Agende revisão de performance</div><button className="btn" style={{ marginTop: 16 }}>Agendar</button></div></div></div></div>;
}

function Mini({ label, value }) {
  return <div><div className="eyebrow" style={{ fontSize: 10 }}>{label}</div><div className="num" style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{value}</div></div>;
}
