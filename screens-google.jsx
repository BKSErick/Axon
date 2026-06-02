/* global React, MOCK, fmt, I, KPI, Spark, Status, TT, Recharts */
const { ResponsiveContainer: RCg, AreaChart: ACg, Area: Ag, LineChart: LCg, Line: Lg, BarChart: BCg, Bar: Bg, XAxis: XAg, YAxis: YAg, Tooltip: TPg, CartesianGrid: CGg, Cell: Cellg, PieChart: PCg, Pie: Pieg } = Recharts;

/* ============================================
   GOOGLE ICON
   ============================================ */
const GoogleIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41 35.4 44 30.1 44 24c0-1.3-.1-2.6-.4-3.9z"/>
  </svg>
);

/* ============================================
   GOOGLE ADS — ADMIN OVERVIEW
   ============================================ */
function GoogleAdsOverview({ onOpen, role = "admin", onNewCampaign, onSync, onFilter, onApplyRec, onToast }) {
  const [range, setRange] = React.useState("30d");
  const camps = MOCK.GOOGLE_CAMPAIGNS;
  const totalSpend = camps.reduce((s,c)=>s+c.spend, 0);
  const totalConv = camps.reduce((s,c)=>s+c.conversions, 0);
  const totalClicks = camps.reduce((s,c)=>s+c.clicks, 0);
  const totalImpr = camps.reduce((s,c)=>s+c.impr, 0);
  const totalValue = camps.reduce((s,c)=>s+c.convValue, 0);
  const cpa = totalSpend / Math.max(totalConv, 1);
  const ctr = (totalClicks/totalImpr)*100;
  const roas = totalValue / totalSpend;
  const toast = (m, k) => onToast ? onToast(m, k) : (window.toast && window.toast(m, k||"success"));

  // type distribution
  const types = ["Search","PMax","Display","Shopping","YouTube"];
  const typeData = types.map(t => ({
    type: t,
    spend: camps.filter(c=>c.type===t).reduce((s,c)=>s+c.spend, 0),
    color: t==="Search"?"#4285F4":t==="PMax"?"#34A853":t==="Display"?"#FBBC04":t==="Shopping"?"#EA4335":"#9C27B0"
  })).filter(t=>t.spend>0);

  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow row" style={{gap:8, display:"inline-flex"}}><GoogleIcon size={12}/> Google Ads • {role === "admin" ? "Visão consolidada" : "Sua conta"}</div>
          <h1 className="page-title">Google Ads</h1>
          <div className="page-sub">{camps.length} campanhas em {types.filter(t=>camps.some(c=>c.type===t)).length} formatos • Últimos 30 dias</div>
        </div>
        <div className="page-actions">
          <div className="seg">
            <button className={range==="7d"?"on":""} onClick={()=>{setRange("7d"); toast("Mostrando últimos 7 dias", "info");}}>7d</button>
            <button className={range==="30d"?"on":""} onClick={()=>setRange("30d")}>30d</button>
            <button className={range==="90d"?"on":""} onClick={()=>{setRange("90d"); toast("Mostrando últimos 90 dias", "info");}}>90d</button>
          </div>
          <button className="btn" onClick={()=>{ onSync && onSync(); toast("Sincronizando com Google Ads API…", "info"); setTimeout(()=>toast("Sincronização concluída — dados atualizados", "success"), 1500); }}><I.refresh/>Sincronizar</button>
          <button className="btn btn-primary" onClick={onNewCampaign}><I.plus/>Nova campanha</button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-row">
        <KPI label={<><GoogleIcon size={11}/>Investimento</>} value={fmt.brl(totalSpend)} delta={8.4} spark={MOCK.GOOGLE_PERF_30.map(d=>({v:d.spend}))}/>
        <KPI label={<><I.check className="ico"/>Conversões</>} value={totalConv} delta={14.2} spark={MOCK.GOOGLE_PERF_30.map(d=>({v:d.conversions}))}/>
        <KPI label={<><I.target className="ico"/>CPA</>} value={fmt.brl(cpa)} delta={-6.1} negative/>
        <KPI label={<><I.dollar className="ico"/>ROAS</>} value={roas.toFixed(2).replace('.', ',') + "x"} delta={12.0}/>
      </div>

      <div className="sp-20"/>

      {/* Performance + Type breakdown */}
      <div className="grid-3" style={{gridTemplateColumns:"2fr 1fr"}}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Performance diária</div>
              <div className="card-sub">Investimento × Conversões</div>
            </div>
            <div className="row">
              <span className="badge"><span className="dot" style={{background:"#4285F4"}}/>Invest.</span>
              <span className="badge"><span className="dot" style={{background:"#34A853"}}/>Conv.</span>
            </div>
          </div>
          <div style={{padding:"12px 8px 8px", height: 280}}>
            <RCg width="100%" height="100%">
              <ACg data={MOCK.GOOGLE_PERF_30} margin={{top:10, right:24, left:12, bottom:0}}>
                <defs>
                  <linearGradient id="gG" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#4285F4" stopOpacity={0.25}/>
                    <stop offset="100%" stopColor="#4285F4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CGg stroke="rgb(var(--border-soft))" vertical={false}/>
                <XAg dataKey="label" tickLine={false} axisLine={false} interval={Math.floor(MOCK.GOOGLE_PERF_30.length/8)}/>
                <YAg yAxisId="l" tickLine={false} axisLine={false} tickFormatter={v=>fmt.brlShort(v)} width={56}/>
                <YAg yAxisId="r" orientation="right" tickLine={false} axisLine={false} width={36}/>
                <TPg content={<TT/>}/>
                <Ag yAxisId="l" type="monotone" dataKey="spend" name="Investimento" stroke="#4285F4" strokeWidth={1.8} fill="url(#gG)" isAnimationActive={false}/>
                <Lg yAxisId="r" type="monotone" dataKey="conversions" name="Conversões" stroke="#34A853" strokeWidth={1.6} dot={false} isAnimationActive={false}/>
              </ACg>
            </RCg>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><div className="card-title">Por tipo de campanha</div><div className="card-sub">Share de investimento</div></div></div>
          <div className="card-pad">
            <div style={{height:160, position:"relative", display:"flex", justifyContent:"center"}}>
              <RCg width="100%" height="100%">
                <PCg>
                  <Pieg data={typeData} dataKey="spend" innerRadius={50} outerRadius={70} paddingAngle={2}>
                    {typeData.map((e,i)=><Cellg key={i} fill={e.color}/>)}
                  </Pieg>
                  <TPg content={<TT fmt={v=>fmt.brl(v)}/>}/>
                </PCg>
              </RCg>
              <div style={{position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center"}}>
                <div className="eyebrow" style={{fontSize:9}}>Total</div>
                <div className="num" style={{fontSize:15, fontWeight:600}}>{fmt.brlShort(totalSpend)}</div>
              </div>
            </div>
            <div className="sp-12"/>
            {typeData.map(t => (
              <div key={t.type} className="row" style={{justifyContent:"space-between", padding:"6px 0", fontSize:12}}>
                <div className="row" style={{gap:8}}>
                  <span style={{width:10, height:10, borderRadius:2, background:t.color}}/>
                  <span>{t.type}</span>
                </div>
                <span className="num muted">{((t.spend/totalSpend)*100).toFixed(0)}% • {fmt.brlShort(t.spend)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sp-20"/>

      {/* Campanhas + Insights */}
      <div className="grid-3" style={{gridTemplateColumns:"1fr 1fr 1fr 1fr"}}>
        <Mini3 label="Cliques (30d)" value={fmt.int(totalClicks)} delta={6.8}/>
        <Mini3 label="Impressões" value={(totalImpr/1000).toFixed(0) + "K"} delta={4.1}/>
        <Mini3 label="CTR médio" value={ctr.toFixed(2).replace('.', ',') + "%"} delta={2.4}/>
        <Mini3 label="CPC médio" value={fmt.brl(totalSpend/totalClicks)} delta={-1.8} negative/>
      </div>

      <div className="sp-20"/>

      <div className="card">
        <div className="card-head">
          <div><div className="card-title">Campanhas ativas</div><div className="card-sub">Ordenado por ROAS</div></div>
          <button className="btn btn-sm btn-ghost" onClick={onFilter}><I.filter/>Filtros</button>
        </div>
        <table className="tbl">
          <thead><tr>
            <th>Campanha</th><th>Tipo</th><th className="right">Invest.</th><th className="right">Cliques</th><th className="right">CTR</th><th className="right">CPC</th><th className="right">Conv.</th><th className="right">CPA</th><th className="right">ROAS</th><th className="right">QS</th><th>Status</th>
          </tr></thead>
          <tbody>
            {[...camps].sort((a,b)=>b.roas-a.roas).map(c=>(
              <tr key={c.id} style={{cursor:"pointer"}} onClick={()=>onOpen && onOpen(c.id)}>
                <td>
                  <div style={{fontWeight:500, fontSize:13, maxWidth:280, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{c.name}</div>
                  <div className="mono-id">{c.id}</div>
                </td>
                <td><CampTypeBadge type={c.type}/></td>
                <td className="right num">{fmt.brl(c.spend)}</td>
                <td className="right num">{fmt.int(c.clicks)}</td>
                <td className="right num">{c.ctr.toFixed(2).replace('.', ',')}%</td>
                <td className="right num">{fmt.brl(c.cpc)}</td>
                <td className="right num">{c.conversions}</td>
                <td className="right num">{c.cpa ? fmt.brl(c.cpa) : "—"}</td>
                <td className="right num"><span style={{color: c.roas >= 8 ? "rgb(var(--c-success))" : c.roas >= 4 ? "rgb(var(--text))" : "rgb(var(--c-warning))", fontWeight:600}}>{c.roas.toFixed(2).replace('.', ',')}x</span></td>
                <td className="right"><QualityScore v={c.qs}/></td>
                <td>{c.status==="active"?<Status s="ok" label="Ativa"/>:<Status s="warn" label="Atenção"/>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sp-20"/>

      {/* AI Insights */}
      <div className="card" style={{background:"linear-gradient(135deg, rgba(var(--accent-rgb),0.06), rgba(139,92,246,0.04))"}}>
        <div className="card-head">
          <div className="row" style={{gap:10}}>
            <span style={{width:36, height:36, borderRadius:8, background:"linear-gradient(135deg, rgb(var(--accent)), #8b5cf6)", display:"grid", placeItems:"center", color:"white"}}><I.sparkle/></span>
            <div><div className="card-title">Recomendações do Copilot para Google Ads</div><div className="card-sub">Baseado em 30 dias de dados</div></div>
          </div>
        </div>
        <div className="card-pad">
          <div className="grid-3">
            {[
              { c:"accent", t:"PMax 'Geral BR' tem o melhor ROAS (10,54x)", s:"Considere aumentar verba em 30% — o algoritmo ainda está explorando criativos" },
              { c:"warning", t:"YouTube 'Awareness' com CPA acima da média", s:"Pause ou refine targeting — apenas 2 conversões em 30 dias" },
              { c:"info", t:"7 search terms novos identificados", s:"3 com potencial para virarem keywords exatas, 1 candidato a negativa" },
            ].map((r, i) => (
              <div key={i} className="card" style={{padding:14, background:"rgb(var(--bg-card))"}}>
                <span className={`badge ${r.c}`}><span className="dot"/>{r.c==="accent"?"Oportunidade":r.c==="warning"?"Atenção":"Insight"}</span>
                <div style={{fontWeight:600, fontSize:13, marginTop:8, marginBottom:6}}>{r.t}</div>
                <div className="muted" style={{fontSize:12, lineHeight:1.5}}>{r.s}</div>
                <button className="btn btn-sm" style={{marginTop:10, width:"100%", justifyContent:"center"}} onClick={()=>{ const messages = [
                  "Verba aumentada em 30% na PMax 'Geral BR' — monitorando performance",
                  "YouTube 'Awareness' pausado — economia estimada de R$ 1.240/mês",
                  "3 keywords promovidas a exatas, 1 negativa adicionada"
                ]; toast(messages[i] || "Recomendação aplicada", "success"); }}>Aplicar →</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Mini3({ label, value, delta, negative }) {
  const dCls = delta == null ? "flat" : delta >= 0 ? (negative ? "dn" : "up") : (negative ? "up" : "dn");
  return (
    <div className="card" style={{padding:16}}>
      <div className="eyebrow">{label}</div>
      <div className="num" style={{fontSize:22, fontWeight:600, marginTop:4, letterSpacing:"-0.02em"}}>{value}</div>
      {delta != null && <div className={`delta ${dCls}`} style={{fontSize:11, marginTop:2}}>{delta>=0?"+":""}{delta.toFixed(1).replace('.', ',')}%</div>}
    </div>
  );
}

function CampTypeBadge({ type }) {
  const color = type==="Search"?"#4285F4":type==="PMax"?"#34A853":type==="Display"?"#FBBC04":type==="Shopping"?"#EA4335":"#9C27B0";
  return <span className="badge" style={{borderColor: color + "44", color, background: color + "15"}}>{type}</span>;
}

function QualityScore({ v }) {
  const c = v >= 8 ? "rgb(var(--c-success))" : v >= 6 ? "rgb(var(--c-warning))" : "rgb(var(--c-danger))";
  return (
    <div className="row" style={{justifyContent:"flex-end", gap:4}}>
      <div style={{display:"flex", gap:1}}>
        {[1,2,3,4,5,6,7,8,9,10].map(i=>(
          <div key={i} style={{width:2, height: i <= v ? 12 : 6, background: i <= v ? c : "rgb(var(--border-strong))", borderRadius:1}}/>
        ))}
      </div>
      <span className="num" style={{fontSize:12, fontWeight:600, color: c, minWidth:18}}>{v}</span>
    </div>
  );
}

/* ============================================
   GOOGLE ADS — KEYWORDS & SEARCH TERMS
   ============================================ */
function GoogleKeywords({ onNewKeyword, onNewNegative, onToast }) {
  const [tab, setTab] = React.useState("keywords");
  const kws = MOCK.KEYWORDS;
  const terms = MOCK.SEARCH_TERMS;
  const matchColor = (m) => m==="Exact" ? "accent" : m==="Phrase" ? "info" : "violet";
  const toast = (m, k) => onToast ? onToast(m, k) : (window.toast && window.toast(m, k||"success"));

  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow row" style={{gap:8, display:"inline-flex"}}><GoogleIcon size={12}/> Google Ads</div>
          <h1 className="page-title">Palavras-chave</h1>
          <div className="page-sub">Performance por keyword + search terms report + sugestões de negativas</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={()=>toast("CSV exportado — keywords-google-ads.csv")}><I.download/>CSV</button>
          <button className="btn btn-primary" onClick={onNewKeyword}><I.plus/>Nova keyword</button>
        </div>
      </div>

      <div className="kpi-row">
        <KPI label="Keywords ativas" value={kws.length}/>
        <KPI label="Search terms novos (7d)" value={terms.length}/>
        <KPI label="CTR médio" value={(kws.reduce((s,k)=>s+k.ctr,0)/kws.length).toFixed(2).replace('.', ',') + "%"} delta={1.4}/>
        <KPI label="Quality Score médio" value={(kws.reduce((s,k)=>s+k.qs,0)/kws.length).toFixed(1).replace('.', ',') + "/10"} delta={0.4}/>
      </div>

      <div className="sp-20"/>

      <div className="seg">
        <button className={tab==="keywords"?"on":""} onClick={()=>setTab("keywords")}>Keywords ({kws.length})</button>
        <button className={tab==="search"?"on":""} onClick={()=>setTab("search")}>Search Terms ({terms.length})</button>
        <button className={tab==="negative"?"on":""} onClick={()=>setTab("negative")}>Negativas</button>
      </div>

      <div className="sp-12"/>

      {tab === "keywords" && (
        <div className="card">
          <table className="tbl">
            <thead><tr>
              <th>Keyword</th><th>Match</th><th className="right">Impressões</th><th className="right">Cliques</th><th className="right">CTR</th><th className="right">CPC</th><th className="right">Conv.</th><th className="right">CPA</th><th className="right">Pos. méd.</th><th className="right">QS</th>
            </tr></thead>
            <tbody>
              {kws.map((k,i) => (
                <tr key={i}>
                  <td><span className="txt-mono" style={{fontSize:13, fontWeight:500}}>{k.kw}</span></td>
                  <td><span className={`badge ${matchColor(k.match)}`}>{k.match}</span></td>
                  <td className="right num">{fmt.int(k.impr)}</td>
                  <td className="right num">{fmt.int(k.clicks)}</td>
                  <td className="right num">{k.ctr.toFixed(2).replace('.', ',')}%</td>
                  <td className="right num">{fmt.brl(k.cpc)}</td>
                  <td className="right num">{k.conv}</td>
                  <td className="right num">{fmt.brl(k.cpa)}</td>
                  <td className="right num">{k.pos.toFixed(1).replace('.', ',')}</td>
                  <td className="right"><QualityScore v={k.qs}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "search" && (
        <div className="card">
          <div className="card-head">
            <div><div className="card-title">Search Terms Report</div><div className="card-sub">Termos que dispararam seus anúncios — adicione como exata ou negativa</div></div>
          </div>
          <table className="tbl">
            <thead><tr>
              <th>Termo pesquisado</th><th>Disparou keyword</th><th className="right">Cliques</th><th className="right">CPC</th><th className="right">Conv.</th><th>Sugestão</th><th className="right">Ações</th>
            </tr></thead>
            <tbody>
              {terms.map((t,i) => (
                <tr key={i}>
                  <td><span className="txt-mono" style={{fontSize:13}}>"{t.term}"</span></td>
                  <td className="muted" style={{fontSize:12}}>{t.kw}</td>
                  <td className="right num">{t.clicks}</td>
                  <td className="right num">{fmt.brl(t.cpc)}</td>
                  <td className="right num">{t.conv}</td>
                  <td>
                    {t.addedAs === "negative" && <span className="badge danger">Adicionar negativa</span>}
                    {t.addedAs === "exact" && <span className="badge accent">Promover a exata</span>}
                    {t.addedAs === null && t.conv > 0 && <span className="badge info">Performance boa</span>}
                    {t.addedAs === null && t.conv === 0 && <span className="badge">Observar</span>}
                  </td>
                  <td className="right">
                    <button className="btn btn-sm" onClick={()=>toast(`"${t.term}" promovido a Exata`)}>+ Exata</button>
                    <button className="btn btn-sm btn-danger" style={{marginLeft:4}} onClick={()=>toast(`"${t.term}" adicionado como negativa`)}>+ Negativa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "negative" && (
        <div className="card">
          <div className="card-head">
            <div><div className="card-title">Negativas</div><div className="card-sub">Termos bloqueados em todas as campanhas</div></div>
            <button className="btn btn-sm" onClick={onNewNegative}><I.plus/>Nova negativa</button>
          </div>
          <table className="tbl">
            <thead><tr><th>Termo negativo</th><th>Match</th><th>Adicionado em</th><th className="right">Cliques evitados (est.)</th><th className="right">Ações</th></tr></thead>
            <tbody>
              {[
                { t:"golpe", m:"Broad", d:"2026-04-12", saved:847 },
                { t:"é confiável", m:"Phrase", d:"2026-03-28", saved:412 },
                { t:"reclame aqui", m:"Phrase", d:"2026-03-15", saved:684 },
                { t:"grátis", m:"Broad", d:"2026-02-01", saved:2104 },
              ].map((n,i)=>(
                <tr key={i}>
                  <td><span className="txt-mono">{n.t}</span></td>
                  <td><span className={`badge ${matchColor(n.m)}`}>{n.m}</span></td>
                  <td className="muted" style={{fontSize:12}}>{new Date(n.d).toLocaleDateString('pt-BR')}</td>
                  <td className="right num">{fmt.int(n.saved)}</td>
                  <td className="right"><button className="btn btn-sm btn-ghost" onClick={()=>toast(`Negativa "${n.t}" removida`, "info")}><I.trash/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============================================
   GOOGLE ADS — Cliente (single dashboard)
   ============================================ */
function ClientGoogleAds({ client, onNewCampaign, onSync, onFilter, onApplyRec, onToast }) {
  return <GoogleAdsOverview role="client" onNewCampaign={onNewCampaign} onSync={onSync} onFilter={onFilter} onApplyRec={onApplyRec} onToast={onToast}/>;
}

Object.assign(window, { GoogleAdsOverview, GoogleKeywords, ClientGoogleAds, GoogleIcon });
