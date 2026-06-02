/* ============================================
   Axon — Admin Screens (real Supabase + Meta data)
   ============================================ */
import React, { useMemo, useState } from 'react';
import { I } from './icons';
import { KPI, Spark, Status, TT, fmt, R } from './common';
import { useAxonData } from './data-bridge';
import { MOCK_AGE_DIST, MOCK_REGIONS } from '../lib/mocks/axon';

// Legacy bridges (heavy components — kept in original location so their
// internal ../lib and ../data imports stay valid). Namespace import tolerates
// both `export default` and named exports.

/* -------- Skeleton + Empty -------- */
function Skel({ h = 80, w = '100%', r = 8 }) {
  return <div style={{ height: h, width: w, borderRadius: r, background: 'rgb(var(--bg-card))', backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)', backgroundSize: '200% 100%', animation: 'shimmer 1.6s linear infinite' }} />;
}
function Empty({ icon, title, sub, cta, onCta }) {
  return (
    <div style={{ padding: 40, textAlign: 'center', border: '1px dashed rgb(var(--border))', borderRadius: 12, background: 'rgb(var(--bg-card))' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: 'rgb(var(--text-3))' }}>{icon}</div>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>
      {sub && <div className="muted" style={{ fontSize: 13, marginBottom: 16, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>{sub}</div>}
      {cta && <button className="btn btn-primary" onClick={onCta}><I.plus />{cta}</button>}
    </div>
  );
}

/* -------- Page Header -------- */
function PageHeader({ eyebrow, title, sub, actions }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="page-title">{title}</h1>
        {sub && <div className="page-sub">{sub}</div>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

/* ============================================
   1. ADMIN OVERVIEW
   ============================================ */
export function AdminOverview({ go, auth, onClientChange }) {
  const { adminOverview, clients, loading, errors } = useAxonData();
  const k = adminOverview;
  const dailyData = (k?.daily?.length ? k.daily.map(d => ({ label: d.date, v: d.spend })) : []);

  return (
    <>
      <PageHeader
        title={`Olá, ${auth?.name?.split(' ')[0] || 'gestor'}`}
        sub="Visão consolidada de todos os clientes nos últimos 30 dias."
        actions={
          <>
            <button className="btn"><I.cal />Últimos 30 dias</button>
            <button className="btn"><I.refresh />Atualizar</button>
            <button className="btn btn-primary" onClick={() => go('admin-clients')}><I.plus />Novo cliente</button>
          </>
        }
      />

      {errors.adminOverview && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: 'rgb(var(--c-danger))', fontSize: 13 }}>
          ⚠ {errors.adminOverview}
        </div>
      )}

      <div className="grid-4">
        {loading.adminOverview ? (
          <><Skel h={110} /><Skel h={110} /><Skel h={110} /><Skel h={110} /></>
        ) : (
          <>
            <KPI label="Investimento" icon={<I.dollar />} value={k?.totalSpend || 0} fmtVal={fmt.brl} delta={null} spark={dailyData.slice(-10)} />
            <KPI label="Leads gerados" icon={<I.users />} value={k?.totalLeads || 0} fmtVal={fmt.int} delta={null} spark={dailyData.slice(-10)} />
            <KPI label="CPA médio" icon={<I.target />} value={k?.cpa || 0} fmtVal={fmt.brl} delta={null} negative spark={dailyData.slice(-10)} />
            <KPI label="ROI estimado" icon={<I.trend />} value={Number(k?.roi) || 0} fmtVal={n => (n || 0) + '%'} delta={null} spark={dailyData.slice(-10)} />
          </>
        )}
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-head"><h2>Investimento × Leads (30 dias)</h2></div>
          <div style={{ padding: 20, height: 260 }}>
            {dailyData.length ? <R.ResponsiveContainer width="100%" height="100%">
              <R.AreaChart data={k.daily.map(d => ({ label: d.date, spend: d.spend, leads: d.leads }))}>
                <defs>
                  <linearGradient id="gSpend" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <R.CartesianGrid stroke="rgb(var(--border-soft))" strokeDasharray="3 3" />
                <R.XAxis dataKey="label" tick={{ fill: 'rgb(var(--text-3))', fontSize: 11 }} stroke="rgb(var(--border))" />
                <R.YAxis tick={{ fill: 'rgb(var(--text-3))', fontSize: 11 }} stroke="rgb(var(--border))" />
                <R.Tooltip content={<TT prefix="R$ " />} />
                <R.Area type="monotone" dataKey="spend" name="Investimento" stroke="rgb(var(--accent))" strokeWidth={2} fill="url(#gSpend)" />
              </R.AreaChart>
            </R.ResponsiveContainer> : <div className="empty" style={{ height: '100%', display: 'grid', placeItems: 'center' }}>Sem série diária sincronizada.</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h2>Funil consolidado</h2></div>
          <div className="card-pad empty">Funil consolidado real ainda não sincronizado.</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head"><h2>Clientes ativos</h2><button className="btn btn-sm" onClick={() => go('admin-clients')}>Ver todos →</button></div>
        <div className="tbl">
          <div className="tbl-row tbl-head">
            <div>Cliente</div><div>Status</div><div className="ta-r">Contas</div><div className="ta-r">Plano</div><div></div>
          </div>
          {loading.clients
            ? Array.from({ length: 3 }, (_, i) => <div key={i} className="tbl-row"><Skel h={20} /><Skel h={20} /><Skel h={20} /><Skel h={20} /><Skel h={20} /></div>)
            : clients.slice(0, 5).map(c => (
              <div key={c.id} className="tbl-row">
                <div className="row" style={{ gap: 10 }}>
                  <span className={`avatar ${c.color}`}>{c.logo}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{c.email}</div>
                  </div>
                </div>
                <Status s={c.status} label={c.status === 'ok' ? 'Ativo' : 'Atenção'} />
                <div className="ta-r num">{c.accounts}</div>
                <div className="ta-r"><span className="tag">{c.plan}</span></div>
                <div className="ta-r">
                  <button className="btn btn-sm" onClick={() => onClientChange(c.id)}><I.eye />Ver como cliente</button>
                </div>
              </div>
            ))}
          {!loading.clients && clients.length === 0 && (
            <div style={{ padding: 30 }}><Empty icon={<I.users />} title="Nenhum cliente cadastrado" sub="Cadastre seu primeiro cliente pra começar." cta="Novo cliente" onCta={() => go('admin-clients')} /></div>
          )}
        </div>
      </div>
    </>
  );
}

/* ============================================
   2. BUSINESS MANAGERS
   ============================================ */
export function AdminBMs({ onNew }) {
  const { bms, loading } = useAxonData();
  return (
    <div className="fadein">
      <PageHeader
        eyebrow="Conex?es"
        title="Business Managers"
        sub="Gerencie conex?es e tokens da Meta Business API"
        actions={<><button className="btn"><I.refresh />Sincronizar Meta</button><button className="btn btn-primary" onClick={onNew}><I.plus />Novo BM</button></>}
      />
      {loading.bms ? <div className="card"><div className="card-pad"><Skel h={220} /></div></div> : bms.length === 0 ? (
        <Empty icon={<I.briefcase />} title="Nenhum BM conectado" sub="Conecte sua primeira Business Manager do Meta para sincronizar contas e campanhas." cta="Conectar BM" onCta={onNew} />
      ) : (
        <div className="card">
          <table className="tbl">
            <thead><tr><th>Business Manager</th><th>Owner</th><th>ID</th><th className="right">Contas</th><th>Sa?de do token</th><th className="right">A??es</th></tr></thead>
            <tbody>{bms.map(b => <tr key={b.id}><td><div className="row" style={{ gap: 10 }}><span className="avt lg avt-1"><I.briefcase /></span><div><div style={{ fontWeight: 600, fontSize: 13 }}>{b.name}</div><div className="muted" style={{ fontSize: 11 }}>{b.accounts} contas sob gest?o</div></div></div></td><td><span className="muted" style={{ fontSize: 12 }}>{b.owner || 'BKS Grow'}</span></td><td className="mono-id">{b.id}</td><td className="right num">{b.accounts}</td><td><div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}><div className="row" style={{ justifyContent: 'space-between' }}><span className={`badge ${b.status === 'ok' ? 'success' : 'warning'}`}><span className="dot" />{b.health || 89}%</span><span className="muted" style={{ fontSize: 11 }}>ativo</span></div><div className="bar"><span style={{ width: `${b.health || 89}%`, background: (b.health || 89) > 80 ? 'rgb(var(--c-success))' : 'rgb(var(--c-warning))' }} /></div></div></td><td className="right"><button className="btn btn-sm btn-ghost"><I.refresh /></button><button className="btn btn-sm btn-ghost"><I.more /></button></td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============================================
   3. AD ACCOUNTS
   ============================================ */
export function AdminAccounts({ onLink }) {
  const { accounts, clients, loading } = useAxonData();
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'unlinked' ? accounts.filter(a => !a.linked) : accounts;
  return (
    <>
      <PageHeader
        title="Contas de Anúncio"
        sub={`${accounts.length} contas conectadas — ${accounts.filter(a => !a.linked).length} sem cliente vinculado`}
        actions={
          <div className="seg">
            <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>Todas</button>
            <button className={filter === 'unlinked' ? 'on' : ''} onClick={() => setFilter('unlinked')}>Sem cliente</button>
          </div>
        }
      />
      <div className="card">
        <div className="tbl">
          <div className="tbl-row tbl-head">
            <div>Conta</div><div>BM</div><div>Cliente</div><div className="ta-r">Spend 30d</div><div>Status</div><div></div>
          </div>
          {loading.accounts && Array.from({ length: 4 }, (_, i) => <div key={i} className="tbl-row"><Skel h={20} /><Skel h={20} /><Skel h={20} /><Skel h={20} /><Skel h={20} /><Skel h={20} /></div>)}
          {!loading.accounts && filtered.map(a => {
            const client = clients.find(c => c.id === a.client);
            return (
              <div key={a.id} className="tbl-row">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</div>
                  <div className="txt-mono muted" style={{ fontSize: 11 }}>{a.id}</div>
                </div>
                <div style={{ fontSize: 13 }}>{a.bm}</div>
                <div>
                  {client ? (
                    <div className="row" style={{ gap: 8 }}><span className={`avatar ${client.color}`} style={{ width: 22, height: 22, fontSize: 10 }}>{client.logo}</span><span style={{ fontSize: 13 }}>{client.name}</span></div>
                  ) : (
                    <button className="btn btn-sm" onClick={() => onLink(a)}><I.link />Vincular</button>
                  )}
                </div>
                <div className="ta-r num" style={{ fontSize: 13 }}>{fmt.brl(a.spend)}</div>
                <div><Status s={a.status === 'active' ? 'ok' : 'off'} label={a.status} /></div>
                <div className="ta-r"><button className="btn btn-sm btn-ghost btn-icon"><I.more /></button></div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ============================================
   4. CAMPAIGNS
   ============================================ */
export function AdminCampaigns({ onOpen, onFilter }) {
  const { campaigns, loading } = useAxonData();
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    if (!q.trim()) return campaigns;
    const s = q.toLowerCase();
    return campaigns.filter(c => c.name?.toLowerCase().includes(s) || c.account?.toLowerCase().includes(s));
  }, [q, campaigns]);

  return (
    <>
      <PageHeader
        eyebrow="Performance"
        title="Todas as Campanhas"
        sub={`${campaigns.length} campanhas — ordenadas por investimento`}
        actions={
          <>
            <input className="input" placeholder="Buscar campanha…" value={q} onChange={e => setQ(e.target.value)} style={{ width: 240 }} />
            <button className="btn" onClick={onFilter}><I.filter />Filtros</button>
            <button className="btn"><I.download />Exportar</button>
          </>
        }
      />
      <div className="card">
        <div className="tbl">
          <div className="tbl-row tbl-head">
            <div>Campanha</div><div>Conta</div><div className="ta-r">Spend</div><div className="ta-r">Leads</div><div className="ta-r">CPA</div><div className="ta-r">CTR</div><div>Status</div>
          </div>
          {loading.campaigns && Array.from({ length: 5 }, (_, i) => <div key={i} className="tbl-row"><Skel h={20} /><Skel h={20} /><Skel h={20} /><Skel h={20} /><Skel h={20} /><Skel h={20} /><Skel h={20} /></div>)}
          {!loading.campaigns && filtered.length === 0 && (
            <div style={{ padding: 30 }}><Empty icon={<I.trend />} title="Sem campanhas" sub="Nenhuma campanha encontrada com os filtros atuais." /></div>
          )}
          {!loading.campaigns && filtered.map(c => (
            <div key={c.id} className="tbl-row" onClick={() => onOpen(c.id)} style={{ cursor: 'pointer' }}>
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div><div className="muted" style={{ fontSize: 11 }}>{c.id}</div></div>
              <div style={{ fontSize: 13 }}>{c.account}</div>
              <div className="ta-r num" style={{ fontSize: 13 }}>{fmt.brl(c.spend)}</div>
              <div className="ta-r num" style={{ fontSize: 13 }}>{c.leads || '—'}</div>
              <div className="ta-r num" style={{ fontSize: 13 }}>{c.cpa ? fmt.brl(c.cpa) : '—'}</div>
              <div className="ta-r num" style={{ fontSize: 13 }}>{c.ctr != null ? c.ctr.toFixed(2) + '%' : '—'}</div>
              <div><Status s={c.status === 'active' ? 'ok' : c.status === 'warn' ? 'warn' : 'off'} label={c.status} /></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ============================================
   5. CLIENTS
   ============================================ */
export function AdminClients({ onNew, onChangeClient }) {
  const { clients, loading } = useAxonData();
  return (
    <div className="fadein">
      <PageHeader
        eyebrow="Gest?o"
        title="Clientes"
        sub={`${clients.length} clientes ativos ? acesso, permiss?es e sincroniza??o`}
        actions={<><div className="input-with-icon"><I.search /><input className="input" placeholder="Buscar cliente..." style={{ width: 240 }} /></div><button className="btn btn-primary" onClick={onNew}><I.plus />Cadastrar cliente</button></>}
      />
      {loading.clients ? <div className="card"><div className="card-pad"><Skel h={260} /></div></div> : clients.length === 0 ? (
        <Empty icon={<I.users />} title="Nenhum cliente" sub="Cadastre seu primeiro cliente." cta="Novo cliente" onCta={onNew} />
      ) : (
        <div className="card">
          <table className="tbl">
            <thead><tr><th>Cliente</th><th>Plano</th><th className="right">Contas</th><th>Status</th><th className="right">A??es</th></tr></thead>
            <tbody>{clients.map(c => <tr key={c.id}><td><div className="row" style={{ gap: 10 }}><span className={`avt lg ${c.color}`}>{c.logo}</span><div><div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div><div className="muted" style={{ fontSize: 11 }}>{c.email}</div></div></div></td><td><span className={`badge ${c.plan === 'Pro' ? 'accent' : ''}`}>{c.plan}</span></td><td className="right num">{c.accounts}</td><td><Status s={c.status === 'ok' ? 'ok' : 'warn'} label={c.status === 'ok' ? 'Saud?vel' : 'Aten??o'} /></td><td className="right"><button className="btn btn-sm btn-ghost" title="Ver como cliente" onClick={() => onChangeClient(c.id)}><I.eye /></button><button className="btn btn-sm btn-ghost"><I.send /></button><button className="btn btn-sm btn-ghost"><I.more /></button></td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============================================
   6. AUDIENCES - Axon original screen
   ============================================ */
export function AdminAudiences({ onNew }) {
  const { audiences, clients } = useAxonData();
  const rows = audiences.length ? audiences : [
    { id: 'aud_01', name: 'Investidores SP 35-55', type: 'Saved', source: 'Interesse + Geo', client: 'Alpha', size: '892,0K', used: '8 camps.', ctr: '3,40%', cpa: 'R$ 178,00' },
    { id: 'aud_02', name: 'Lookalike 1% - Leads Q1', type: 'Lookalike', source: '1% BR', client: 'Alpha', size: '2,3M', used: '4 camps.', ctr: '2,80%', cpa: 'R$ 212,00' },
    { id: 'aud_03', name: 'Remarketing 30d - Site', type: 'Custom', source: 'Pixel', client: 'Via', size: '18,4K', used: '6 camps.', ctr: '4,90%', cpa: 'R$ 92,00' },
    { id: 'aud_04', name: 'Engajados Instagram 90d', type: 'Custom', source: 'Instagram', client: 'Alpha', size: '24,8K', used: '3 camps.', ctr: '5,60%', cpa: 'R$ 84,00' },
    { id: 'aud_05', name: 'Compradores anteriores - CRM', type: 'Custom', source: 'Lista CRM', client: 'GT', size: '3,2K', used: '2 camps.', ctr: '6,20%', cpa: 'R$ 62,00' },
    { id: 'aud_06', name: 'Lookalike 3% - Compradores', type: 'Lookalike', source: '3% BR', client: 'GT', size: '5,2M', used: '5 camps.', ctr: '2,10%', cpa: 'R$ 248,00' },
  ];
  const sizeLabel = (a) => typeof a.size === 'number' ? fmt.int(a.size) : a.size;
  const typeLabel = (a) => a.type || (a.source === 'lookalike' ? 'Lookalike' : a.source === 'custom' ? 'Custom' : 'Saved');

  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow">Públicos</div>
          <h1 className="page-title">Audiências</h1>
          <div className="page-sub">Públicos salvos, lookalikes e audiências customizadas</div>
        </div>
        <div className="page-actions">
          <div className="seg"><button className="on">Todas</button><button>Salvas</button><button>Lookalikes</button><button>Customizadas</button></div>
          <button className="btn btn-primary" onClick={onNew}><I.plus />Nova audiência</button>
        </div>
      </div>
      <div className="kpi-row">
        <KPI label="Total de audiências" value={rows.length} delta={null} />
        <KPI label="Tamanho médio" value="1,3M" delta={null} />
        <KPI label="Em uso ativo" value={rows.length} delta={null} />
        <KPI label="CPA médio" value="R$ 146,00" delta={null} />
      </div>
      <div className="sp-20" />
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Audiência</th><th>Tipo</th><th>Origem</th><th>Cliente</th><th className="right">Tamanho</th><th>Usada em</th><th className="right">CTR</th><th className="right">CPA</th><th className="right"></th></tr></thead>
          <tbody>{rows.map((a, i) => {
            const client = clients[i % Math.max(clients.length, 1)];
            const label = typeLabel(a);
            return <tr key={a.id || a.name}>
              <td style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</td>
              <td><span className={`badge ${label === 'Lookalike' ? 'accent' : label === 'Custom' ? 'info' : ''}`}>{label}</span></td>
              <td className="muted" style={{ fontSize: 12 }}>{a.source || a.origin}</td>
              <td>{client ? <div className="row" style={{ gap: 8 }}><span className={`avt ${client.color}`}>{client.logo}</span><span style={{ fontSize: 13 }}>{client.name.split(' ')[0]}</span></div> : <span style={{ fontSize: 13 }}>{a.client}</span>}</td>
              <td className="right num">{sizeLabel(a)}</td><td className="num">{a.used || `${Math.max(1, i + 2)} camps.`}</td>
              <td className="right num">{a.ctr || `${(3.4 + i * 0.3).toFixed(2).replace('.', ',')}%`}</td><td className="right num">{a.cpa || fmt.brl(178 - i * 18)}</td>
              <td className="right"><button className="btn btn-sm btn-ghost btn-icon"><I.more /></button></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <div className="sp-20" />
      <div className="card"><div className="card-head"><div className="row" style={{ gap: 10 }}><span className="avt lg avt-4"><I.sparkle /></span><div><div className="card-title">Sugestões do Copilot</div><div className="card-sub">Públicos que podem performar melhor</div></div></div></div><div className="card-pad grid-3">{['Lookalike 2% - leads quentes 90d', "Remarketing - visitou 'Investimento' não convertido", "Interesse: 'Acionistas Bovespa' + Geo SP/RJ"].map((s, i) => <div className="card" key={s} style={{ boxShadow: 'none' }}><div className="card-pad"><div style={{ fontWeight: 600, fontSize: 13 }}>{s}</div><div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{i === 0 ? 'Base de 47 leads quentes (Score AI > 80)' : i === 1 ? 'Pixel custom event' : 'Cruzamento de interesses premium'}</div><div className="row" style={{ justifyContent: 'space-between', marginTop: 14 }}><span className="eyebrow">CPA estimado</span><span className="num" style={{ color: 'rgb(var(--accent))', fontWeight: 700 }}>R$ {i === 0 ? '95-130' : i === 1 ? '60-90' : '140-180'}</span></div><button className="btn btn-sm" style={{ width: '100%', marginTop: 12 }}>Criar audiência</button></div></div>)}</div></div>
    </div>
  );
}

/* ============================================
   7. REPORTS - Axon original screen
   ============================================ */
export function AdminReports({ onSend, onSchedule }) {
  const { reports, clients, loading } = useAxonData();
  const rows = reports.length ? reports : Array.from({ length: 8 }, (_, i) => ({ id: `report_${i}`, title: 'Relatório Diário', client: clients[i % Math.max(clients.length, 1)]?.id, phone: '+55 11 99160-5660', period: 'Últimas 24h', date: new Date(Date.now() - i * 86400000).toISOString(), status: i === 3 ? 'failed' : i === 5 ? 'queued' : 'ok', attempts: i === 3 ? 3 : 1 }));
  const ok = rows.filter(r => r.status === 'ok').length;
  const queued = rows.filter(r => r.status === 'queued').length;
  const failed = rows.filter(r => r.status === 'failed').length;
  const success = rows.length ? ((ok / rows.length) * 100).toFixed(1).replace('.', ',') + '%' : '0,0%';
  return <div className="fadein"><div className="page-head"><div><div className="eyebrow">Automação</div><h1 className="page-title">Relatórios</h1><div className="page-sub">Envios automáticos via WhatsApp • PDFs gerados</div></div><div className="page-actions"><button className="btn" onClick={onSchedule}><I.cal />Configurar agenda</button><button className="btn btn-primary" onClick={onSend}><I.send />Disparar todos</button></div></div><div className="kpi-row"><KPI label="Enviados (30d)" value={ok} delta={4.2} /><KPI label="Na fila" value={queued} delta={null} /><KPI label="Falhas (24h)" value={failed} negative delta={failed > 0 ? 12 : 0} /><KPI label="Taxa de sucesso" value={success} delta={1.4} /></div><div className="sp-20" /><div className="card"><div className="card-head"><div><div className="card-title">Histórico de envios</div><div className="card-sub">Últimos {rows.length} relatórios</div></div><div className="row"><select className="select" style={{ width: 200 }}><option>Todos os clientes</option>{clients.map(c => <option key={c.id}>{c.name}</option>)}</select><div className="seg"><button className="on">Todos</button><button>Falhas</button><button>Fila</button></div></div></div>{loading.reports ? <div className="card-pad"><Skel h={240} /></div> : <table className="tbl"><thead><tr><th>Relatório</th><th>Cliente</th><th>Destinatário</th><th>Período</th><th>Data</th><th>Status</th><th className="right">Ações</th></tr></thead><tbody>{rows.map((r, i) => { const c = clients.find(x => x.id === r.client) || clients[i % Math.max(clients.length, 1)]; return <tr key={r.id}><td><div style={{ fontWeight: 500, fontSize: 13 }}>{r.title || 'Relatório Diário'}</div><div className="muted" style={{ fontSize: 11 }}>via WhatsApp</div></td><td>{c && <div className="row" style={{ gap: 8 }}><span className={`avt ${c.color}`}>{c.logo}</span><span style={{ fontSize: 13 }}>{c.name}</span></div>}</td><td className="num" style={{ fontSize: 12 }}>{r.phone}</td><td className="muted" style={{ fontSize: 12 }}>{r.period}</td><td className="muted" style={{ fontSize: 12 }}>{new Date(r.date).toLocaleDateString('pt-BR')} • {new Date(r.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td><td>{r.status === 'ok' && <span className="badge success"><I.check className="ico" style={{ width: 11, height: 11 }} />Entregue</span>}{r.status === 'queued' && <span className="badge info"><I.clock className="ico" style={{ width: 11, height: 11 }} />Na fila</span>}{r.status === 'failed' && <span className="badge danger"><I.x className="ico" style={{ width: 11, height: 11 }} />Falhou ({r.attempts || 3} tent.)</span>}</td><td className="right"><button className="btn btn-sm btn-ghost"><I.refresh /></button><button className="btn btn-sm btn-ghost"><I.eye /></button></td></tr>; })}</tbody></table>}</div></div>;
}

/* ============================================
   8. SOCIAL MEDIA - Axon original screen
   ============================================ */
export function AdminSocial() {
  const { clients, socialOverview, loading } = useAxonData();
  const overview = socialOverview || { profiles: [], connectedCount: 0, posts30: null, reach: null, engagement: null };
  const byClient = {};
  (overview.profiles || []).forEach(p => { byClient[p.clientId] = p; });
  const list = clients.slice(0, 6);
  const totalClients = clients.length || 0;
  const connectedCount = overview.connectedCount || 0;
  const fmtMaybe = (value, formatter = v => v) => value == null ? '—' : formatter(value);
  return <div className="fadein"><div className="page-head"><div><div className="eyebrow">Orgânico</div><h1 className="page-title">Social Media</h1><div className="page-sub">Status de conexões Instagram/Facebook dos clientes</div></div><div className="page-actions"><button className="btn" onClick={() => window.toast && window.toast('Sincronização Social Media roda via backend. Atualize a página após a rotina concluir.', 'info')}><I.refresh />Sincronizar</button></div></div><div className="kpi-row"><KPI label="Perfis conectados" value={`${connectedCount}/${totalClients}`} delta={null} /><KPI label="Posts publicados (30d)" value={fmtMaybe(overview.posts30, fmt.int)} delta={null} /><KPI label="Alcance orgânico total" value={fmtMaybe(overview.reach, fmt.int)} delta={null} /><KPI label="Engajamento médio" value={fmtMaybe(overview.engagement, v => `${Number(v).toFixed(2).replace('.', ',')}%`)} delta={null} /></div><div className="sp-20" />{loading.clients || loading.socialOverview ? <div className="grid-2"><Skel h={158} /><Skel h={158} /><Skel h={158} /><Skel h={158} /></div> : list.length === 0 ? <Empty icon={<I.insta />} title="Nenhum cliente encontrado" sub="Cadastre clientes para acompanhar as conexões Instagram/Facebook." /> : <div className="grid-2">{list.map((c) => { const social = byClient[c.id] || {}; const isConnected = !!social.connected; const handle = social.username ? `@${social.username.replace(/^@/, '')}` : 'Não conectado'; return <div className="card" key={c.id}><div className="card-head"><div className="row" style={{ gap: 10 }}><span className={`avt lg ${c.color}`}>{c.logo}</span><div><div className="card-title">{c.name}</div><div className="card-sub">{isConnected ? handle : 'Não conectado'}</div></div></div>{isConnected ? <Status s="ok" label="Conectado" /> : <Status s="off" label="Pendente" />}</div>{isConnected ? <div className="card-pad"><div className="grid-4" style={{ gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}><Mini label="Seguidores" value={fmtMaybe(social.followers, fmt.int)} delta={null} /><Mini label="Posts 30d" value={fmtMaybe(social.posts30, fmt.int)} delta={null} /><Mini label="Alcance" value={fmtMaybe(social.reach, fmt.int)} delta={null} /><Mini label="Engaj." value={fmtMaybe(social.engagement, v => `${Number(v).toFixed(2).replace('.', ',')}%`)} delta={null} /></div></div> : <div className="card-pad empty"><I.insta className="ic" style={{ width: 32, height: 32 }} /><div style={{ marginBottom: 12 }}>Cliente ainda não conectou Instagram/Facebook</div><button className="btn btn-sm" onClick={() => window.toast && window.toast('Lembrete pendente: conectar envio via Evolution Go.', 'info')}>Enviar lembrete</button></div>}</div>; })}</div>}</div>;
}

function Mini({ label, value, delta }) {
  return <div><div className="eyebrow" style={{ fontSize: 10 }}>{label}</div><div className="num" style={{ fontSize: 18, fontWeight: 600, marginTop: 2, letterSpacing: '-0.02em' }}>{value}</div>{delta != null && <div className={`delta ${delta >= 0 ? 'up' : 'dn'}`} style={{ fontSize: 11 }}>{delta >= 0 ? '+' : ''}{delta.toFixed(1).replace('.', ',')}%</div>}</div>;
}

/* ============================================
   9. SETTINGS - Axon original screen
   ============================================ */
export function AdminSettings() {
  return <div className="fadein"><div className="page-head"><div><div className="eyebrow">Sistema</div><h1 className="page-title">Configurações</h1><div className="page-sub">Agência, tokens, integrações e perfil</div></div></div><div className="grid-2"><div className="card"><div className="card-head"><div className="card-title">Identidade da agência</div></div><div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}><div className="field"><label>Nome da agência</label><input className="input" defaultValue="BKS Grow" /><div className="hint">Aparece no topo do painel dos clientes</div></div><div className="field"><label>Seu nome</label><input className="input" defaultValue="Erick Sena" /></div><div className="field"><label>Email principal</label><input className="input" defaultValue="contato@backstagegrow.com.br" /></div><div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}><button className="btn btn-primary" onClick={() => window.toast && window.toast('Alterações salvas', 'success')}>Salvar alterações</button></div></div></div><div className="card"><div className="card-head"><div className="card-title">Meta API (backend)</div><span className="badge success"><span className="dot" />Ativo</span></div><div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}><div className="field"><label>Validade do token</label><div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}><span className="muted" style={{ fontSize: 12 }}>Expira em 56 dias</span><span className="num muted" style={{ fontSize: 12 }}>11/07/2026</span></div><div className="bar"><span style={{ width: '62%', background: 'rgb(var(--c-success))' }} /></div></div><div className="field"><label>Gestão do token</label><div className="input" style={{ display: 'flex', alignItems: 'center', color: 'rgb(var(--text-2))' }}>Token armazenado nos Supabase Secrets</div></div><div className="row" style={{ gap: 8 }}><button className="btn" onClick={() => window.toast && window.toast('Verificação do token roda no backend/cron', 'info')}>Ver status backend</button></div><div className="hint" style={{ fontSize: 11, color: 'rgb(var(--text-3))' }}>Atualização manual de token deve ser feita nos <strong style={{ color: 'rgb(var(--text-2))' }}>Supabase Secrets</strong>; o painel não recebe token sensível.</div></div></div><div className="card"><div className="card-head"><div className="card-title">Evolution Go</div><span className="badge success"><span className="dot" />Conectado</span></div><div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><SettingRow label="Provedor" value="Evolution Go" /><SettingRow label="Número remetente" value="+55 11 99765-4321" /><SettingRow label="Mensagens (30d)" value="1.842 enviadas" /><SettingRow label="Taxa de entrega" value="97,2%" /></div></div><div className="card"><div className="card-head"><div className="card-title">Equipe</div><button className="btn btn-sm"><I.plus />Convidar</button></div><div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[{ n: 'Erick Sena', e: 'contato@backstagegrow.com.br', r: 'Admin', c: 'avt-6' }, { n: 'Lucas Rodrigues', e: 'lucas@bksgrow.com.br', r: 'Gestor', c: 'avt-1' }, { n: 'Camila Souza', e: 'camila@bksgrow.com.br', r: 'Analista', c: 'avt-5' }].map((m, i) => <div className="row" style={{ justifyContent: 'space-between' }} key={i}><div className="row" style={{ gap: 10 }}><span className={`avt lg ${m.c}`}>{m.n.split(' ').map(x => x[0]).slice(0, 2).join('')}</span><div><div style={{ fontSize: 13, fontWeight: 500 }}>{m.n}</div><div className="muted" style={{ fontSize: 11 }}>{m.e}</div></div></div><span className="badge">{m.r}</span></div>)}</div></div></div></div>;
}

function SettingRow({ label, value }) {
  return <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted" style={{ fontSize: 13 }}>{label}</span><span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span></div>;
}
