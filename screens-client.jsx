/* global React, MOCK, fmt, I, KPI, Spark, Status, TT, Recharts */
const { ResponsiveContainer: RC2, AreaChart: AC2, Area: Area2, LineChart: LC2, Line: Line2, BarChart: BC2, Bar: Bar2, XAxis: XA2, YAxis: YA2, Tooltip: TP2, CartesianGrid: CG2, PieChart: PC2, Pie: Pie2, Cell: Cell2, RadialBarChart, RadialBar, FunnelChart, Funnel, LabelList } = Recharts;

/* ============================================
   CLIENTE — Dashboard executivo
   Estilo Stripe: misto exec topo + detalhe embaixo
   ============================================ */
function ClientDashboard({ go, client }) {
  const c = client || MOCK.CLIENTS[0];
  const data = MOCK.performance30;
  const totalSpend = c.spend30;
  const totalLeads = c.leads30;
  const cpa = totalSpend / Math.max(totalLeads, 1);
  const estTicket = 3000;
  const estSales = Math.round(totalLeads * 0.12);
  const estRevenue = estSales * estTicket;
  const profit = estRevenue - totalSpend;
  const roi = ((estRevenue - totalSpend) / totalSpend) * 100;

  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow">Resumo Executivo • Atualizado há 4 min</div>
          <h1 className="page-title">Olá, {c.name.split(' ')[0]}</h1>
          <div className="page-sub">Veja como seu investimento está performando hoje.</div>
        </div>
        <div className="page-actions">
          <div className="seg">
            <button>7d</button><button className="on">30d</button><button>90d</button>
          </div>
          <button className="btn"><I.refresh/>Sincronizar</button>
          <button className="btn btn-primary"><I.download/>Exportar PDF</button>
        </div>
      </div>

      {/* HERO: lucro grande + ROI */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgb(var(--bg-card)) 0%, rgb(var(--bg-elev)) 100%)", overflow: "visible" }}>
        <div style={{display:"grid", gridTemplateColumns:"1.2fr 1fr 1fr 1fr", gap:0}}>
          <div style={{padding:"24px 28px", borderRight:"1px solid rgb(var(--border-soft))"}}>
            <div className="eyebrow">Lucro estimado • 30 dias</div>
            <div className="num" style={{fontSize:42, fontWeight:600, letterSpacing:"-0.04em", marginTop:4, color: profit >= 0 ? "rgb(var(--c-success))" : "rgb(var(--c-danger))"}}>
              {profit >= 0 ? "" : "−"}{fmt.brl(Math.abs(profit))}
            </div>
            <div className="row" style={{marginTop:8, gap:8}}>
              <span className={`badge ${roi>=0?"success":"danger"}`}>{roi >= 0 ? <I.arrowUp className="ico" style={{width:11,height:11}}/> : <I.arrowDn className="ico" style={{width:11,height:11}}/>}ROI {Math.abs(roi).toFixed(0)}%</span>
              <span className="muted" style={{fontSize:12}}>Baseado em ticket médio de {fmt.brl(estTicket)}</span>
            </div>
            <div style={{marginTop:14, height:50}}>
              <Spark data={data.map(d=>({v: d.leads * estTicket * 0.12 - d.spend}))} color="rgb(var(--accent))"/>
            </div>
          </div>
          <ExecBox label="Investido" value={fmt.brl(totalSpend)} sub="em tráfego pago" icon={<I.dollar/>} spark={data.map(d=>({v:d.spend}))}/>
          <ExecBox label="Oportunidades" value={totalLeads} sub={`CPA ${fmt.brl(cpa)}`} icon={<I.users/>} spark={data.map(d=>({v:d.leads}))} accent/>
          <ExecBox label="Alcance da marca" value="175.696" sub="158.906 pessoas únicas" icon={<I.target/>} spark={data.map(d=>({v: d.spend*210}))}/>
        </div>
      </div>

      <div className="sp-20"/>

      {/* Performance chart - dual axis like Stripe */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Performance diária</div>
            <div className="card-sub">Investimento, leads e CPA</div>
          </div>
          <div className="row">
            <span className="badge"><span className="dot" style={{background:"rgb(var(--accent))"}}/>Investido</span>
            <span className="badge"><span className="dot" style={{background:"rgb(var(--c-info))"}}/>Leads</span>
            <span className="badge"><span className="dot" style={{background:"rgb(var(--c-violet))"}}/>CPA</span>
          </div>
        </div>
        <div style={{padding:"12px 8px 12px", height: 280}}>
          <RC2 width="100%" height="100%">
            <AC2 data={data} margin={{top:10, right:24, left:12, bottom:0}}>
              <defs>
                <linearGradient id="gd1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.25}/>
                  <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CG2 stroke="rgb(var(--border-soft))" vertical={false}/>
              <XA2 dataKey="label" tickLine={false} axisLine={false} interval={Math.floor(data.length/8)} />
              <YA2 yAxisId="l" tickLine={false} axisLine={false} tickFormatter={v=>fmt.brlShort(v)} width={56}/>
              <YA2 yAxisId="r" orientation="right" tickLine={false} axisLine={false} width={36}/>
              <TP2 content={<TT fmt={v=>typeof v==="number" && v > 50 ? fmt.brl(v) : v}/>}/>
              <Area2 yAxisId="l" type="monotone" dataKey="spend" name="Investido" stroke="rgb(var(--accent))" strokeWidth={1.8} fill="url(#gd1)" isAnimationActive={false}/>
              <Line2 yAxisId="r" type="monotone" dataKey="leads" name="Leads" stroke="rgb(var(--c-info))" strokeWidth={1.6} dot={false} isAnimationActive={false}/>
              <Line2 yAxisId="l" type="monotone" dataKey="cpa" name="CPA" stroke="rgb(var(--c-violet))" strokeWidth={1.4} strokeDasharray="4 3" dot={false} isAnimationActive={false}/>
            </AC2>
          </RC2>
        </div>
      </div>

      <div className="sp-20"/>

      {/* Ad Health + Pacing */}
      <div className="grid-2">
        <AdHealthCard/>
        <PacingCard client={c}/>
      </div>

      <div className="sp-20"/>

      {/* Funnel + Demographics */}
      <div className="grid-3" style={{gridTemplateColumns:"1.4fr 1fr"}}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Funil de aquisição</div>
              <div className="card-sub">Como o investimento se transforma em vendas</div>
            </div>
            <span className="badge">Estimativa</span>
          </div>
          <div className="card-pad">
            {MOCK.FUNNEL.map((f, i) => {
              const max = MOCK.FUNNEL[0].v;
              const w = (f.v / max) * 100;
              const colors = ["#3b82f6","#60a5fa","rgb(var(--accent))","#f59e0b","#a855f7","rgb(var(--c-success))"];
              const conv = i > 0 ? ((f.v / MOCK.FUNNEL[i-1].v) * 100) : 100;
              return (
                <div key={f.stage} style={{marginBottom: 14}}>
                  <div className="row" style={{justifyContent:"space-between", marginBottom:6}}>
                    <div className="row" style={{gap:8}}>
                      <span style={{width:18, height:18, borderRadius:4, background:colors[i], display:"grid", placeItems:"center", color:"white", fontSize:10, fontWeight:600}}>{i+1}</span>
                      <span style={{fontSize:13, fontWeight:500}}>{f.stage}</span>
                    </div>
                    <div className="row" style={{gap:14}}>
                      {i>0 && <span className="muted num" style={{fontSize:11}}>{conv.toFixed(1).replace('.', ',')}%</span>}
                      <span className="num" style={{fontSize:13, fontWeight:600, minWidth:80, textAlign:"right"}}>{fmt.int(f.v)}</span>
                    </div>
                  </div>
                  <div style={{height:8, background:"rgb(var(--bg-card-2))", borderRadius:4, overflow:"hidden"}}>
                    <div style={{width: w + "%", height:"100%", background: colors[i], borderRadius:4, transition:"width 0.6s ease"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Quem está respondendo</div>
              <div className="card-sub">Perfil dos leads gerados</div>
            </div>
          </div>
          <div className="card-pad">
            <div className="eyebrow" style={{marginBottom:8}}>Por idade</div>
            <div style={{height: 120}}>
              <RC2 width="100%" height="100%">
                <BC2 data={MOCK.AGE_DIST} layout="vertical" margin={{top:0,right:30,left:0,bottom:0}}>
                  <XA2 type="number" hide/>
                  <YA2 dataKey="age" type="category" tickLine={false} axisLine={false} width={48}/>
                  <Bar2 dataKey="v" radius={[0,3,3,0]} isAnimationActive={false}>
                    {MOCK.AGE_DIST.map((e,i)=><Cell2 key={i} fill={e.color}/>)}
                    <LabelList dataKey="v" position="right" style={{fontSize:11, fontFamily:"var(--font-mono)", fill:"rgb(var(--text-2))"}}/>
                  </Bar2>
                </BC2>
              </RC2>
            </div>
            <div className="divider"/>
            <div className="eyebrow" style={{marginBottom:8}}>Por gênero</div>
            {MOCK.GENDER.map(g => (
              <div key={g.k} style={{marginBottom:10}}>
                <div className="row" style={{justifyContent:"space-between", marginBottom:4}}>
                  <span style={{fontSize:12}}>{g.k}</span>
                  <span className="num muted" style={{fontSize:11}}>{g.v}%</span>
                </div>
                <div className="bar"><span style={{width: g.v + "%", background: g.color}}/></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sp-20"/>

      {/* Insights da equipe */}
      <div className="card">
        <div className="card-head">
          <div className="row" style={{gap:10}}>
            <span style={{width:32, height:32, borderRadius:8, background:"rgba(var(--accent-rgb),0.12)", color:"rgb(var(--accent))", display:"grid", placeItems:"center"}}><I.sparkle/></span>
            <div>
              <div className="card-title">Análise do especialista</div>
              <div className="card-sub">Leitura da performance dos últimos 30 dias</div>
            </div>
          </div>
          <span className="badge accent"><span className="dot"/>Gerada por IA + revisada</span>
        </div>
        <div className="card-pad" style={{fontSize:13.5, lineHeight: 1.7, color:"rgb(var(--text-2))"}}>
          Nas últimas semanas, investimos <strong style={{color:"rgb(var(--text))"}} className="num">{fmt.brl(totalSpend)}</strong> em campanhas ativas, gerando <strong style={{color:"rgb(var(--text))"}}>{totalLeads} oportunidades</strong> diretas. O CPA de <strong style={{color:"rgb(var(--text))"}} className="num">{fmt.brl(cpa)}</strong> está {cpa > 200 ? <span style={{color:"rgb(var(--c-warning))"}}>levemente acima do ideal</span> : <span style={{color:"rgb(var(--c-success))"}}>dentro do esperado</span>}. Estamos realocando verba para os públicos mais engajados (faixa <strong>35-44</strong>, que representa 32% dos leads) e pausando criativos com fadiga. A marca alcançou <strong className="num" style={{color:"rgb(var(--text))"}}>158.906 pessoas</strong> únicas, com CTR médio de <strong className="num" style={{color:"rgb(var(--text))"}}>3,11%</strong> — sinal de que a comunicação visual está chamando atenção.
        </div>
        <div className="card-foot">
          <span>Próximo passo: ajustar criativos do conjunto MOFU até quinta.</span>
          <button className="btn btn-sm"><I.chat/>Falar com seu gestor</button>
        </div>
      </div>
    </div>
  );
}

function ExecBox({ label, value, sub, icon, spark, accent }) {
  return (
    <div style={{padding:"24px 22px", borderRight:"1px solid rgb(var(--border-soft))", display:"flex", flexDirection:"column"}}>
      <div className="row" style={{justifyContent:"space-between", color:"rgb(var(--text-3))"}}>
        <span className="eyebrow">{label}</span>
        <span style={{color: accent ? "rgb(var(--accent))" : "rgb(var(--text-3))"}}>{icon}</span>
      </div>
      <div className="num" style={{fontSize:28, fontWeight:600, marginTop:8, letterSpacing:"-0.03em"}}>{value}</div>
      <div className="muted" style={{fontSize:12, marginTop:2}}>{sub}</div>
      {spark && <div style={{marginTop:"auto", paddingTop:8, height:36}}><Spark data={spark} color={accent ? "rgb(var(--accent))" : "rgb(var(--text-3))"}/></div>}
    </div>
  );
}

/* ============================================
   CLIENTE — Campanhas
   ============================================ */
function ClientCampaigns({ client, onOpen }) {
  const c = client || MOCK.CLIENTS[0];
  const list = MOCK.CAMPAIGNS.filter(x => x.client === c.id);
  const total = list.reduce((s,x)=>s+x.spend, 0);

  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow">Performance</div>
          <h1 className="page-title">Campanhas</h1>
          <div className="page-sub">{list.length} campanhas ativas — performance granular por anúncio</div>
        </div>
        <div className="page-actions">
          <div className="seg">
            <button>7d</button><button className="on">30d</button><button>90d</button>
          </div>
          <button className="btn"><I.download/>CSV</button>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead><tr>
            <th>Campanha</th><th>Status</th><th className="right">Investido</th><th className="right">Leads</th><th className="right">CPA</th><th className="right">CTR</th><th className="right">Cliques</th><th>Tendência</th>
          </tr></thead>
          <tbody>
            {list.map(camp => {
              const trend = Array.from({length: 14}, () => ({v: Math.random()*100}));
              return (
                <tr key={camp.id} style={{cursor:"pointer"}} onClick={()=>onOpen && onOpen(camp.id)}>
                  <td>
                    <div style={{fontWeight:500, fontSize:13, maxWidth:340}}>{camp.name}</div>
                    <div className="mono-id">{camp.id}</div>
                  </td>
                  <td>{camp.status==="active"?<Status s="ok" label="Ativa"/>:camp.status==="warn"?<Status s="warn" label="Atenção"/>:<Status s="off" label="Pausada"/>}</td>
                  <td className="right num">{fmt.brl(camp.spend)}</td>
                  <td className="right num">{camp.leads}</td>
                  <td className="right num">{camp.cpa ? fmt.brl(camp.cpa) : "—"}</td>
                  <td className="right num">{camp.ctr ? camp.ctr.toFixed(2).replace('.', ',') + "%" : "—"}</td>
                  <td className="right num">{fmt.int(camp.clicks)}</td>
                  <td><div style={{width:90, height:28}}><Spark data={trend}/></div></td>
                </tr>
              );
            })}
            <tr style={{background:"rgb(var(--bg-card-2))", fontWeight:600}}>
              <td colSpan={2}>Total</td>
              <td className="right num">{fmt.brl(total)}</td>
              <td className="right num">{list.reduce((s,x)=>s+x.leads,0)}</td>
              <td className="right num">{fmt.brl(total/Math.max(list.reduce((s,x)=>s+x.leads,0),1))}</td>
              <td colSpan={3}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================
   CLIENTE — Central de Leads
   ============================================ */
function ClientLeads({ client, onOpen }) {
  const c = client || MOCK.CLIENTS[0];
  const leads = MOCK.LEADS.filter(l => l.client === c.id);

  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow">Aquisição</div>
          <h1 className="page-title">Central de Leads</h1>
          <div className="page-sub">{leads.length} contatos capturados — entre em contato direto</div>
        </div>
        <div className="page-actions">
          <select className="select" style={{width:200}}>
            <option>Todas as origens</option>
            <option>FORMS - SALVADOR - INVESTIDOR</option>
            <option>MSG - DM Instagram</option>
            <option>MSG - WhatsApp</option>
          </select>
          <button className="btn"><I.download/>CSV</button>
        </div>
      </div>

      <div className="kpi-row">
        <KPI label="Total de leads" value={leads.length}/>
        <KPI label="Novos (24h)" value={leads.filter(l=>l.new).length} delta={null}/>
        <KPI label="Quentes" value={leads.filter(l=>l.score==="hot").length}/>
        <KPI label="Último lead" value="há 6 min"/>
      </div>

      <div className="sp-20"/>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Contatos capturados</div>
            <div className="card-sub">Ordenado por recência</div>
          </div>
          <div className="input-with-icon">
            <I.search/>
            <input className="input" placeholder="Buscar..." style={{width:240}}/>
          </div>
        </div>
        <table className="tbl">
          <thead><tr>
            <th>Contato</th><th>Origem</th><th>Capturado</th><th>Score</th><th className="right">Ações</th>
          </tr></thead>
          <tbody>
            {leads.map(l => (
              <tr key={l.id}>
                <td>
                  <div className="row" style={{gap:10}}>
                    <span className="avt lg" style={{background: ["#3b82f6","#a855f7","#f59e0b","#06b6d4","#ec4899","#10b981"][l.id%6], color:"white", border:"none"}}>{l.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</span>
                    <div>
                      <div style={{fontSize:13, fontWeight:600}}>{l.name} {l.new && <span className="badge accent" style={{marginLeft:6}}>NOVO</span>}</div>
                      <div className="muted" style={{fontSize:11}}>{l.email} • {l.phone}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge">{l.source}</span></td>
                <td className="muted" style={{fontSize:12}}>{new Date(l.when).toLocaleDateString('pt-BR')} • {new Date(l.when).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                <td>
                  {l.score==="hot" && <span className="badge danger"><span className="dot"/>Quente</span>}
                  {l.score==="warm" && <span className="badge warning"><span className="dot"/>Morno</span>}
                  {l.score==="cold" && <span className="badge info"><span className="dot"/>Frio</span>}
                </td>
                <td className="right">
                  <button className="btn btn-sm btn-ghost" title="WhatsApp"><I.chat/></button>
                  <button className="btn btn-sm btn-ghost" title="Email"><I.mail/></button>
                  <button className="btn btn-sm btn-ghost" title="Telefone"><I.phone/></button>
                  <button className="btn btn-sm" onClick={()=>onOpen && onOpen(l)}>Ver detalhes →</button>
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
   CLIENTE — Criativos (NOVA TELA)
   ============================================ */
function ClientCreatives() {
  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow">Performance criativa</div>
          <h1 className="page-title">Criativos</h1>
          <div className="page-sub">Performance de cada anúncio — vídeos, imagens, carrosséis</div>
        </div>
        <div className="page-actions">
          <div className="seg">
            <button>Todos</button>
            <button className="on">Em destaque</button>
            <button>Em fadiga</button>
            <button>Pausados</button>
          </div>
          <button className="btn"><I.filter/>Filtros</button>
        </div>
      </div>

      <div className="grid-3">
        {MOCK.CREATIVES.map(cr => (
          <div className="card" key={cr.id}>
            <div style={{position:"relative", aspectRatio:"4/3", background: "linear-gradient(135deg, rgb(var(--bg-card-2)) 0%, rgb(var(--bg-elev)) 100%)", display:"grid", placeItems:"center", borderBottom:"1px solid rgb(var(--border-soft))"}}>
              <CreativeMock kind={cr.thumb}/>
              <div style={{position:"absolute", top:10, left:10}}>
                {cr.status === "winner" && <span className="badge accent"><I.sparkle className="ico" style={{width:11,height:11}}/>Top performer</span>}
                {cr.status === "fatigue" && <span className="badge warning"><I.warn className="ico" style={{width:11,height:11}}/>Em fadiga</span>}
                {cr.status === "decline" && <span className="badge danger"><I.arrowDn className="ico" style={{width:11,height:11}}/>Caindo</span>}
                {cr.status === "active" && <span className="badge"><span className="dot"/>Rodando</span>}
              </div>
              <div style={{position:"absolute", top:10, right:10}}>
                <span className="badge">{cr.format}</span>
              </div>
            </div>
            <div className="card-pad">
              <div style={{fontWeight:600, fontSize:13, marginBottom:12}}>{cr.name}</div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12}}>
                <Mini2 label="CTR" value={cr.ctr.toFixed(2).replace('.', ',') + "%"} good={cr.ctr > 3}/>
                <Mini2 label="CPA" value={fmt.brl(cr.cpa)} good={cr.cpa < 150}/>
                <Mini2 label="Leads" value={cr.leads}/>
                <Mini2 label="Invest." value={fmt.brl(cr.spend)}/>
              </div>
              <div className="row" style={{justifyContent:"space-between", paddingTop:10, borderTop:"1px solid rgb(var(--border-soft))"}}>
                <span className="muted" style={{fontSize:11}}>Frequência</span>
                <span className="num" style={{fontSize:12, fontWeight:500, color: cr.freq > 3 ? "rgb(var(--c-warning))" : "rgb(var(--text))"}}>{cr.freq.toFixed(1).replace('.', ',')}x</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Mini2({ label, value, good }) {
  return (
    <div>
      <div className="eyebrow" style={{fontSize:10, marginBottom:2}}>{label}</div>
      <div className="num" style={{fontSize:15, fontWeight:600, color: good ? "rgb(var(--c-success))" : "rgb(var(--text))"}}>{value}</div>
    </div>
  );
}

function CreativeMock({ kind }) {
  const base = { width:"60%", height:"60%", background:"rgb(var(--bg-card))", border:"1px solid rgb(var(--border))", borderRadius:8, display:"grid", placeItems:"center", color:"rgb(var(--text-mute))" };
  if (kind === "video" || kind === "reel") {
    return <div style={base}><svg width="32" height="32" viewBox="0 0 24 24" fill="rgb(var(--text-3))"><path d="M8 5v14l11-7z"/></svg></div>;
  }
  if (kind === "stories") {
    return <div style={{...base, aspectRatio:"9/16", width:"35%", height:"auto"}}><I.image style={{width:24,height:24}}/></div>;
  }
  if (kind === "carrossel") {
    return <div style={{position:"relative", width:"60%", height:"60%"}}>
      <div style={{...base, position:"absolute", inset:0}}><I.image style={{width:24,height:24}}/></div>
      <div style={{...base, position:"absolute", inset:0, transform:"translate(8px, 8px)", opacity:0.5}}/>
    </div>;
  }
  return <div style={base}><I.image style={{width:24,height:24}}/></div>;
}

/* ============================================
   CLIENTE — Instagram Analytics (NEW — expandida)
   ============================================ */
function ClientSocial() {
  const p = MOCK.IG_PROFILE;
  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow">Conteúdo orgânico</div>
          <h1 className="page-title">Instagram Analytics</h1>
          <div className="page-sub">Métricas orgânicas e melhores horários para publicar</div>
        </div>
        <div className="page-actions">
          <div className="seg"><button>7d</button><button className="on">30d</button><button>90d</button></div>
          <button className="btn"><I.refresh/>Atualizar</button>
        </div>
      </div>

      {/* Profile header */}
      <div className="card">
        <div className="card-pad" style={{display:"grid", gridTemplateColumns:"auto 1fr auto auto auto auto", alignItems:"center", gap:24}}>
          <div style={{width:64, height:64, borderRadius:"50%", background:"linear-gradient(135deg, #f09433, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888)", display:"grid", placeItems:"center"}}>
            <div style={{width:58, height:58, borderRadius:"50%", background:"rgb(var(--bg-card))", display:"grid", placeItems:"center", fontSize:20, fontWeight:600}}>AB</div>
          </div>
          <div>
            <div style={{fontFamily:"var(--font-display)", fontSize:18, fontWeight:600}}>{p.name}</div>
            <div className="muted" style={{fontSize:13}}>{p.handle} • Conta comercial</div>
          </div>
          <Stat n={p.followers} l="Seguidores" delta={p.followersDelta}/>
          <Stat n={p.posts30} l="Posts (30d)"/>
          <Stat n="245K" l="Alcance" delta={3.2}/>
          <Stat n={p.engagement + "%"} l="Engajamento" delta={0.4}/>
        </div>
      </div>

      <div className="sp-20"/>

      {/* Growth + heatmap */}
      <div className="grid-3" style={{gridTemplateColumns:"1.4fr 1fr"}}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Crescimento de seguidores</div>
              <div className="card-sub">+622 nos últimos 30 dias</div>
            </div>
            <span className="badge success"><I.up className="ico" style={{width:11,height:11}}/>+3,5%</span>
          </div>
          <div style={{padding:"12px 8px 8px", height:260}}>
            <RC2 width="100%" height="100%">
              <AC2 data={MOCK.IG_GROWTH} margin={{top:10,right:20,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="ggrow" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.28}/>
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CG2 stroke="rgb(var(--border-soft))" vertical={false}/>
                <XA2 dataKey="label" tickLine={false} axisLine={false} interval={Math.floor(MOCK.IG_GROWTH.length/8)}/>
                <YA2 tickLine={false} axisLine={false} domain={['dataMin - 100', 'dataMax + 100']} width={50}/>
                <TP2 content={<TT/>}/>
                <Area2 type="monotone" dataKey="followers" name="Seguidores" stroke="#ec4899" strokeWidth={1.8} fill="url(#ggrow)" isAnimationActive={false}/>
              </AC2>
            </RC2>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Engajamento médio</div>
              <div className="card-sub">Por interação</div>
            </div>
          </div>
          <div className="card-pad">
            {[
              {l:"Curtidas", v: p.avgLikes, c:"#ec4899", max: 600},
              {l:"Comentários", v: p.avgComments, c:"#a855f7", max: 100},
              {l:"Salvamentos", v: p.avgSaves, c:"#3b82f6", max: 100},
              {l:"Compartilhamentos", v: p.avgShares, c:"rgb(var(--accent))", max: 60}
            ].map(r => (
              <div key={r.l} style={{marginBottom:14}}>
                <div className="row" style={{justifyContent:"space-between", marginBottom:4}}>
                  <span style={{fontSize:13}}>{r.l}</span>
                  <span className="num" style={{fontSize:13, fontWeight:600}}>{r.v}</span>
                </div>
                <div className="bar"><span style={{width: (r.v/r.max*100) + "%", background: r.c}}/></div>
              </div>
            ))}
            <div className="divider"/>
            <div className="row" style={{justifyContent:"space-between"}}>
              <span className="muted" style={{fontSize:12}}>Melhor horário</span>
              <span className="badge success">{p.bestTime}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sp-20"/>

      {/* Heatmap of best hours */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Mapa de calor — quando publicar</div>
            <div className="card-sub">Engajamento médio por dia × hora</div>
          </div>
        </div>
        <div className="card-pad" style={{overflowX:"auto"}}>
          <Heatmap/>
        </div>
      </div>

      <div className="sp-20"/>

      {/* Top posts */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Posts em destaque</div>
            <div className="card-sub">Por engajamento total</div>
          </div>
        </div>
        <table className="tbl">
          <thead><tr><th>Post</th><th>Tipo</th><th className="right">Alcance</th><th className="right">Curtidas</th><th className="right">Comentários</th><th className="right">Salvamentos</th></tr></thead>
          <tbody>
            {MOCK.IG_TOP_POSTS.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="row" style={{gap:10}}>
                    <div style={{width:40, height:40, borderRadius:6, background:"linear-gradient(135deg, #f09433, #dc2743)", display:"grid", placeItems:"center", color:"white"}}>
                      {p.type === "reel" ? <I.bolt/> : p.type === "carrossel" ? <I.layers/> : <I.image/>}
                    </div>
                    <span style={{fontSize:13, fontWeight:500, maxWidth:380, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{p.caption}</span>
                  </div>
                </td>
                <td><span className="badge">{p.type}</span></td>
                <td className="right num">{fmt.int(p.reach)}</td>
                <td className="right num">{fmt.int(p.likes)}</td>
                <td className="right num">{fmt.int(p.comments)}</td>
                <td className="right num">{fmt.int(p.saves)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ n, l, delta }) {
  return (
    <div>
      <div className="num" style={{fontSize:22, fontWeight:600, letterSpacing:"-0.02em"}}>{typeof n === "number" ? fmt.int(n) : n}</div>
      <div className="row" style={{gap:6, marginTop:2}}>
        <span className="muted" style={{fontSize:11}}>{l}</span>
        {delta != null && <span className={`delta ${delta>=0?"up":"dn"}`} style={{fontSize:10}}>{delta>=0?"+":""}{delta.toFixed(1).replace('.', ',')}%</span>}
      </div>
    </div>
  );
}

function Heatmap() {
  const days = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
  const hours = Array.from({length: 24}, (_, h) => h);
  // generate per-day data
  const data = days.map(d => hours.map(h => {
    let base = 5;
    if (h >= 18 && h <= 22) base += 15;
    if (h >= 11 && h <= 13) base += 8;
    if (d === "Sáb" || d === "Dom") base = Math.max(2, base - 6);
    return Math.round(base + Math.random() * 6);
  }));
  const max = Math.max(...data.flat());
  return (
    <div style={{display:"flex", gap: 2, fontSize:10, color:"rgb(var(--text-3))", minWidth: 720}}>
      <div style={{display:"flex", flexDirection:"column", gap:2, marginRight:8, paddingTop: 18}}>
        {days.map(d => <div key={d} style={{height: 22, lineHeight:"22px"}}>{d}</div>)}
      </div>
      <div style={{flex:1}}>
        <div style={{display:"grid", gridTemplateColumns:`repeat(24, 1fr)`, gap:2, marginBottom: 4, fontFamily:"var(--font-mono)"}}>
          {hours.map(h => <div key={h} style={{textAlign:"center", fontSize:10}}>{h%3===0 ? h+"h" : ""}</div>)}
        </div>
        {data.map((row, di) => (
          <div key={di} style={{display:"grid", gridTemplateColumns:`repeat(24, 1fr)`, gap:2, marginBottom: 2}}>
            {row.map((v, hi) => {
              const intensity = v / max;
              return (
                <div key={hi} style={{
                  height: 22,
                  borderRadius: 3,
                  background: intensity > 0.8 ? "rgb(var(--accent))" :
                              intensity > 0.6 ? "rgba(var(--accent-rgb), 0.7)" :
                              intensity > 0.4 ? "rgba(var(--accent-rgb), 0.45)" :
                              intensity > 0.2 ? "rgba(var(--accent-rgb), 0.22)" :
                              "rgba(var(--accent-rgb), 0.08)",
                  cursor:"pointer"
                }} title={`${days[di]} ${hi}h • ${v} interações`}/>
              );
            })}
          </div>
        ))}
        <div className="row" style={{marginTop:14, gap: 8, justifyContent:"flex-end", fontSize:10, color:"rgb(var(--text-3))"}}>
          <span>Menos</span>
          {[0.08, 0.22, 0.45, 0.7, 1].map(o => <span key={o} style={{width:14, height:14, borderRadius:3, background: o === 1 ? "rgb(var(--accent))" : `rgba(var(--accent-rgb), ${o})`}}/>)}
          <span>Mais</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   CLIENTE — Relatórios
   ============================================ */
function ClientReports({ client }) {
  const c = client || MOCK.CLIENTS[0];
  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow">Documentos</div>
          <h1 className="page-title">Relatórios</h1>
          <div className="page-sub">Exporte e receba seus relatórios automaticamente</div>
        </div>
      </div>

      <div className="grid-3" style={{gridTemplateColumns:"2fr 1fr"}}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Gerar relatório agora</div>
              <div className="card-sub">PDF executivo com gráficos e análise</div>
            </div>
          </div>
          <div className="card-pad">
            <div className="grid-3" style={{gap:14}}>
              <div className="field"><label>Período</label><select className="select"><option>Últimos 30 dias</option><option>Últimos 7 dias</option><option>Mês atual</option><option>Personalizado</option></select></div>
              <div className="field"><label>Formato</label><select className="select"><option>PDF executivo</option><option>PDF detalhado</option><option>CSV bruto</option></select></div>
              <div className="field"><label>Idioma</label><select className="select"><option>Português (BR)</option><option>English</option></select></div>
            </div>
            <div className="sp-20"/>
            <div className="row" style={{gap:8}}>
              <button className="btn btn-primary"><I.download/>Gerar e baixar</button>
              <button className="btn"><I.send/>Enviar por WhatsApp</button>
              <button className="btn"><I.mail/>Enviar por email</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Resumo executivo</div></div>
          <div className="card-pad">
            <div style={{display:"flex", flexDirection:"column", gap:14}}>
              <Row2 label="Investimento" value={fmt.brl(c.spend30)}/>
              <Row2 label="Oportunidades" value={c.leads30}/>
              <Row2 label="CPA" value={fmt.brl(c.cpa)}/>
              <Row2 label="Lucro estimado" value={<span style={{color:"rgb(var(--c-success))"}}>{fmt.brl(c.spend30*c.roi)}</span>}/>
              <Row2 label="ROI" value={<strong>{c.roi.toFixed(2).replace('.', ',')}x</strong>}/>
            </div>
          </div>
        </div>
      </div>

      <div className="sp-20"/>

      <div className="card">
        <div className="card-head">
          <div><div className="card-title">Histórico</div><div className="card-sub">Relatórios enviados</div></div>
        </div>
        <table className="tbl">
          <thead><tr><th>Relatório</th><th>Período</th><th>Enviado</th><th>Canal</th><th className="right">Ações</th></tr></thead>
          <tbody>
            {MOCK.REPORTS.filter(r=>r.client===c.id).slice(0,6).map(r=>(
              <tr key={r.id}>
                <td><div style={{fontSize:13, fontWeight:500}}>{r.title}</div></td>
                <td className="muted" style={{fontSize:12}}>{r.period}</td>
                <td className="muted" style={{fontSize:12}}>{new Date(r.date).toLocaleDateString('pt-BR')}</td>
                <td><span className="badge"><I.chat className="ico" style={{width:11,height:11}}/>WhatsApp</span></td>
                <td className="right"><button className="btn btn-sm btn-ghost"><I.eye/>Ver</button><button className="btn btn-sm btn-ghost"><I.download/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row2({ label, value }) {
  return (
    <div className="row" style={{justifyContent:"space-between"}}>
      <span className="muted" style={{fontSize:13}}>{label}</span>
      <span className="num" style={{fontSize:14, fontWeight:600}}>{value}</span>
    </div>
  );
}

/* ============================================
   CLIENTE — Configurações
   ============================================ */
function ClientSettings({ client }) {
  const c = client || MOCK.CLIENTS[0];
  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow">Sua conta</div>
          <h1 className="page-title">Configurações</h1>
          <div className="page-sub">Perfil, segurança, conexões e notificações</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><div className="card-title">Perfil</div></div>
          <div className="card-pad" style={{display:"flex", flexDirection:"column", gap:14}}>
            <div className="row" style={{gap:14}}>
              <span className={`avt ${c.color}`} style={{width:64, height:64, fontSize:22}}>{c.logo}</span>
              <div className="row" style={{gap:8}}>
                <button className="btn">Trocar foto</button>
                <button className="btn btn-ghost btn-danger">Remover</button>
              </div>
            </div>
            <div className="field"><label>Nome</label><input className="input" defaultValue={c.name}/></div>
            <div className="field"><label>Email (leitura)</label><input className="input" defaultValue={c.email} disabled/></div>
            <div className="field"><label>WhatsApp</label><input className="input" defaultValue={c.phone}/></div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Conexão Instagram</div><Status s="ok" label="Conectado"/></div>
          <div className="card-pad" style={{display:"flex", flexDirection:"column", gap:14}}>
            <div className="row" style={{gap:10}}>
              <div style={{width:48, height:48, borderRadius:"50%", background:"linear-gradient(135deg, #f09433, #dc2743)", display:"grid", placeItems:"center", color:"white"}}><I.insta/></div>
              <div><div style={{fontSize:13, fontWeight:600}}>@alphabusiness.aba</div><div className="muted" style={{fontSize:11}}>Última sincronização há 12 min</div></div>
            </div>
            <button className="btn">Sincronizar agora</button>
            <button className="btn btn-ghost btn-danger">Desconectar</button>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Notificações por WhatsApp</div></div>
          <div className="card-pad" style={{display:"flex", flexDirection:"column", gap:14}}>
            <Toggle label="Relatório diário" sub="Resumo de performance toda manhã" on/>
            <Toggle label="Alerta de novos leads" sub="Receba assim que um lead entrar" on/>
            <Toggle label="Alertas críticos" sub="Campanha pausada, CPA disparou" on/>
            <Toggle label="Resumo semanal" sub="Toda segunda-feira" />
            <div className="divider"/>
            <div className="field"><label>Horário do resumo diário</label><input className="input" defaultValue="08:00" type="time"/></div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Segurança</div></div>
          <div className="card-pad" style={{display:"flex", flexDirection:"column", gap:14}}>
            <div className="field"><label>Senha atual</label><input className="input" type="password" placeholder="••••••••••••"/></div>
            <div className="field"><label>Nova senha</label><input className="input" type="password"/></div>
            <div className="field"><label>Confirmar nova senha</label><input className="input" type="password"/></div>
            <button className="btn">Atualizar senha</button>
            <div className="divider"/>
            <div className="row" style={{justifyContent:"space-between"}}>
              <div><div style={{fontSize:13, fontWeight:500}}>Autenticação em 2 fatores</div><div className="muted" style={{fontSize:11}}>Adicione uma camada extra de segurança</div></div>
              <button className="btn btn-sm">Ativar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, sub, on }) {
  const [v, set] = React.useState(!!on);
  return (
    <div className="row" style={{justifyContent:"space-between"}}>
      <div><div style={{fontSize:13, fontWeight:500}}>{label}</div>{sub && <div className="muted" style={{fontSize:11}}>{sub}</div>}</div>
      <button onClick={()=>set(!v)} style={{
        width:36, height:20, borderRadius:999, border:"none", cursor:"pointer",
        background: v ? "rgb(var(--accent))" : "rgb(var(--bg-card-2))",
        position:"relative", padding:0, transition:"background 0.18s"
      }}>
        <span style={{
          position:"absolute", top:2, left: v ? 18 : 2,
          width:16, height:16, borderRadius:"50%",
          background:"white",
          transition:"left 0.18s",
          boxShadow:"0 1px 3px rgba(0,0,0,0.2)"
        }}/>
      </button>
    </div>
  );
}

/* ============================================
   CLIENTE — Suporte
   ============================================ */
function ClientSupport() {
  const topics = [
    { ic: <I.trend/>, t: "Resultado da campanha", s: "Entender métricas, performance" },
    { ic: <I.dollar/>, t: "Ajuste de verba", s: "Aumentar, reduzir investimento" },
    { ic: <I.image/>, t: "Novo criativo", s: "Solicitar novo anúncio" },
    { ic: <I.target/>, t: "Explorar novo público", s: "Testar audiência diferente" },
    { ic: <I.bolt/>, t: "Pausar campanha", s: "Pausar temporariamente" },
    { ic: <I.refresh/>, t: "Mudar estratégia", s: "Replanejar abordagem" },
  ];
  const faqs = [
    { q: "Em quanto tempo recebo retorno?", a: "Em horário comercial, respondemos em até 2 horas úteis. Fora desse período, no próximo dia útil." },
    { q: "Como acompanho resultados em tempo real?", a: "Seu dashboard atualiza automaticamente a cada 15 minutos via Meta API." },
    { q: "Posso solicitar relatório personalizado?", a: "Sim — abra um chamado pelo WhatsApp com o recorte desejado." },
    { q: "Como funciona a criação de criativos?", a: "Nossa equipe desenvolve até 4 variações por mês, incluso no Plano Pro." },
    { q: "Posso ajustar minha verba a qualquer momento?", a: "Sim — solicite via WhatsApp e ajustamos em até 24h." },
  ];

  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow">Atendimento humano</div>
          <h1 className="page-title">Falar com seu gestor</h1>
          <div className="page-sub">Estratégia, criativos, verba, resultados — tudo em um só lugar</div>
        </div>
        <div className="page-actions">
          <span className="badge success"><span className="dot"/>Online agora</span>
          <button className="btn btn-primary"><I.chat/>Abrir WhatsApp</button>
        </div>
      </div>

      <div className="grid-4">
        <SupportStat icon={<I.clock/>} label="Resposta" value="≤ 2h" sub="Em horário comercial"/>
        <SupportStat icon={<I.cal/>} label="Atendimento" value="Seg–Sex" sub="9h–18h • Fuso BSB"/>
        <SupportStat icon={<I.check/>} label="Satisfação" value="98%" sub="Média histórica"/>
        <SupportStat icon={<I.users/>} label="Sua equipe" value="1 gestor" sub="Dedicado e exclusivo"/>
      </div>

      <div className="sp-20"/>

      <div className="grid-3" style={{gridTemplateColumns:"1.4fr 1fr"}}>
        <div className="card">
          <div className="card-head">
            <div><div className="card-title">Precisa de ajuda com…</div><div className="card-sub">Clique no assunto e abrimos o WhatsApp com a mensagem pronta</div></div>
          </div>
          <div className="card-pad">
            <div className="grid-2">
              {topics.map((t,i) => (
                <div key={i} className="card" style={{padding:14, cursor:"pointer", background:"rgb(var(--bg-card-2))"}} onMouseEnter={(e)=>e.currentTarget.style.borderColor="rgba(var(--accent-rgb),0.3)"} onMouseLeave={(e)=>e.currentTarget.style.borderColor="rgb(var(--border))"}>
                  <div className="row" style={{gap:10, marginBottom:6}}>
                    <span style={{width:32, height:32, borderRadius:8, background:"rgba(var(--accent-rgb), 0.1)", color:"rgb(var(--accent))", display:"grid", placeItems:"center"}}>{t.ic}</span>
                    <div>
                      <div style={{fontSize:13, fontWeight:600}}>{t.t}</div>
                      <div className="muted" style={{fontSize:11}}>{t.s}</div>
                    </div>
                    <span className="lnk" style={{marginLeft:"auto", fontSize:12}}>Abrir →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><div className="card-title">Dúvidas frequentes</div><div className="card-sub">Respostas rápidas</div></div></div>
          <div className="card-pad" style={{display:"flex", flexDirection:"column", gap:0}}>
            {faqs.map((f,i) => <FAQ key={i} q={f.q} a={f.a} open={i===0}/>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQ({ q, a, open }) {
  const [o, set] = React.useState(!!open);
  return (
    <div style={{borderBottom:"1px solid rgb(var(--border-soft))", padding:"12px 0"}}>
      <div className="row" style={{justifyContent:"space-between", cursor:"pointer"}} onClick={()=>set(!o)}>
        <span style={{fontSize:13, fontWeight:500}}>{q}</span>
        <I.dn style={{transform: o ? "rotate(180deg)" : "none", transition:"transform 0.18s", color:"rgb(var(--text-3))"}}/>
      </div>
      {o && <div className="muted" style={{fontSize:12.5, lineHeight:1.6, marginTop:8}}>{a}</div>}
    </div>
  );
}

function SupportStat({ icon, label, value, sub }) {
  return (
    <div className="kpi" style={{borderRadius: 14, border:"1px solid rgb(var(--border))", background:"rgb(var(--bg-card))"}}>
      <div className="row" style={{justifyContent:"space-between"}}>
        <span className="label">{label}</span>
        <span style={{color:"rgb(var(--accent))"}}>{icon}</span>
      </div>
      <div className="value">{value}</div>
      <div className="muted" style={{fontSize:11}}>{sub}</div>
    </div>
  );
}

Object.assign(window, { ClientDashboard, ClientCampaigns, ClientLeads, ClientCreatives, ClientSocial, ClientReports, ClientSettings, ClientSupport });
