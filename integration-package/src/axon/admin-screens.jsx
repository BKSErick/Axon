/* ============================================
   Axon — Admin Screens (real Supabase + Meta data)
   ============================================ */
import React, { useMemo, useState } from 'react';
import { I } from './icons';
import { KPI, Spark, Status, TT, fmt, R } from './common';
import { useAxonData } from './data-bridge';
import { MOCK_PERFORMANCE_30, MOCK_FUNNEL, MOCK_AGE_DIST, MOCK_REGIONS } from '../lib/mocks/axon';

// Legacy bridges (heavy components — kept in original location so their
// internal ../lib and ../data imports stay valid). Namespace import tolerates
// both `export default` and named exports.
import * as SocialPanelMod from '../components/admin/SocialMediaPanel';
import * as AdminViewsMod from '../components/AdminViews';
const SocialMediaPanel = SocialPanelMod.SocialMediaPanel;
const LegacyAdminSettings = AdminViewsMod.AdminSettings;

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
function PageHeader({ title, sub, actions }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{sub}</div>}
      </div>
      {actions && <div className="row" style={{ gap: 8 }}>{actions}</div>}
    </div>
  );
}

/* ============================================
   1. ADMIN OVERVIEW
   ============================================ */
export function AdminOverview({ go, auth, onClientChange }) {
  const { adminOverview, clients, loading, errors } = useAxonData();
  const k = adminOverview;
  const dailyData = (k?.daily?.length ? k.daily.map(d => ({ label: d.date, v: d.spend })) : MOCK_PERFORMANCE_30.map(d => ({ label: d.label, v: d.spend })));

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
            <KPI label="Investimento" icon={<I.dollar />} value={k?.totalSpend || 0} fmtVal={fmt.brl} delta={8.2} spark={dailyData.slice(-10)} />
            <KPI label="Leads gerados" icon={<I.users />} value={k?.totalLeads || 0} fmtVal={fmt.int} delta={12.4} spark={dailyData.slice(-10)} />
            <KPI label="CPA médio" icon={<I.target />} value={k?.cpa || 0} fmtVal={fmt.brl} delta={-4.3} negative spark={dailyData.slice(-10)} />
            <KPI label="ROI estimado" icon={<I.trend />} value={Number(k?.roi) || 0} fmtVal={n => (n || 0) + '%'} delta={2.1} spark={dailyData.slice(-10)} />
          </>
        )}
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-head"><h2>Investimento × Leads (30 dias)</h2></div>
          <div style={{ padding: 20, height: 260 }}>
            <R.ResponsiveContainer width="100%" height="100%">
              <R.AreaChart data={k?.daily?.length ? k.daily.map(d => ({ label: d.date, spend: d.spend, leads: d.leads })) : MOCK_PERFORMANCE_30}>
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
            </R.ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h2>Funil consolidado</h2></div>
          <div style={{ padding: 16 }}>
            {MOCK_FUNNEL.map((f, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{f.stage}</span>
                  <span className="num" style={{ fontSize: 12, color: 'rgb(var(--text-2))' }}>{fmt.int(f.v)}</span>
                </div>
                <div style={{ height: 6, background: 'rgb(var(--bg-card))', borderRadius: 999 }}>
                  <div style={{ width: f.pct + '%', height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, rgb(var(--accent)), #8b5cf6)' }} />
                </div>
              </div>
            ))}
          </div>
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
    <>
      <PageHeader
        title="Business Managers"
        sub="BMs conectadas ao Axon"
        actions={<button className="btn btn-primary" onClick={onNew}><I.plus />Conectar BM</button>}
      />
      {loading.bms ? (
        <div className="grid-3"><Skel h={140} /><Skel h={140} /><Skel h={140} /></div>
      ) : bms.length === 0 ? (
        <Empty icon={<I.briefcase />} title="Nenhum BM conectado" sub="Conecte sua primeira Business Manager do Meta pra começar a sincronizar contas e campanhas." cta="Conectar BM" onCta={onNew} />
      ) : (
        <div className="grid-3">
          {bms.map(b => (
            <div key={b.id} className="card">
              <div style={{ padding: 18 }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3>{b.name}</h3>
                  <Status s={b.status === 'ok' ? 'ok' : 'warn'} />
                </div>
                <div className="muted txt-mono" style={{ fontSize: 11 }}>{b.id}</div>
                <div className="row" style={{ gap: 16, marginTop: 16, fontSize: 12 }}>
                  <div><div className="muted">Contas</div><div className="num" style={{ fontWeight: 600, fontSize: 16 }}>{b.accounts}</div></div>
                  <div><div className="muted">Saúde</div><div className="num" style={{ fontWeight: 600, fontSize: 16 }}>{b.health}%</div></div>
                </div>
                <div className="row" style={{ gap: 6, marginTop: 14 }}>
                  <button className="btn btn-sm"><I.refresh />Sincronizar</button>
                  <button className="btn btn-sm btn-ghost"><I.cog /></button>
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
    <>
      <PageHeader
        title="Clientes"
        sub={`${clients.length} clientes ativos`}
        actions={<button className="btn btn-primary" onClick={onNew}><I.plus />Novo cliente</button>}
      />
      {loading.clients ? (
        <div className="grid-3"><Skel h={180} /><Skel h={180} /><Skel h={180} /></div>
      ) : clients.length === 0 ? (
        <Empty icon={<I.users />} title="Nenhum cliente" sub="Cadastre seu primeiro cliente." cta="Novo cliente" onCta={onNew} />
      ) : (
        <div className="grid-3">
          {clients.map(c => (
            <div key={c.id} className="card">
              <div style={{ padding: 18 }}>
                <div className="row" style={{ gap: 12, marginBottom: 12 }}>
                  <span className={`avatar ${c.color}`} style={{ width: 44, height: 44, fontSize: 14 }}>{c.logo}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{c.email}</div>
                  </div>
                  <span className="tag">{c.plan}</span>
                </div>
                <div className="row" style={{ gap: 12, fontSize: 12 }}>
                  <div><div className="muted">Contas</div><div className="num" style={{ fontWeight: 600 }}>{c.accounts}</div></div>
                  <div><div className="muted">Status</div><Status s={c.status} label={c.status === 'ok' ? 'Ativo' : '—'} /></div>
                </div>
                <div className="row" style={{ gap: 6, marginTop: 14 }}>
                  <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => onChangeClient(c.id)}><I.eye />Acessar painel</button>
                  <button className="btn btn-sm btn-ghost btn-icon"><I.more /></button>
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
   6. AUDIENCES (mock — sem tabela ainda)
   ============================================ */
export function AdminAudiences({ onNew, onConfirm }) {
  const { audiences } = useAxonData();
  return (
    <>
      <PageHeader
        title="Audiências"
        sub="Criadas por IA com base em leads e engajamento. (preview — tabela `audiences` ainda não existe)"
        actions={<button className="btn btn-primary" onClick={onNew}><I.plus />Nova audiência</button>}
      />
      <div className="card">
        <div className="tbl">
          <div className="tbl-row tbl-head"><div>Nome</div><div>Origem</div><div className="ta-r">Tamanho</div><div className="ta-r">Match %</div><div>Status</div><div></div></div>
          {audiences.map(a => (
            <div key={a.id} className="tbl-row">
              <div style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</div>
              <div style={{ fontSize: 13 }}>{a.source}</div>
              <div className="ta-r num">{fmt.int(a.size)}</div>
              <div className="ta-r num">{a.match}%</div>
              <div><Status s={a.status === 'active' ? 'ok' : 'warn'} label={a.status} /></div>
              <div className="ta-r"><button className="btn btn-sm btn-ghost btn-icon" onClick={() => onConfirm({ title: 'Excluir audiência?', body: 'Esta ação não pode ser desfeita.', danger: true, onConfirm: () => {} })}><I.trash /></button></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ============================================
   7. REPORTS
   ============================================ */
export function AdminReports({ onSend, onSchedule }) {
  const { reports, clients, loading } = useAxonData();
  return (
    <>
      <PageHeader
        title="Relatórios"
        sub={`${reports.length} relatórios enviados`}
        actions={
          <>
            <button className="btn" onClick={onSchedule}><I.cal />Agendar</button>
            <button className="btn btn-primary" onClick={onSend}><I.send />Enviar agora</button>
          </>
        }
      />
      <div className="card">
        <div className="tbl">
          <div className="tbl-row tbl-head"><div>Cliente</div><div>Período</div><div>Enviado em</div><div>Telefone</div><div>Status</div><div></div></div>
          {loading.reports && Array.from({ length: 4 }, (_, i) => <div key={i} className="tbl-row"><Skel h={20} /><Skel h={20} /><Skel h={20} /><Skel h={20} /><Skel h={20} /><Skel h={20} /></div>)}
          {!loading.reports && reports.length === 0 && <div style={{ padding: 30 }}><Empty icon={<I.file />} title="Nenhum relatório enviado" sub="Envie seu primeiro relatório agora." cta="Enviar agora" onCta={onSend} /></div>}
          {!loading.reports && reports.map(r => {
            const client = clients.find(c => c.id === r.client);
            return (
              <div key={r.id} className="tbl-row">
                <div>
                  {client ? <div className="row" style={{ gap: 8 }}><span className={`avatar ${client.color}`} style={{ width: 22, height: 22, fontSize: 10 }}>{client.logo}</span><span style={{ fontSize: 13 }}>{client.name}</span></div> : <span style={{ fontSize: 13 }}>{r.clientName || r.client}</span>}
                </div>
                <div style={{ fontSize: 13 }}>{r.period}</div>
                <div className="num" style={{ fontSize: 12 }}>{new Date(r.date).toLocaleString('pt-BR')}</div>
                <div className="txt-mono" style={{ fontSize: 12 }}>{r.phone}</div>
                <div><Status s={r.status === 'ok' ? 'ok' : r.status === 'failed' ? 'off' : 'warn'} label={r.status} /></div>
                <div className="ta-r"><button className="btn btn-sm btn-ghost"><I.refresh /></button></div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ============================================
   8. SOCIAL MEDIA — bridge to legacy
   ============================================ */
export function AdminSocial() {
  return (
    <div className="legacy-scope" style={{ marginTop: -24, marginLeft: -24, marginRight: -24 }}>
      <SocialMediaPanel />
    </div>
  );
}

/* ============================================
   9. SETTINGS — bridge to legacy
   ============================================ */
export function AdminSettings({ auth, onUpdate }) {
  return (
    <div className="legacy-scope" style={{ marginTop: -24, marginLeft: -24, marginRight: -24 }}>
      <LegacyAdminSettings auth={auth} onUpdate={onUpdate} />
    </div>
  );
}
