/* global React, MOCK, fmt, I, KPI, Spark, Status, TT, Recharts */
const { ResponsiveContainer: RC, AreaChart: AC, Area, LineChart: LC, Line, BarChart: BC, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart: PC, Pie, Cell, ReferenceLine } = Recharts;

/* ============================================
   ADMIN — Visão Geral
   ============================================ */
function AdminOverview({ go }) {
  const data = MOCK.performance30;
  const unbound = MOCK.AD_ACCOUNTS.filter(a => !a.linked);
  const totalSpend = MOCK.AD_ACCOUNTS.reduce((s,a)=>s+a.spend, 0);
  const totalLeads = MOCK.CAMPAIGNS.reduce((s,c)=>s+c.leads, 0);
  const cpa = totalSpend / Math.max(totalLeads, 1);
  const activeClients = MOCK.CLIENTS.length;
  const [range, setRange] = React.useState("30d");
  const toast = (m, k="info") => window.toast && window.toast(m, k);

  const sparkSpend = data.map(d => ({ v: d.spend }));
  const sparkLeads = data.map(d => ({ v: d.leads }));
  const sparkCPA = data.map(d => ({ v: d.cpa }));
  const sparkCTR = data.map(d => ({ v: d.ctr }));

  // top under-performers
  const watchlist = [...MOCK.CAMPAIGNS]
    .filter(c => c.status !== "paused")
    .map(c => ({...c, score: c.leads === 0 ? 100 : c.cpa > 250 ? 70 : 30 }))
    .sort((a,b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow">Painel Administrativo</div>
          <h1 className="page-title">Visão Geral</h1>
          <div className="page-sub">Consolidado de todas as contas e clientes • Últimos 30 dias</div>
        </div>
        <div className="page-actions">
          <div className="seg">
            <button className={range==="7d"?"on":""} onClick={()=>setRange("7d")}>7d</button>
            <button className={range==="30d"?"on":""} onClick={()=>setRange("30d")}>30d</button>
            <button className={range==="90d"?"on":""} onClick={()=>setRange("90d")}>90d</button>
            <button className={range==="ytd"?"on":""} onClick={()=>setRange("ytd")}>YTD</button>
          </div>
          <button className="btn" onClick={()=>{ toast("Sincronizando todas as integrações…", "info"); setTimeout(()=>toast("Sincronização concluída — Meta, Google e Instagram atualizados", "success"), 1600); }}><I.refresh/>Sincronizar</button>
          <button className="btn" onClick={()=>toast("Exportando consolidado.xlsx…", "success")}><I.download/>Exportar</button>
        </div>
      </div>

      {unbound.length > 0 && (
        <>
          <div className="alert warning">
            <I.warn className="ic"/>
            <div style={{flex:1}}>
              <div style={{fontWeight:600, color:"rgb(var(--text))"}}>{unbound.length} {unbound.length===1?"conta":"contas"} sem cliente vinculado</div>
              <div className="muted" style={{fontSize:12, marginTop:2}}>Estas contas não aparecerão nos dashboards dos clientes até serem vinculadas.</div>
            </div>
            <button className="btn" onClick={()=>go("admin-accounts")}>Resolver agora →</button>
          </div>
          <div className="sp-20"/>
        </>
      )}

      {/* KPI Row */}
      <div className="kpi-row">
        <KPI label={<><I.dollar/>Investimento total</>} value={fmt.brl(totalSpend)} delta={12.4} spark={sparkSpend}/>
        <KPI label={<><I.users/>Leads gerados</>} value={fmt.int(totalLeads)} delta={8.1} spark={sparkLeads}/>
        <KPI label={<><I.target/>CPA médio</>} value={fmt.brl(cpa)} delta={-4.7} negative spark={sparkCPA}/>
        <KPI label={<><I.bolt/>CTR médio</>} value="3,11%" delta={2.2} spark={sparkCTR}/>
      </div>

      <div className="sp-20"/>

      {/* Performance chart */}
      <div className="grid-3" style={{gridTemplateColumns:"2fr 1fr"}}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Performance diária</div>
              <div className="card-sub">Investimento vs Leads gerados</div>
            </div>
            <div className="row">
              <span className="badge"><span className="dot" style={{background:"rgb(var(--accent))"}}/>Investimento</span>
              <span className="badge"><span className="dot" style={{background:"rgb(var(--c-info))"}}/>Leads</span>
            </div>
          </div>
          <div style={{padding:"12px 8px 8px", height: 280}}>
            <RC width="100%" height="100%">
              <AC data={data} margin={{top:10, right:24, left:12, bottom:0}}>
                <defs>
                  <linearGradient id="ga" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.28}/>
                    <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgb(var(--border-soft))" vertical={false}/>
                <XAxis dataKey="label" tickLine={false} axisLine={false} interval={Math.floor(data.length/8)} />
                <YAxis yAxisId="l" tickLine={false} axisLine={false} tickFormatter={v=>fmt.brlShort(v)} width={56}/>
                <YAxis yAxisId="r" orientation="right" tickLine={false} axisLine={false} width={36}/>
                <Tooltip content={<TT prefix="" fmt={v=>fmt.brl(v)}/>}/>
                <Area yAxisId="l" type="monotone" dataKey="spend" name="Investimento" stroke="rgb(var(--accent))" strokeWidth={1.8} fill="url(#ga)" isAnimationActive={false}/>
                <Line yAxisId="r" type="monotone" dataKey="leads" name="Leads" stroke="rgb(var(--c-info))" strokeWidth={1.6} dot={false} isAnimationActive={false}/>
              </AC>
            </RC>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Distribuição por cliente</div>
              <div className="card-sub">Share de investimento — 30d</div>
            </div>
          </div>
          <div className="card-pad">
            {MOCK.CLIENTS.map((c, i) => {
              const totalC = MOCK.CLIENTS.reduce((s,x)=>s+x.spend30, 0);
              const pct = (c.spend30/totalC)*100;
              return (
                <div key={c.id} style={{marginBottom: 14}}>
                  <div className="row" style={{justifyContent:"space-between", marginBottom:6}}>
                    <div className="row" style={{gap:8}}>
                      <span className={`avt ${c.color}`}>{c.logo}</span>
                      <span style={{fontSize:13, fontWeight:500}}>{c.name}</span>
                    </div>
                    <span className="num muted" style={{fontSize:12}}>{fmt.brlShort(c.spend30)}</span>
                  </div>
                  <div className="bar"><span style={{width: pct + "%"}}/></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="sp-20"/>

      {/* Watchlist + Reports queue */}
      <div className="grid-3" style={{gridTemplateColumns:"2fr 1fr"}}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Watchlist — Atenção necessária</div>
              <div className="card-sub">Campanhas com CPA acima do ideal ou sem leads</div>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={()=>go("admin-campaigns")}>Ver todas →</button>
          </div>
          <table className="tbl">
            <thead><tr>
              <th>Campanha</th><th>Cliente</th><th className="right">Investido</th><th className="right">Leads</th><th className="right">CPA</th><th>Risco</th>
            </tr></thead>
            <tbody>
              {watchlist.map(c => {
                const client = MOCK.CLIENTS.find(x=>x.id===c.client);
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{fontWeight:500, maxWidth:280, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{c.name}</div>
                      <div className="mono-id">{c.id}</div>
                    </td>
                    <td>{client && <div className="row"><span className={`avt ${client.color}`}>{client.logo}</span><span style={{fontSize:12}}>{client.name.split(' ')[0]}</span></div>}</td>
                    <td className="right num">{fmt.brl(c.spend)}</td>
                    <td className="right num">{c.leads}</td>
                    <td className="right num">{c.cpa ? fmt.brl(c.cpa) : "—"}</td>
                    <td><span className={`badge ${c.score>=70?"danger":"warning"}`}><span className="dot"/>{c.score>=70?"Alto":"Médio"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Saúde da agência</div>
              <div className="card-sub">Sistema, integrações, envios</div>
            </div>
          </div>
          <div className="card-pad" style={{display:"flex", flexDirection:"column", gap: 14}}>
            <HealthRow icon={<I.link/>} label="Meta API" status="ok" detail="Conectado • Token expira em 56 dias"/>
            <HealthRow icon={<I.briefcase/>} label="Business Managers" status="ok" detail={`${MOCK.BMS.length} ativos • saúde média 89%`}/>
            <HealthRow icon={<I.layers/>} label="Contas de anúncio" status="warn" detail={`${unbound.length} sem cliente vinculado`}/>
            <HealthRow icon={<I.send/>} label="Envios WhatsApp" status="warn" detail="42 falhas nas últimas 24h"/>
            <HealthRow icon={<I.insta/>} label="Instagram OAuth" status="ok" detail="3/5 clientes conectados"/>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthRow({ icon, label, status, detail }) {
  return (
    <div className="row" style={{justifyContent:"space-between"}}>
      <div className="row" style={{gap:10}}>
        <span style={{color:"rgb(var(--text-3))"}}>{icon}</span>
        <div>
          <div style={{fontSize:13, fontWeight:500}}>{label}</div>
          <div className="muted" style={{fontSize:11}}>{detail}</div>
        </div>
      </div>
      <Status s={status === "ok" ? "ok" : status === "warn" ? "warn" : "err"}/>
    </div>
  );
}

/* ============================================
   ADMIN — Business Managers
   ============================================ */
function AdminBMs({ onNew }) {
  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow">Conexões</div>
          <h1 className="page-title">Business Managers</h1>
          <div className="page-sub">Gerencie conexões e tokens da Meta Business API</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={()=>{window.toast && window.toast("Sincronizando Meta API…", "info"); setTimeout(()=>window.toast && window.toast("Meta API sincronizada — "+MOCK.BMS.length+" BMs atualizados", "success"), 1400);}}><I.refresh/>Sincronizar Meta</button>
          <button className="btn btn-primary" onClick={onNew}><I.plus/>Novo BM</button>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead><tr>
            <th>Business Manager</th><th>Owner</th><th>ID</th><th>Conectado</th><th className="right">Contas</th><th>Saúde do token</th><th className="right">Ações</th>
          </tr></thead>
          <tbody>
            {MOCK.BMS.map(bm => (
              <tr key={bm.id}>
                <td>
                  <div className="row" style={{gap:10}}>
                    <span className="avt lg avt-1"><I.briefcase/></span>
                    <div>
                      <div style={{fontWeight:600, fontSize:13}}>{bm.name}</div>
                      <div className="muted" style={{fontSize:11}}>{bm.accounts} {bm.accounts===1?"conta":"contas"} sob gestão</div>
                    </div>
                  </div>
                </td>
                <td><span className="muted" style={{fontSize:12}}>{bm.owner}</span></td>
                <td className="mono-id">{bm.id}</td>
                <td className="muted" style={{fontSize:12}}>{new Date(bm.connected).toLocaleDateString('pt-BR')}</td>
                <td className="right num">{bm.accounts}</td>
                <td>
                  <div style={{display:"flex", flexDirection:"column", gap:4, minWidth: 160}}>
                    <div className="row" style={{justifyContent:"space-between"}}>
                      <span className={`badge ${bm.status==="ok"?"success":"warning"}`}><span className="dot"/>{bm.health}%</span>
                      <span className="muted" style={{fontSize:11}}>exp. {new Date(bm.tokenExp).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="bar"><span style={{width: bm.health + "%", background: bm.health > 80 ? "rgb(var(--c-success))" : "rgb(var(--c-warning))"}}/></div>
                  </div>
                </td>
                <td className="right">
                  <button className="btn btn-sm btn-ghost"><I.refresh/></button>
                  <button className="btn btn-sm btn-ghost"><I.more/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================
   ADMIN — Contas de Anúncio
   ============================================ */
function AdminAccounts({ onLink }) {
  const [filter, setFilter] = React.useState("all");
  const filtered = MOCK.AD_ACCOUNTS.filter(a => filter === "all" || (filter === "unbound" && !a.linked) || (filter === "active" && a.status === "active") || (filter === "paused" && a.status === "paused"));

  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow">Conexões</div>
          <h1 className="page-title">Contas de Anúncio</h1>
          <div className="page-sub">{MOCK.AD_ACCOUNTS.length} contas — gerencie vínculos com clientes</div>
        </div>
        <div className="page-actions">
          <div className="seg">
            <button className={filter==="all"?"on":""} onClick={()=>setFilter("all")}>Todas ({MOCK.AD_ACCOUNTS.length})</button>
            <button className={filter==="active"?"on":""} onClick={()=>setFilter("active")}>Ativas</button>
            <button className={filter==="paused"?"on":""} onClick={()=>setFilter("paused")}>Pausadas</button>
            <button className={filter==="unbound"?"on":""} onClick={()=>setFilter("unbound")}>Sem vínculo (2)</button>
          </div>
          <button className="btn" onClick={()=>{window.toast && window.toast("Sincronizando contas…", "info"); setTimeout(()=>window.toast && window.toast("Contas sincronizadas", "success"), 1200);}}><I.refresh/>Sincronizar</button>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead><tr>
            <th>Conta</th><th>Business Manager</th><th>Cliente vinculado</th><th className="right">Invest. 30d</th><th>Status</th><th className="right">Ações</th>
          </tr></thead>
          <tbody>
            {filtered.map(a => {
              const c = MOCK.CLIENTS.find(x=>x.id===a.client);
              return (
                <tr key={a.id}>
                  <td>
                    <div style={{fontWeight:500, fontSize:13}}>{a.name}</div>
                    <div className="mono-id">{a.id}</div>
                  </td>
                  <td className="muted" style={{fontSize:12}}>{a.bm}</td>
                  <td>
                    {c ? (
                      <div className="row" style={{gap:8}}>
                        <span className={`avt ${c.color}`}>{c.logo}</span>
                        <div>
                          <div style={{fontSize:13, fontWeight:500}}>{c.name}</div>
                          <div className="muted" style={{fontSize:11}}>{c.email}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="badge warning"><span className="dot"/>Sem vínculo</span>
                    )}
                  </td>
                  <td className="right num">{a.spend > 0 ? fmt.brl(a.spend) : <span className="muted">—</span>}</td>
                  <td>
                    {a.status === "active"
                      ? <Status s="ok" label="Ativa"/>
                      : <Status s="off" label="Pausada"/>}
                  </td>
                  <td className="right">
                    <button className="btn btn-sm" onClick={()=>onLink && onLink(a)}>{c ? "Re-vincular" : <><I.bolt/>Vincular</>}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================
   ADMIN — Todas as Campanhas
   ============================================ */
function AdminCampaigns({ onOpen, onFilter }) {
  const total = MOCK.CAMPAIGNS.reduce((s,c)=>s+c.spend, 0);
  const totalLeads = MOCK.CAMPAIGNS.reduce((s,c)=>s+c.leads, 0);
  const cpa = total/Math.max(totalLeads,1);

  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow">Performance</div>
          <h1 className="page-title">Todas as Campanhas</h1>
          <div className="page-sub">Visão macro de {MOCK.CAMPAIGNS.length} campanhas em {MOCK.AD_ACCOUNTS.filter(a=>a.linked).length} contas</div>
        </div>
        <div className="page-actions">
          <select className="select" style={{width:180}}>
            <option>Todas as contas</option>
            {MOCK.AD_ACCOUNTS.map(a=><option key={a.id}>{a.name}</option>)}
          </select>
          <div className="seg">
            <button>7d</button><button className="on">30d</button><button>90d</button>
          </div>
          <button className="btn" onClick={()=>window.toast && window.toast("Exportando campanhas.csv", "success")}><I.download/>CSV</button>
        </div>
      </div>

      <div className="kpi-row" style={{gridTemplateColumns:"repeat(3, 1fr)"}}>
        <KPI label="Total investido (30d)" value={fmt.brl(total)} delta={11.2} spark={MOCK.performance30.map(d=>({v:d.spend}))}/>
        <KPI label="Total de leads (30d)" value={fmt.int(totalLeads)} delta={6.4} spark={MOCK.performance30.map(d=>({v:d.leads}))}/>
        <KPI label="CPA médio (30d)" value={fmt.brl(cpa)} delta={-3.1} negative spark={MOCK.performance30.map(d=>({v:d.cpa}))}/>
      </div>

      <div className="sp-20"/>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Detalhamento por campanha</div>
            <div className="card-sub">Ordenado por investimento</div>
          </div>
          <div className="row">
            <button className="btn btn-sm btn-ghost" onClick={onFilter}><I.filter/>Filtros</button>
            <button className="btn btn-sm btn-ghost"><I.search/></button>
          </div>
        </div>
        <table className="tbl">
          <thead><tr>
            <th>Campanha</th><th>Conta</th><th className="right">Invest.</th><th className="right">Leads</th><th className="right">CPA</th><th className="right">CTR</th><th className="right">Cliques</th><th>Tendência</th><th>Status</th>
          </tr></thead>
          <tbody>
            {[...MOCK.CAMPAIGNS].sort((a,b)=>b.spend-a.spend).map(c => {
              const trend = Array.from({length: 14}, () => ({ v: Math.random() * 100 }));
              return (
                <tr key={c.id} style={{cursor:"pointer"}} onClick={()=>onOpen && onOpen(c.id)}>
                  <td>
                    <div style={{fontWeight:500, fontSize:13, maxWidth:340, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{c.name}</div>
                    <div className="mono-id">{c.id}</div>
                  </td>
                  <td className="muted" style={{fontSize:12}}>{c.account}</td>
                  <td className="right num">{fmt.brl(c.spend)}</td>
                  <td className="right num">{c.leads}</td>
                  <td className="right num">{c.cpa ? fmt.brl(c.cpa) : "—"}</td>
                  <td className="right num">{c.ctr ? c.ctr.toFixed(2).replace('.', ',') + "%" : "—"}</td>
                  <td className="right num">{fmt.int(c.clicks)}</td>
                  <td><div style={{width:80, height:28}}><Spark data={trend} negative={c.status==="warn"}/></div></td>
                  <td>
                    {c.status === "active" ? <Status s="ok" label="Ativa"/> :
                     c.status === "warn" ? <Status s="warn" label="Atenção"/> :
                     <Status s="off" label="Pausada"/>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================
   ADMIN — Clientes
   ============================================ */
function AdminClients({ onNew }) {
  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow">Gestão</div>
          <h1 className="page-title">Clientes</h1>
          <div className="page-sub">{MOCK.CLIENTS.length} clientes ativos • acesso, permissões e sincronização</div>
        </div>
        <div className="page-actions">
          <div className="input-with-icon">
            <I.search/>
            <input className="input" placeholder="Buscar cliente..." style={{width:240}}/>
          </div>
          <button className="btn btn-primary" onClick={onNew}><I.plus/>Cadastrar cliente</button>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead><tr>
            <th>Cliente</th><th>Plano</th><th className="right">Contas</th><th className="right">Invest. 30d</th><th className="right">Leads</th><th className="right">CPA</th><th className="right">ROI</th><th>Status</th><th className="right">Ações</th>
          </tr></thead>
          <tbody>
            {MOCK.CLIENTS.map(c => (
              <tr key={c.id}>
                <td>
                  <div className="row" style={{gap:10}}>
                    <span className={`avt lg ${c.color}`}>{c.logo}</span>
                    <div>
                      <div style={{fontWeight:600, fontSize:13}}>{c.name}</div>
                      <div className="muted" style={{fontSize:11}}>{c.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className={`badge ${c.plan==="Pro"?"accent":""}`}>{c.plan}</span></td>
                <td className="right num">{c.accounts}</td>
                <td className="right num">{fmt.brl(c.spend30)}</td>
                <td className="right num">{c.leads30}</td>
                <td className="right num">{fmt.brl(c.cpa)}</td>
                <td className="right num"><span style={{color: c.roi >= 1.5 ? "rgb(var(--c-success))" : c.roi >= 1 ? "rgb(var(--text))" : "rgb(var(--c-warning))"}}>{c.roi.toFixed(2).replace('.', ',')}x</span></td>
                <td><Status s={c.status==="ok"?"ok":"warn"} label={c.status==="ok"?"Saudável":"Atenção"}/></td>
                <td className="right">
                  <button className="btn btn-sm btn-ghost" title="Ver como cliente"><I.eye/></button>
                  <button className="btn btn-sm btn-ghost"><I.send/></button>
                  <button className="btn btn-sm btn-ghost"><I.more/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================
   ADMIN — Relatórios (envios automáticos)
   ============================================ */
function AdminReports({ onSend, onSchedule, onToast }) {
  const ok = MOCK.REPORTS.filter(r=>r.status==="ok").length;
  const queued = MOCK.REPORTS.filter(r=>r.status==="queued").length;
  const failed = MOCK.REPORTS.filter(r=>r.status==="failed").length;
  const toast = (m, k) => onToast ? onToast(m, k) : (window.toast && window.toast(m, k||"success"));

  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow">Automação</div>
          <h1 className="page-title">Relatórios</h1>
          <div className="page-sub">Envios automáticos via WhatsApp • PDFs gerados</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={onSchedule}><I.cal/>Configurar agenda</button>
          <button className="btn btn-primary" onClick={onSend}><I.send/>Disparar todos</button>
        </div>
      </div>

      <div className="kpi-row">
        <KPI label="Enviados (30d)" value={ok} delta={4.2}/>
        <KPI label="Na fila" value={queued}/>
        <KPI label="Falhas (24h)" value={failed} negative delta={failed>0?12:0}/>
        <KPI label="Taxa de sucesso" value={((ok/MOCK.REPORTS.length)*100).toFixed(1).replace('.', ',') + "%"} delta={1.4}/>
      </div>

      <div className="sp-20"/>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Histórico de envios</div>
            <div className="card-sub">Últimos {MOCK.REPORTS.length} relatórios</div>
          </div>
          <div className="row">
            <select className="select" style={{width:200}}>
              <option>Todos os clientes</option>
              {MOCK.CLIENTS.map(c=><option key={c.id}>{c.name}</option>)}
            </select>
            <div className="seg">
              <button className="on">Todos</button><button>Falhas</button><button>Fila</button>
            </div>
          </div>
        </div>
        <table className="tbl">
          <thead><tr>
            <th>Relatório</th><th>Cliente</th><th>Destinatário</th><th>Período</th><th>Data</th><th>Status</th><th className="right">Ações</th>
          </tr></thead>
          <tbody>
            {MOCK.REPORTS.map(r => {
              const c = MOCK.CLIENTS.find(x=>x.id===r.client);
              return (
                <tr key={r.id}>
                  <td>
                    <div style={{fontWeight:500, fontSize:13}}>{r.title}</div>
                    <div className="muted" style={{fontSize:11}}>via {c?.phone ? "WhatsApp" : "Email"}</div>
                  </td>
                  <td>{c && <div className="row" style={{gap:8}}><span className={`avt ${c.color}`}>{c.logo}</span><span style={{fontSize:13}}>{c.name}</span></div>}</td>
                  <td className="num" style={{fontSize:12}}>{r.phone}</td>
                  <td className="muted" style={{fontSize:12}}>{r.period}</td>
                  <td className="muted" style={{fontSize:12}}>{new Date(r.date).toLocaleDateString('pt-BR')} • {new Date(r.date).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                  <td>
                    {r.status === "ok" && <span className="badge success"><I.check className="ico" style={{width:11,height:11}}/>Entregue</span>}
                    {r.status === "queued" && <span className="badge info"><I.clock className="ico" style={{width:11,height:11}}/>Na fila</span>}
                    {r.status === "failed" && <span className="badge danger"><I.x className="ico" style={{width:11,height:11}}/>Falhou ({r.attempts} tent.)</span>}
                  </td>
                  <td className="right">
                    <button className="btn btn-sm btn-ghost" onClick={()=>toast(`Reenviando "${r.title}"…`, "info")}><I.refresh/></button>
                    <button className="btn btn-sm btn-ghost" onClick={()=>toast(`Visualizando relatório "${r.title}"`, "info")}><I.eye/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================
   ADMIN — Social Media overview
   ============================================ */
function AdminSocial() {
  const connected = 3; const totalClients = MOCK.CLIENTS.length;
  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow">Orgânico</div>
          <h1 className="page-title">Social Media</h1>
          <div className="page-sub">Status de conexões Instagram/Facebook dos clientes</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={()=>{window.toast && window.toast("Sincronizando Instagram Graph API…", "info"); setTimeout(()=>window.toast && window.toast("3 contas atualizadas", "success"), 1200);}}><I.refresh/>Sincronizar</button>
        </div>
      </div>

      <div className="kpi-row">
        <KPI label="Perfis conectados" value={`${connected}/${totalClients}`} delta={null}/>
        <KPI label="Posts publicados (30d)" value={68} delta={12.4}/>
        <KPI label="Alcance orgânico total" value="892K" delta={8.7}/>
        <KPI label="Engajamento médio" value="4,82%" delta={0.3}/>
      </div>

      <div className="sp-20"/>

      <div className="grid-2">
        {MOCK.CLIENTS.slice(0,4).map((c, i) => {
          const connected = i < 3;
          return (
            <div className="card" key={c.id}>
              <div className="card-head">
                <div className="row" style={{gap:10}}>
                  <span className={`avt lg ${c.color}`}>{c.logo}</span>
                  <div>
                    <div className="card-title">{c.name}</div>
                    <div className="card-sub">{connected ? `@${c.name.toLowerCase().replace(/\s+/g,'').slice(0,15)}` : "Não conectado"}</div>
                  </div>
                </div>
                {connected ? <Status s="ok" label="Conectado"/> : <Status s="off" label="Pendente"/>}
              </div>
              {connected ? (
                <div className="card-pad">
                  <div className="grid-4" style={{gridTemplateColumns:"repeat(4,1fr)", gap:14}}>
                    <Mini label="Seguidores" value={fmt.int(18420 - i*2300)} delta={5.4 - i*1.2}/>
                    <Mini label="Posts 30d" value={24 - i*4} delta={null}/>
                    <Mini label="Alcance" value="245K" delta={3.2}/>
                    <Mini label="Engaj." value={(4.8 - i*0.4).toFixed(2).replace('.', ',') + "%"} delta={0.4}/>
                  </div>
                </div>
              ) : (
                <div className="card-pad empty">
                  <I.insta className="ic" style={{width:32, height:32}}/>
                  <div style={{marginBottom:12}}>Cliente ainda não conectou Instagram/Facebook</div>
                  <button className="btn btn-sm">Enviar lembrete</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Mini({ label, value, delta }) {
  return (
    <div>
      <div className="eyebrow" style={{fontSize:10}}>{label}</div>
      <div className="num" style={{fontSize:18, fontWeight:600, marginTop:2, letterSpacing:"-0.02em"}}>{value}</div>
      {delta != null && <div className={`delta ${delta>=0?"up":"dn"}`} style={{fontSize:11}}>{delta>=0?"+":""}{delta.toFixed(1).replace('.', ',')}%</div>}
    </div>
  );
}

/* ============================================
   ADMIN — Settings
   ============================================ */
function AdminSettings() {
  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow">Sistema</div>
          <h1 className="page-title">Configurações</h1>
          <div className="page-sub">Agência, tokens, integrações e perfil</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><div className="card-title">Identidade da agência</div></div>
          <div className="card-pad" style={{display:"flex", flexDirection:"column", gap:14}}>
            <div className="field"><label>Nome da agência</label><input className="input" defaultValue="BKS Grow"/><div className="hint">Aparece no topo do painel dos clientes</div></div>
            <div className="field"><label>Seu nome</label><input className="input" defaultValue="Erick Sena"/></div>
            <div className="field"><label>Email principal</label><input className="input" defaultValue="contato@backstagegrow.com.br"/></div>
            <div className="row" style={{justifyContent:"flex-end", marginTop:8}}><button className="btn btn-primary" onClick={()=>window.toast && window.toast("Alterações salvas", "success")}>Salvar alterações</button></div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Token Meta API (System User)</div>
            <span className="badge success"><span className="dot"/>Ativo</span>
          </div>
          <div className="card-pad" style={{display:"flex", flexDirection:"column", gap:14}}>
            <div className="field">
              <label>Validade do token</label>
              <div className="row" style={{gap:12}}>
                <div style={{flex:1}}>
                  <div className="row" style={{justifyContent:"space-between", marginBottom:6}}>
                    <span className="muted" style={{fontSize:12}}>Expira em 56 dias</span>
                    <span className="num muted" style={{fontSize:12}}>11/07/2026</span>
                  </div>
                  <div className="bar"><span style={{width:"62%", background:"rgb(var(--c-success))"}}/></div>
                </div>
              </div>
            </div>
            <div className="field"><label>Novo System User Token</label><input className="input" placeholder="Cole o token aqui..."/></div>
            <div className="row" style={{gap:8}}>
              <button className="btn" onClick={()=>{window.toast && window.toast("Testando conexão…", "info"); setTimeout(()=>window.toast && window.toast("Conexão OK — token válido por 56 dias", "success"), 1100);}}>Testar conexão</button>
              <button className="btn btn-primary" onClick={()=>window.toast && window.toast("Token salvo e criptografado", "success")}>Salvar token</button>
            </div>
            <div className="hint" style={{fontSize:11, color:"rgb(var(--text-3))"}}>Gere um novo em <strong style={{color:"rgb(var(--text-2))"}}>Meta Business Manager → Configurações → Usuários do Sistema</strong></div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">WhatsApp API</div><span className="badge success"><span className="dot"/>Conectada</span></div>
          <div className="card-pad" style={{display:"flex", flexDirection:"column", gap:12}}>
            <SettingRow label="Provedor" value="uazapi (Cloud API)"/>
            <SettingRow label="Número remetente" value="+55 11 99765-4321"/>
            <SettingRow label="Mensagens (30d)" value="1.842 enviadas"/>
            <SettingRow label="Taxa de entrega" value="97,2%"/>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Equipe</div><button className="btn btn-sm"><I.plus/>Convidar</button></div>
          <div className="card-pad" style={{display:"flex", flexDirection:"column", gap:12}}>
            {[{n:"Erick Sena", e:"contato@backstagegrow.com.br", r:"Admin", c:"avt-6"},
              {n:"Lucas Rodrigues", e:"lucas@bksgrow.com.br", r:"Gestor", c:"avt-1"},
              {n:"Camila Souza", e:"camila@bksgrow.com.br", r:"Analista", c:"avt-5"}
            ].map((m,i) => (
              <div className="row" style={{justifyContent:"space-between"}} key={i}>
                <div className="row" style={{gap:10}}>
                  <span className={`avt lg ${m.c}`}>{m.n.split(' ').map(x=>x[0]).slice(0,2).join('')}</span>
                  <div><div style={{fontSize:13, fontWeight:500}}>{m.n}</div><div className="muted" style={{fontSize:11}}>{m.e}</div></div>
                </div>
                <span className="badge">{m.r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, value }) {
  return (
    <div className="row" style={{justifyContent:"space-between"}}>
      <span className="muted" style={{fontSize:13}}>{label}</span>
      <span style={{fontSize:13, fontWeight:500}}>{value}</span>
    </div>
  );
}

Object.assign(window, { AdminOverview, AdminBMs, AdminAccounts, AdminCampaigns, AdminClients, AdminReports, AdminSocial, AdminSettings });
