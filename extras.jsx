/* global React, MOCK, fmt, I, KPI, Spark, Status, TT, Recharts */
const { useState: uS, useEffect: uE, useMemo: uM, useRef: uR } = React;
const { ResponsiveContainer: RCx, AreaChart: ACx, Area: Ax, LineChart: LCx, Line: Lx, BarChart: BCx, Bar: Bx, XAxis: XAx, YAxis: YAx, Tooltip: TPx, CartesianGrid: CGx } = Recharts;

/* ============================================
   COMMAND PALETTE (⌘K)
   ============================================ */
function CommandPalette({ open, onClose, setView, setRole }) {
  const [q, setQ] = uS("");
  uE(() => {
    if (!open) setQ("");
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const items = [
    { type: "Tela", label: "Visão Geral (Admin)", to: "admin-overview", role: "admin", ic: <I.home/> },
    { type: "Tela", label: "Business Managers", to: "admin-bms", role: "admin", ic: <I.briefcase/> },
    { type: "Tela", label: "Contas de Anúncio", to: "admin-accounts", role: "admin", ic: <I.layers/> },
    { type: "Tela", label: "Todas as Campanhas", to: "admin-campaigns", role: "admin", ic: <I.trend/> },
    { type: "Tela", label: "Clientes", to: "admin-clients", role: "admin", ic: <I.users/> },
    { type: "Tela", label: "Audiências", to: "admin-audiences", role: "admin", ic: <I.target/> },
    { type: "Tela", label: "Google Ads — Visão geral", to: "admin-google", role: "admin", ic: <I.target/> },
    { type: "Tela", label: "Google Ads — Palavras-chave", to: "admin-google-kw", role: "admin", ic: <I.search/> },
    { type: "Tela", label: "Relatórios", to: "admin-reports", role: "admin", ic: <I.file/> },
    { type: "Tela", label: "Dashboard (Cliente)", to: "client-dashboard", role: "client", ic: <I.home/> },
    { type: "Tela", label: "Google Ads (Cliente)", to: "client-google", role: "client", ic: <I.target/> },
    { type: "Tela", label: "Central de Leads", to: "client-leads", role: "client", ic: <I.users/> },
    { type: "Tela", label: "Criativos", to: "client-creatives", role: "client", ic: <I.image/> },
    { type: "Tela", label: "Instagram Analytics", to: "client-social", role: "client", ic: <I.insta/> },
    { type: "Ação", label: "Sincronizar Meta API", action: "sync", ic: <I.refresh/> },
    { type: "Ação", label: "Disparar relatórios agora", action: "send", ic: <I.send/> },
    { type: "Ação", label: "Abrir AI Copilot", action: "copilot", ic: <I.sparkle/> },
    { type: "Ação", label: "Alternar tema (claro/escuro)", action: "theme", ic: <I.sun/> },
    ...MOCK.CLIENTS.map(c => ({ type: "Cliente", label: c.name, to: "client-dashboard", role: "client", ic: <span className={`avt ${c.color}`} style={{width:18,height:18,fontSize:9}}>{c.logo}</span> })),
  ];

  const filtered = q ? items.filter(i => i.label.toLowerCase().includes(q.toLowerCase()) || i.type.toLowerCase().includes(q.toLowerCase())) : items;

  return (
    <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)", zIndex:1000, display:"grid", placeItems:"start center", paddingTop:"15vh"}} onClick={onClose}>
      <div className="card" style={{width:560, maxWidth:"90vw", maxHeight:"60vh", overflow:"hidden", boxShadow:"0 20px 40px rgba(0,0,0,0.4)", display:"flex", flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        <div className="row" style={{padding:"14px 18px", borderBottom:"1px solid rgb(var(--border-soft))", gap:10}}>
          <I.search style={{color:"rgb(var(--text-3))"}}/>
          <input
            autoFocus
            className="input"
            placeholder="Buscar telas, clientes, ações…"
            style={{border:"none", padding:0, fontSize:15, background:"transparent"}}
            value={q}
            onChange={e=>setQ(e.target.value)}
          />
          <span className="tt">ESC</span>
        </div>
        <div style={{overflowY:"auto", flex:1, padding:"6px 0"}}>
          {filtered.length === 0 && <div className="empty" style={{padding:"40px 20px"}}>Nada encontrado para "{q}"</div>}
          {filtered.map((it, i) => (
            <div key={i} className="row" style={{padding:"10px 18px", cursor:"pointer", gap:12}}
              onMouseEnter={e=>e.currentTarget.style.background="rgb(var(--bg-hover))"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              onClick={()=>{
                if (it.to) { if (it.role) setRole(it.role); setView(it.to); onClose(); }
                else if (it.action === "theme") { document.documentElement.setAttribute("data-theme", document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark"); onClose(); }
                else if (it.action === "copilot") { window.__openCopilot && window.__openCopilot(); onClose(); }
                else { onClose(); }
              }}>
              <span style={{color:"rgb(var(--text-3))"}}>{it.ic}</span>
              <span style={{flex:1, fontSize:13}}>{it.label}</span>
              <span className="tt">{it.type}</span>
            </div>
          ))}
        </div>
        <div className="row" style={{padding:"8px 16px", borderTop:"1px solid rgb(var(--border-soft))", color:"rgb(var(--text-3))", fontSize:11, gap:14, background:"rgb(var(--bg-card-2))"}}>
          <span>↑↓ navegar</span><span>↵ abrir</span><span>esc fechar</span><span style={{marginLeft:"auto"}}>⌘K em qualquer tela</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   NOTIFICATION CENTER (slide-out)
   ============================================ */
const INITIAL_NOTIFS = [
  { id: 1, kind: "alert",   t: "CPA disparou em GT House", s: "Campanha 'Vendas Q2' subiu 38% nas últimas 24h", when: "há 12 min", read: false, ic: <I.warn/>, color: "warning", action: { label: "Ver campanha", target: "campaign", view: "admin-campaigns" } },
  { id: 2, kind: "ai",      t: "Copilot sugere nova ação", s: "Pausar 'Stories — Promo 50%' (freq 4,2x, CPA 312)", when: "há 28 min", read: false, ic: <I.sparkle/>, color: "violet", action: { label: "Abrir Copilot", target: "copilot" } },
  { id: 3, kind: "lead",    t: "Novo lead quente — Alpha Business", s: "Lara Mendes • +55 71 99234-5511", when: "há 1h", read: false, ic: <I.users/>, color: "accent", action: { label: "Ver lead", target: "lead" } },
  { id: 4, kind: "report",  t: "Relatório enviado", s: "Resumo diário entregue para 4 clientes via WhatsApp", when: "há 3h", read: true, ic: <I.send/>, color: "success", action: { label: "Ver relatórios", target: "view", view: "admin-reports" } },
  { id: 5, kind: "sync",    t: "Sincronização concluída", s: "Meta API • 7 contas atualizadas", when: "há 4h", read: true, ic: <I.refresh/>, color: "info", action: { label: "Ver contas", target: "view", view: "admin-accounts" } },
  { id: 6, kind: "fatigue", t: "Criativo em fadiga", s: "'Imagem — Banner Black' com freq 3,4x — sugerimos pausa", when: "ontem", read: true, ic: <I.image/>, color: "warning", action: { label: "Ver criativos", target: "view", view: "client-creatives" } },
  { id: 7, kind: "budget",  t: "Pacing acima do esperado", s: "Alpha Business gastará 112% da verba até dia 31", when: "ontem", read: true, ic: <I.dollar/>, color: "warning", action: { label: "Ver dashboard", target: "view", view: "client-dashboard" } },
];
const NOTIFS = INITIAL_NOTIFS; // back-compat for command palette

function NotificationDrawer({ open, onClose, notifs, setNotifs, onAction }) {
  const [tab, setTab] = uS("all");
  if (!open) return null;
  const list = notifs || INITIAL_NOTIFS;
  const filtered = list.filter(n =>
    tab === "all" ? true :
    tab === "unread" ? !n.read :
    tab === "alert" ? n.color === "warning" || n.color === "danger" :
    tab === "ai" ? n.kind === "ai" : true
  );
  const unread = list.filter(n=>!n.read).length;
  const markAllRead = () => {
    setNotifs && setNotifs(list.map(n => ({...n, read: true})));
    window.toast && window.toast("Todas as notificações marcadas como lidas", "info");
  };
  const handleClick = (n) => {
    if (setNotifs && !n.read) setNotifs(list.map(x => x.id === n.id ? {...x, read:true} : x));
    if (n.action && onAction) onAction(n);
  };
  const removeOne = (e, n) => {
    e.stopPropagation();
    setNotifs && setNotifs(list.filter(x => x.id !== n.id));
    window.toast && window.toast("Notificação descartada", "info");
  };
  return (
    <div style={{position:"fixed", inset:0, zIndex:900}}>
      <div style={{position:"absolute", inset:0, background:"rgba(0,0,0,0.4)"}} onClick={onClose}/>
      <div className="card" style={{position:"absolute", right:0, top:0, bottom:0, width:420, borderRadius:0, borderRight:"none", borderTop:"none", borderBottom:"none", display:"flex", flexDirection:"column", animation:"slideIn 0.18s ease-out"}}>
        <div className="card-head">
          <div>
            <div className="card-title">Notificações</div>
            <div className="card-sub">{unread === 0 ? "Tudo em dia 🎉" : `${unread} não lida${unread===1?"":"s"}`}</div>
          </div>
          <div className="row">
            <button className="btn btn-sm btn-ghost" onClick={markAllRead} disabled={unread===0} style={{opacity: unread===0?0.4:1}}>Marcar todas</button>
            <button className="btn btn-sm btn-ghost btn-icon" onClick={onClose}><I.x/></button>
          </div>
        </div>
        <div className="seg" style={{margin:"12px 18px"}}>
          <button className={tab==="all"?"on":""} onClick={()=>setTab("all")}>Tudo</button>
          <button className={tab==="unread"?"on":""} onClick={()=>setTab("unread")}>Não lidas {unread>0 && <span className="count" style={{marginLeft:4}}>{unread}</span>}</button>
          <button className={tab==="alert"?"on":""} onClick={()=>setTab("alert")}>Alertas</button>
          <button className={tab==="ai"?"on":""} onClick={()=>setTab("ai")}>Copilot</button>
        </div>
        <div style={{flex:1, overflowY:"auto"}}>
          {filtered.length === 0 && (
            <div style={{padding:"60px 24px", textAlign:"center"}}>
              <div style={{width:48, height:48, margin:"0 auto 12px", borderRadius:12, background:"rgba(var(--accent-rgb),0.08)", color:"rgb(var(--accent))", display:"grid", placeItems:"center"}}><I.check/></div>
              <div style={{fontSize:13, fontWeight:600, marginBottom:4}}>Tudo em dia</div>
              <div className="muted" style={{fontSize:12}}>Nenhuma notificação{tab==="unread"?" não lida":tab==="alert"?" do tipo alerta":tab==="ai"?" do Copilot":""}.</div>
            </div>
          )}
          {filtered.map(n => (
            <div key={n.id} className="row notif-item" onClick={()=>handleClick(n)} style={{padding:"12px 18px", gap:12, borderBottom:"1px solid rgb(var(--border-soft))", alignItems:"flex-start", background: n.read ? "transparent" : "rgba(var(--accent-rgb), 0.02)", cursor:"pointer", position:"relative"}}>
              <span className={`badge ${n.color}`} style={{padding:"6px", borderRadius:8, flexShrink:0}}>{n.ic}</span>
              <div style={{flex:1, minWidth:0}}>
                <div className="row" style={{justifyContent:"space-between", marginBottom:2, gap:8}}>
                  <span style={{fontSize:13, fontWeight: n.read ? 500 : 600}}>{n.t}</span>
                  {!n.read && <span style={{width:8, height:8, borderRadius:"50%", background:"rgb(var(--accent))", flexShrink:0, marginTop:6}}/>}
                </div>
                <div className="muted" style={{fontSize:12, lineHeight:1.4}}>{n.s}</div>
                <div className="row" style={{justifyContent:"space-between", marginTop:6, gap:8}}>
                  <span className="mute2" style={{fontSize:11}}>{n.when}</span>
                  <div className="row" style={{gap:4}}>
                    {n.action && <button className="btn btn-sm" style={{padding:"2px 8px", fontSize:11}} onClick={(e)=>{e.stopPropagation(); handleClick(n);}}>{n.action.label} →</button>}
                    <button className="btn btn-sm btn-ghost btn-icon" onClick={(e)=>removeOne(e,n)} title="Descartar"><I.x/></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="card-foot" style={{padding:"10px 18px", justifyContent:"space-between"}}>
          <button className="btn btn-sm btn-ghost" onClick={()=>{setNotifs && setNotifs([]); window.toast && window.toast("Caixa de notificações limpa", "info");}}><I.trash/>Limpar tudo</button>
          <button className="btn btn-sm btn-ghost" onClick={()=>window.toast && window.toast("Preferências de notificação em breve", "info")}><I.cog/>Preferências</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   AI COPILOT DRAWER
   ============================================ */
const COPILOT_SUGGESTIONS = [
  "O que devo otimizar hoje?",
  "Qual cliente está performando melhor?",
  "Resuma a performance do Alpha Business",
  "Quais criativos estão em fadiga?",
  "Sugira textos para uma nova campanha de leads",
];

const COPILOT_CONVERSATION = [
  { role: "user", t: "O que devo otimizar hoje?" },
  { role: "ai", t: "Analisei seus 5 clientes nas últimas 24h. Aqui está o plano para hoje:", actions: [
    { type:"urgent", label:"Pausar criativo 'Stories — Promo 50%' (CPA R$ 312 • freq 4,2x)", impact:"Economiza ~R$ 180/dia" },
    { type:"opportunity", label:"Aumentar verba de 'Reels — Bastidores' em 30%", impact:"Lead barato (CPA R$ 77) com headroom" },
    { type:"watch", label:"Acompanhar GT House — CPA subiu 38% em 24h", impact:"Possível anomalia de mercado" },
  ]},
];

function CopilotDrawer({ open, onClose }) {
  const [msgs, setMsgs] = uS(COPILOT_CONVERSATION);
  const [input, setInput] = uS("");
  uE(() => { window.__openCopilot = ()=>{}; }, []);
  if (!open) return null;
  const send = () => {
    if (!input.trim()) return;
    setMsgs(m => [...m, { role:"user", t: input }, { role:"ai", t: "Processando sua solicitação...", typing:true }]);
    setInput("");
    setTimeout(() => {
      setMsgs(m => m.slice(0,-1).concat([{ role:"ai", t: "Pronto. Aqui está minha análise baseada nos últimos 30 dias de dados:", actions: [
        { type:"opportunity", label:"Há padrão: leads de 35-44 anos têm 2,1x mais conversão", impact:"Recomendo segmentar melhor" },
        { type:"watch", label:"Frequência média subindo: 2,3 → 2,8x em 7d", impact:"Considere variar criativos" },
      ]}]));
    }, 1200);
  };
  return (
    <div style={{position:"fixed", inset:0, zIndex:900}}>
      <div style={{position:"absolute", inset:0, background:"rgba(0,0,0,0.4)"}} onClick={onClose}/>
      <div className="card" style={{position:"absolute", right:0, top:0, bottom:0, width:480, borderRadius:0, display:"flex", flexDirection:"column"}}>
        <div className="card-head" style={{background:"linear-gradient(135deg, rgba(var(--accent-rgb),0.08), rgba(139,92,246,0.05))"}}>
          <div className="row" style={{gap:10}}>
            <span style={{width:36, height:36, borderRadius:9, background:"linear-gradient(135deg, rgb(var(--accent)), #8b5cf6)", display:"grid", placeItems:"center", color:"white"}}><I.sparkle/></span>
            <div>
              <div className="card-title">AI Copilot</div>
              <div className="card-sub">Powered by Claude • Analisando seus dados em tempo real</div>
            </div>
          </div>
          <button className="btn btn-sm btn-ghost btn-icon" onClick={onClose}><I.x/></button>
        </div>
        <div style={{flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:14}}>
          {msgs.map((m, i) => (
            <div key={i} style={{display:"flex", justifyContent: m.role==="user" ? "flex-end" : "flex-start"}}>
              <div style={{maxWidth:"86%", padding:"10px 14px", borderRadius:m.role==="user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                background: m.role==="user" ? "rgba(var(--accent-rgb), 0.12)" : "rgb(var(--bg-card-2))",
                border: m.role==="user" ? "1px solid rgba(var(--accent-rgb), 0.25)" : "1px solid rgb(var(--border-soft))",
                fontSize:13, lineHeight:1.55}}>
                {m.t}
                {m.actions && (
                  <div style={{marginTop:10, display:"flex", flexDirection:"column", gap:8}}>
                    {m.actions.map((a, j) => (
                      <div key={j} style={{padding:10, borderRadius:8, background:"rgb(var(--bg-card))", border:"1px solid rgb(var(--border))"}}>
                        <div className="row" style={{gap:8, marginBottom:4}}>
                          {a.type==="urgent" && <span className="badge danger"><span className="dot"/>Urgente</span>}
                          {a.type==="opportunity" && <span className="badge accent"><span className="dot"/>Oportunidade</span>}
                          {a.type==="watch" && <span className="badge warning"><span className="dot"/>Observar</span>}
                        </div>
                        <div style={{fontWeight:500, fontSize:13, marginBottom:2}}>{a.label}</div>
                        <div className="muted" style={{fontSize:11}}>{a.impact}</div>
                        <div className="row" style={{marginTop:8, gap:6}}>
                          <button className="btn btn-sm btn-primary" style={{padding:"3px 8px", fontSize:11}} onClick={()=>window.toast && window.toast(`✓ Ação aplicada: "${a.label.slice(0,40)}…"`, "success")}>Aplicar</button>
                          <button className="btn btn-sm" style={{padding:"3px 8px", fontSize:11}} onClick={()=>window.toast && window.toast("Abrindo detalhes da análise…", "info")}>Detalhes</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:14, borderTop:"1px solid rgb(var(--border-soft))"}}>
          <div className="row" style={{flexWrap:"wrap", gap:6, marginBottom:10}}>
            {COPILOT_SUGGESTIONS.slice(0,3).map((s, i) => (
              <button key={i} className="btn btn-sm" style={{fontSize:11}} onClick={()=>setInput(s)}>{s}</button>
            ))}
          </div>
          <div className="row" style={{gap:8}}>
            <input className="input" placeholder="Pergunte qualquer coisa sobre suas campanhas..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}/>
            <button className="btn btn-primary" onClick={send}><I.send/></button>
          </div>
          <div className="mute2" style={{fontSize:10, textAlign:"center", marginTop:8}}>Copilot pode cometer erros. Sempre revise antes de aplicar ações.</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   MODAL — generic shell
   ============================================ */
function Modal({ open, onClose, title, sub, children, footer, width=520 }) {
  if (!open) return null;
  return (
    <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(3px)", zIndex:1000, display:"grid", placeItems:"center", padding:20}} onClick={onClose}>
      <div className="card" style={{width, maxWidth:"100%", maxHeight:"86vh", display:"flex", flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        <div className="card-head">
          <div>
            <div className="card-title">{title}</div>
            {sub && <div className="card-sub">{sub}</div>}
          </div>
          <button className="btn btn-sm btn-ghost btn-icon" onClick={onClose}><I.x/></button>
        </div>
        <div style={{padding:20, overflowY:"auto", flex:1}}>{children}</div>
        {footer && <div className="card-foot" style={{padding:14, justifyContent:"flex-end", gap:8, display:"flex"}}>{footer}</div>}
      </div>
    </div>
  );
}

/* New Client modal */
function NewClientModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Cadastrar novo cliente" sub="Crie o acesso e vincule contas de anúncio"
      width={580}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={onClose}>Criar cliente</button></>}>
      <div className="grid-2" style={{gap:14}}>
        <div className="field"><label>Nome do cliente</label><input className="input" placeholder="Ex: Alpha Business Academy"/></div>
        <div className="field"><label>Email de acesso</label><input className="input" placeholder="cliente@empresa.com"/></div>
        <div className="field"><label>WhatsApp</label><input className="input" placeholder="+55 11 99999-9999"/></div>
        <div className="field"><label>Plano</label><select className="select"><option>Trial (14 dias)</option><option>Pro</option><option>Enterprise</option></select></div>
      </div>
      <div className="sp-20"/>
      <div className="field"><label>Vincular contas de anúncio</label>
        <div className="card" style={{maxHeight:200, overflowY:"auto"}}>
          {MOCK.AD_ACCOUNTS.slice(0,5).map(a => (
            <div key={a.id} className="row" style={{padding:"10px 14px", borderBottom:"1px solid rgb(var(--border-soft))", gap:10}}>
              <input type="checkbox" defaultChecked={!a.linked}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13, fontWeight:500}}>{a.name}</div>
                <div className="mono-id">{a.id}</div>
              </div>
              <span className="badge">{a.bm}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="sp-12"/>
      <div className="alert info">
        <I.bell className="ic"/>
        <span>O cliente receberá um email com link para criar a senha e acessar o painel.</span>
      </div>
    </Modal>
  );
}

/* New BM modal */
function NewBMModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Conectar novo Business Manager" sub="Adicione um BM à sua agência via Meta OAuth"
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={onClose}><I.link/>Conectar com Meta</button></>}>
      <div className="field" style={{marginBottom:16}}>
        <label>Nome interno (opcional)</label>
        <input className="input" placeholder="Ex: BKS Grow Holding"/>
        <div className="hint">Aparece apenas para sua equipe</div>
      </div>
      <div className="field" style={{marginBottom:16}}>
        <label>System User Token</label>
        <input className="input" placeholder="EAA..." type="password"/>
        <div className="hint">Gere em Meta Business Manager → Configurações → Usuários do Sistema</div>
      </div>
      <div className="alert warning">
        <I.shield className="ic"/>
        <span>Seu token é criptografado e armazenado com segurança. Nunca compartilhamos com terceiros.</span>
      </div>
    </Modal>
  );
}

/* Relink modal */
function RelinkModal({ open, onClose, account }) {
  if (!account) return null;
  return (
    <Modal open={open} onClose={onClose} title={`Vincular ${account.name}`} sub="Escolha o cliente que verá os dados desta conta no painel"
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={onClose}>Vincular</button></>}>
      <div className="field"><label>Cliente</label>
        <div style={{display:"flex", flexDirection:"column", gap:6}}>
          {MOCK.CLIENTS.map(c => (
            <label key={c.id} className="row" style={{padding:"10px 12px", border:"1px solid rgb(var(--border))", borderRadius:8, cursor:"pointer", gap:10}}>
              <input type="radio" name="client"/>
              <span className={`avt ${c.color}`}>{c.logo}</span>
              <div><div style={{fontSize:13, fontWeight:500}}>{c.name}</div><div className="muted" style={{fontSize:11}}>{c.email}</div></div>
              <span className="badge" style={{marginLeft:"auto"}}>{c.plan}</span>
            </label>
          ))}
        </div>
      </div>
    </Modal>
  );
}

/* ============================================
   LEAD DETAIL MODAL
   ============================================ */
function LeadDetailModal({ open, onClose, lead }) {
  if (!open || !lead) return null;
  const journey = [
    { t: "Capturado via formulário", d: lead.when, ic: <I.target/>, c: "accent" },
    { t: "Email de boas-vindas enviado", d: lead.when, ic: <I.mail/>, c: "info" },
    { t: "Lead atribuído ao gestor", d: lead.when, ic: <I.users/>, c: "violet" },
  ];
  return (
    <Modal open={open} onClose={onClose} width={680}
      title={lead.name} sub={`${lead.source} • capturado ${new Date(lead.when).toLocaleDateString('pt-BR')}`}
      footer={<><button className="btn">Marcar como atendido</button><button className="btn btn-primary"><I.chat/>Abrir WhatsApp</button></>}>
      <div className="row" style={{gap:16, marginBottom:20}}>
        <span className="avt lg" style={{width:64, height:64, fontSize:22, background:"linear-gradient(135deg, #3b82f6, #1d4ed8)", color:"white", border:"none"}}>{lead.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</span>
        <div style={{flex:1}}>
          <div className="row" style={{gap:8, marginBottom:4}}>
            <h2 style={{fontSize:20}}>{lead.name}</h2>
            {lead.score==="hot" && <span className="badge danger">Quente</span>}
            {lead.score==="warm" && <span className="badge warning">Morno</span>}
          </div>
          <div className="muted" style={{fontSize:13}}>{lead.email} • {lead.phone}</div>
        </div>
      </div>

      <div className="grid-3" style={{gap:12, marginBottom:20}}>
        <Box label="Custo desse lead" value="R$ 178,42" sub="Imputado da campanha"/>
        <Box label="Tempo desde captura" value="6 min" sub="Capturado às 21h31"/>
        <Box label="Score Axon AI" value="87/100" sub="Alta probabilidade"/>
      </div>

      <div className="card-title" style={{marginBottom:10}}>Jornada</div>
      <div style={{position:"relative", paddingLeft:30}}>
        <div style={{position:"absolute", left:13, top:8, bottom:8, width:1, background:"rgb(var(--border-strong))"}}/>
        {journey.map((j, i) => (
          <div key={i} className="row" style={{gap:12, marginBottom:14, position:"relative"}}>
            <span className={`badge ${j.c}`} style={{padding:6, borderRadius:"50%", position:"absolute", left:-30, top:0, width:28, height:28, display:"grid", placeItems:"center"}}>{j.ic}</span>
            <div>
              <div style={{fontSize:13, fontWeight:500}}>{j.t}</div>
              <div className="muted" style={{fontSize:11}}>{new Date(j.d).toLocaleString('pt-BR')}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="divider"/>
      <div className="card-title" style={{marginBottom:10}}>Campos do formulário</div>
      <div className="grid-2" style={{gap:8, fontSize:13}}>
        <Field2 k="Renda mensal" v="R$ 10–30k"/>
        <Field2 k="Cidade" v="Salvador, BA"/>
        <Field2 k="Já investiu antes?" v="Sim, em renda fixa"/>
        <Field2 k="Quanto deseja investir?" v="R$ 100k+"/>
      </div>
    </Modal>
  );
}

function Field2({ k, v }) {
  return <div style={{padding:"8px 12px", background:"rgb(var(--bg-card-2))", borderRadius:6}}>
    <div className="eyebrow" style={{fontSize:10, marginBottom:2}}>{k}</div>
    <div style={{fontSize:13, fontWeight:500}}>{v}</div>
  </div>;
}

function Box({ label, value, sub }) {
  return (
    <div className="card" style={{padding:14}}>
      <div className="eyebrow" style={{fontSize:10}}>{label}</div>
      <div className="num" style={{fontSize:20, fontWeight:600, marginTop:4}}>{value}</div>
      {sub && <div className="muted" style={{fontSize:11}}>{sub}</div>}
    </div>
  );
}

/* ============================================
   CAMPAIGN DETAIL PAGE
   ============================================ */
function CampaignDetail({ campaignId, back }) {
  const camp = MOCK.CAMPAIGNS.find(c=>c.id===campaignId) || MOCK.CAMPAIGNS[0];
  const series = MOCK.performance30;
  return (
    <div className="fadein">
      <div className="row" style={{marginBottom:14, gap:6, color:"rgb(var(--text-3))", fontSize:13, cursor:"pointer"}} onClick={back}>
        ← <span className="lnk">Voltar para Campanhas</span>
      </div>

      <div className="page-head">
        <div>
          <div className="eyebrow">Campanha</div>
          <h1 className="page-title">{camp.name}</h1>
          <div className="row" style={{gap:8, marginTop:6}}>
            <span className="mono-id">{camp.id}</span>
            {camp.status === "active" ? <Status s="ok" label="Ativa"/> : <Status s="warn" label="Atenção"/>}
            <span className="badge">{camp.account}</span>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn">Duplicar</button>
          <button className="btn btn-danger">Pausar</button>
          <button className="btn btn-primary">Editar no Meta</button>
        </div>
      </div>

      <div className="kpi-row" style={{gridTemplateColumns:"repeat(6, 1fr)"}}>
        <KPI label="Invest." value={fmt.brl(camp.spend)} delta={null}/>
        <KPI label="Leads" value={camp.leads} delta={null}/>
        <KPI label="CPA" value={camp.cpa?fmt.brl(camp.cpa):"—"} delta={null}/>
        <KPI label="CTR" value={camp.ctr?camp.ctr.toFixed(2).replace('.', ',')+"%":"—"} delta={null}/>
        <KPI label="Cliques" value={fmt.int(camp.clicks)} delta={null}/>
        <KPI label="Freq. média" value="2,4x" delta={null}/>
      </div>

      <div className="sp-20"/>

      <div className="card">
        <div className="card-head"><div><div className="card-title">Performance diária</div><div className="card-sub">Investimento × Leads</div></div></div>
        <div style={{padding:"12px 8px 12px", height:240}}>
          <RCx width="100%" height="100%">
            <ACx data={series} margin={{top:10,right:24,left:12,bottom:0}}>
              <defs><linearGradient id="gcd" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.25}/><stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0}/></linearGradient></defs>
              <CGx stroke="rgb(var(--border-soft))" vertical={false}/>
              <XAx dataKey="label" tickLine={false} axisLine={false} interval={Math.floor(series.length/8)}/>
              <YAx yAxisId="l" tickLine={false} axisLine={false} tickFormatter={v=>fmt.brlShort(v)} width={56}/>
              <YAx yAxisId="r" orientation="right" tickLine={false} axisLine={false} width={36}/>
              <TPx content={<TT/>}/>
              <Ax yAxisId="l" type="monotone" dataKey="spend" name="Investido" stroke="rgb(var(--accent))" strokeWidth={1.8} fill="url(#gcd)" isAnimationActive={false}/>
              <Lx yAxisId="r" type="monotone" dataKey="leads" name="Leads" stroke="rgb(var(--c-info))" strokeWidth={1.6} dot={false} isAnimationActive={false}/>
            </ACx>
          </RCx>
        </div>
      </div>

      <div className="sp-20"/>

      <div className="grid-3" style={{gridTemplateColumns:"1.5fr 1fr"}}>
        <div className="card">
          <div className="card-head"><div className="card-title">Conjuntos de anúncios</div></div>
          <table className="tbl">
            <thead><tr><th>Ad Set</th><th className="right">Invest.</th><th className="right">Leads</th><th className="right">CPA</th><th className="right">CTR</th><th>Status</th></tr></thead>
            <tbody>
              {["Lookalike 1% — SP","Interesse: Investimentos","Remarketing 30d","Custom audience — Lista"].map((n,i)=>(
                <tr key={i}>
                  <td><div style={{fontSize:13, fontWeight:500}}>{n}</div></td>
                  <td className="right num">{fmt.brl(camp.spend / 4 * (1 - i*0.1))}</td>
                  <td className="right num">{Math.max(0, Math.round(camp.leads/4 - i))}</td>
                  <td className="right num">{camp.cpa ? fmt.brl(camp.cpa * (1 + i*0.1)) : "—"}</td>
                  <td className="right num">{camp.ctr ? (camp.ctr * (1 - i*0.1)).toFixed(2).replace('.', ',') + "%" : "—"}</td>
                  <td><Status s={i===3?"warn":"ok"}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head" style={{background:"linear-gradient(135deg, rgba(var(--accent-rgb),0.08), rgba(139,92,246,0.05))"}}>
            <div className="row" style={{gap:8}}>
              <span style={{width:28, height:28, borderRadius:7, background:"linear-gradient(135deg, rgb(var(--accent)), #8b5cf6)", display:"grid", placeItems:"center", color:"white"}}><I.sparkle/></span>
              <div className="card-title">Recomendações do Copilot</div>
            </div>
          </div>
          <div className="card-pad" style={{display:"flex", flexDirection:"column", gap:10}}>
            {[
              { c:"warning", t:"Ad Set 'Custom audience' com CPA 15% acima da média", a:"Considere pausar ou refinar" },
              { c:"accent", t:"Criativo 04 está performando 2x melhor que os demais", a:"Aumentar verba do conjunto associado" },
              { c:"info", t:"Frequência subindo: 2,3 → 2,8x em 7 dias", a:"Variar criativos para evitar fadiga" }
            ].map((r,i)=>(
              <div key={i} className="card" style={{padding:10, background:"rgb(var(--bg-card-2))", borderColor:"rgb(var(--border-soft))"}}>
                <span className={`badge ${r.c}`} style={{marginBottom:6}}><span className="dot"/>Sugestão</span>
                <div style={{fontSize:12.5, fontWeight:500, lineHeight:1.4}}>{r.t}</div>
                <div className="muted" style={{fontSize:11, marginTop:4}}>{r.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   AUDIENCES (Admin)
   ============================================ */
const AUDIENCES = [
  { id:1, name:"Investidores SP 35-55", type:"Saved", size:892000, used:8, ctr:3.4, cpa:178, client:"alpha-biz", source:"Interesse + Geo" },
  { id:2, name:"Lookalike 1% — Leads Q1", type:"Lookalike", size:2_300_000, used:4, ctr:2.8, cpa:212, client:"alpha-biz", source:"1% BR" },
  { id:3, name:"Remarketing 30d — Site", type:"Custom", size:18_400, used:6, ctr:4.9, cpa:92, client:"viabr", source:"Pixel" },
  { id:4, name:"Engajadores Instagram 90d", type:"Custom", size:24_800, used:3, ctr:5.6, cpa:84, client:"alpha-biz", source:"Instagram" },
  { id:5, name:"Compradores anteriores — CRM", type:"Custom", size:3_200, used:2, ctr:6.2, cpa:62, client:"gthouse", source:"Lista CRM" },
  { id:6, name:"Lookalike 3% — Compradores", type:"Lookalike", size:5_200_000, used:5, ctr:2.1, cpa:248, client:"gthouse", source:"3% BR" },
];

function AdminAudiences({ onNew, onConfirm }) {
  const [filter, setFilter] = React.useState("all");
  const [openMenu, setOpenMenu] = React.useState(null);
  React.useEffect(() => {
    if (openMenu === null) return;
    const close = () => setOpenMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [openMenu]);
  const filtered = AUDIENCES.filter(a =>
    filter === "all" ? true :
    filter === "saved" ? a.type === "Saved" :
    filter === "lookalike" ? a.type === "Lookalike" :
    filter === "custom" ? a.type === "Custom" : true
  );
  const toast = (m, k="success") => window.toast && window.toast(m, k);
  return (
    <div className="fadein">
      <div className="page-head">
        <div>
          <div className="eyebrow">Públicos</div>
          <h1 className="page-title">Audiências</h1>
          <div className="page-sub">Públicos salvos, lookalikes e audiências customizadas</div>
        </div>
        <div className="page-actions">
          <div className="seg">
            <button className={filter==="all"?"on":""} onClick={()=>setFilter("all")}>Todas</button>
            <button className={filter==="saved"?"on":""} onClick={()=>setFilter("saved")}>Salvas</button>
            <button className={filter==="lookalike"?"on":""} onClick={()=>setFilter("lookalike")}>Lookalikes</button>
            <button className={filter==="custom"?"on":""} onClick={()=>setFilter("custom")}>Customizadas</button>
          </div>
          <button className="btn btn-primary" onClick={onNew}><I.plus/>Nova audiência</button>
        </div>
      </div>

      <div className="kpi-row">
        <KPI label="Total de audiências" value={AUDIENCES.length}/>
        <KPI label="Tamanho médio" value="1,3M" delta={null}/>
        <KPI label="Em uso ativo" value={AUDIENCES.filter(a=>a.used>0).length}/>
        <KPI label="CPA médio" value={fmt.brl(AUDIENCES.reduce((s,a)=>s+a.cpa,0)/AUDIENCES.length)}/>
      </div>

      <div className="sp-20"/>

      <div className="card">
        <table className="tbl">
          <thead><tr><th>Audiência</th><th>Tipo</th><th>Origem</th><th>Cliente</th><th className="right">Tamanho</th><th className="right">Usada em</th><th className="right">CTR</th><th className="right">CPA</th><th></th></tr></thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{textAlign:"center", padding:"40px 0", color:"rgb(var(--text-3))", fontSize:13}}>Nenhuma audiência neste filtro.</td></tr>
            )}
            {filtered.map(a => {
              const c = MOCK.CLIENTS.find(x=>x.id===a.client);
              return (
                <tr key={a.id}>
                  <td><div style={{fontSize:13, fontWeight:600}}>{a.name}</div></td>
                  <td><span className={`badge ${a.type==="Lookalike"?"violet":a.type==="Custom"?"info":""}`}>{a.type}</span></td>
                  <td className="muted" style={{fontSize:12}}>{a.source}</td>
                  <td>{c && <div className="row" style={{gap:8}}><span className={`avt ${c.color}`}>{c.logo}</span><span style={{fontSize:12}}>{c.name.split(' ')[0]}</span></div>}</td>
                  <td className="right num">{a.size > 1e6 ? (a.size/1e6).toFixed(1).replace('.', ',') + "M" : (a.size/1000).toFixed(1).replace('.', ',') + "K"}</td>
                  <td className="right num">{a.used} {a.used===1?"camp.":"camps."}</td>
                  <td className="right num">{a.ctr.toFixed(2).replace('.', ',')}%</td>
                  <td className="right num">{fmt.brl(a.cpa)}</td>
                  <td className="right" style={{position:"relative"}}>
                    <button className="btn btn-sm btn-ghost" onClick={(e)=>{e.stopPropagation(); setOpenMenu(openMenu===a.id?null:a.id);}}><I.more/></button>
                    {openMenu === a.id && (
                      <div className="card fadein" style={{position:"absolute", right:8, top:36, zIndex:50, minWidth:200, padding:6, boxShadow:"0 12px 28px rgba(0,0,0,0.35)"}} onClick={e=>e.stopPropagation()}>
                        {[
                          { ic:<I.eye/>, t:"Ver detalhes", on:()=>{ setOpenMenu(null); toast(`Detalhes de "${a.name}" em breve`, "info"); } },
                          { ic:<I.layers/>, t:"Duplicar", on:()=>{ setOpenMenu(null); toast(`Audiência "${a.name}" duplicada`); } },
                          { ic:<I.sparkle/>, t:"Criar Lookalike", on:()=>{ setOpenMenu(null); toast(`Lookalike 1% criado a partir de "${a.name}"`); } },
                          { ic:<I.refresh/>, t:"Sincronizar com Meta", on:()=>{ setOpenMenu(null); toast("Sincronização iniciada com Meta…", "info"); } },
                          { ic:<I.trash/>, t:"Excluir", danger:true, on:()=>{ setOpenMenu(null); onConfirm && onConfirm({ title:"Excluir audiência?", body:`A audiência "${a.name}" será removida do Meta. Esta ação não pode ser desfeita.`, danger:true, onConfirm:()=>toast(`"${a.name}" excluída`) }); } },
                        ].map((opt, i) => (
                          <button key={i} className="btn btn-ghost btn-sm" onClick={opt.on} style={{width:"100%", justifyContent:"flex-start", textAlign:"left", color: opt.danger ? "rgb(var(--c-danger))" : undefined}}>
                            {opt.ic}<span>{opt.t}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="sp-20"/>

      <div className="card" style={{background:"linear-gradient(135deg, rgba(var(--accent-rgb),0.06), rgba(139,92,246,0.04))"}}>
        <div className="card-head">
          <div className="row" style={{gap:10}}>
            <span style={{width:36, height:36, borderRadius:8, background:"linear-gradient(135deg, rgb(var(--accent)), #8b5cf6)", display:"grid", placeItems:"center", color:"white"}}><I.sparkle/></span>
            <div>
              <div className="card-title">Sugestões do Copilot</div>
              <div className="card-sub">Públicos que podem performar melhor</div>
            </div>
          </div>
        </div>
        <div className="card-pad">
          <div className="grid-3">
            {[
              { t:"Lookalike 2% — leads quentes 90d", s:"Base de 47 leads quentes (Score AI > 80)", cpaEst:"R$ 95-130" },
              { t:"Remarketing — visitou 'Investimento' não convertido", s:"Pixel custom event", cpaEst:"R$ 60-90" },
              { t:"Interesse: 'Acionistas Bovespa' + Geo SP/RJ", s:"Cruzamento de interesses premium", cpaEst:"R$ 140-180" }
            ].map((s,i)=>(
              <div key={i} className="card" style={{padding:14, background:"rgb(var(--bg-card))"}}>
                <div style={{fontSize:13, fontWeight:600, marginBottom:6}}>{s.t}</div>
                <div className="muted" style={{fontSize:12, marginBottom:10}}>{s.s}</div>
                <div className="row" style={{justifyContent:"space-between"}}>
                  <span className="eyebrow" style={{fontSize:10}}>CPA estimado</span>
                  <span className="num" style={{fontSize:13, fontWeight:600, color:"rgb(var(--accent))"}}>{s.cpaEst}</span>
                </div>
                <button className="btn btn-sm" style={{width:"100%", justifyContent:"center", marginTop:10}} onClick={()=>{ toast(`Sugestão "${s.t}" aplicada — criando audiência…`); onNew && onNew(); }}>Criar audiência</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   PACING & FORECAST (component for client dash)
   ============================================ */
function PacingCard({ client }) {
  const c = client || MOCK.CLIENTS[0];
  const dailyBudget = 1000;
  const monthBudget = dailyBudget * 30;
  const daysIn = 21;
  const daysLeft = 9;
  const spent = c.spend30 * (daysIn/30);
  const projected = (spent / daysIn) * 30;
  const pct = (projected/monthBudget) * 100;
  const status = pct > 110 ? "danger" : pct > 95 ? "warning" : "success";
  const data = MOCK.performance30.slice(0, daysIn).map((d, i) => ({
    label: d.label,
    spent: d.spend,
    projected: i >= daysIn - 1 ? d.spend : null,
    budget: dailyBudget,
  }));

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Pacing & forecast — verba do mês</div>
          <div className="card-sub">Como você está gastando vs. o planejado</div>
        </div>
        <span className={`badge ${status}`}><span className="dot"/>{pct.toFixed(0)}% do mês</span>
      </div>
      <div className="card-pad">
        <div className="grid-3" style={{marginBottom:18}}>
          <Box label="Gasto até hoje" value={fmt.brl(spent)} sub={`${daysIn} de 30 dias`}/>
          <Box label="Verba do mês" value={fmt.brl(monthBudget)} sub={`${fmt.brl(dailyBudget)}/dia ideal`}/>
          <Box label="Projeção final" value={fmt.brl(projected)} sub={pct > 100 ? `R$ ${(projected - monthBudget).toFixed(0)} acima` : "Dentro da verba"}/>
        </div>
        <div style={{height:160}}>
          <RCx width="100%" height="100%">
            <ACx data={data} margin={{top:10, right:20, left:0, bottom:0}}>
              <defs><linearGradient id="gpac" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.3}/><stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0}/></linearGradient></defs>
              <CGx stroke="rgb(var(--border-soft))" vertical={false}/>
              <XAx dataKey="label" tickLine={false} axisLine={false} interval={Math.floor(data.length/8)}/>
              <YAx tickLine={false} axisLine={false} tickFormatter={v=>fmt.brlShort(v)} width={56}/>
              <TPx content={<TT fmt={v=>fmt.brl(v)}/>}/>
              <Ax type="monotone" dataKey="spent" name="Gasto" stroke="rgb(var(--accent))" strokeWidth={1.8} fill="url(#gpac)" isAnimationActive={false}/>
              <Lx type="monotone" dataKey="budget" name="Verba ideal" stroke="rgb(var(--text-3))" strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false}/>
            </ACx>
          </RCx>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   AD HEALTH PANEL (component)
   ============================================ */
function AdHealthCard() {
  const metrics = [
    { l:"ROAS", v:"2,84x", target:"3x", pct: 95, good: true, sub:"Retorno por R$ investido" },
    { l:"Frequência média", v:"2,3x", target:"≤3x", pct: 77, good: true, sub:"Pessoas vendo seu anúncio" },
    { l:"CPM", v:"R$ 18,42", target:"≤R$ 25", pct: 74, good: true, sub:"Custo por mil impressões" },
    { l:"Taxa de conversão", v:"3,2%", target:"≥2%", pct: 64, good: true, sub:"Cliques → cadastros" },
    { l:"Quality Score médio", v:"7,8/10", target:"≥7", pct: 78, good: true, sub:"Relevância pra Meta" },
    { l:"Ad Fatigue Index", v:"Baixo", target:"Baixo", pct: 85, good: true, sub:"Risco de saturação" },
  ];
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Saúde dos anúncios</div>
          <div className="card-sub">KPIs de qualidade — atualizado em tempo real</div>
        </div>
        <span className="badge success"><span className="dot"/>Saudável</span>
      </div>
      <div style={{padding:"4px 0"}}>
        <table className="tbl">
          <thead><tr><th>Métrica</th><th>Valor</th><th>Alvo</th><th>Status</th></tr></thead>
          <tbody>
            {metrics.map(m => (
              <tr key={m.l}>
                <td>
                  <div style={{fontSize:13, fontWeight:500}}>{m.l}</div>
                  <div className="muted" style={{fontSize:11}}>{m.sub}</div>
                </td>
                <td className="num" style={{fontWeight:600, fontSize:14}}>{m.v}</td>
                <td className="num muted" style={{fontSize:13}}>{m.target}</td>
                <td style={{width:160}}>
                  <div className="row" style={{gap:10}}>
                    <div className="bar" style={{flex:1}}><span style={{width: m.pct + "%", background: m.good ? "rgb(var(--c-success))" : "rgb(var(--c-warning))"}}/></div>
                    <span className="num muted" style={{fontSize:11, minWidth:30, textAlign:"right"}}>{m.pct}%</span>
                  </div>
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
   ONBOARDING TOUR (first-visit overlay)
   ============================================ */
function OnboardingTour({ open, onClose }) {
  const [step, setStep] = uS(0);
  if (!open) return null;
  const steps = [
    { t:"Bem-vindo ao Axon", s:"Vamos te apresentar a plataforma em 3 passos rápidos", ic:<I.sparkle/> },
    { t:"Multi-canal nativo", s:"Conecte Meta Ads, Instagram orgânico e (em breve) Google Ads no mesmo painel", ic:<I.layers/> },
    { t:"AI Copilot integrado", s:"Pergunte qualquer coisa sobre suas campanhas. Receba ações priorizadas todos os dias.", ic:<I.bolt/> },
  ];
  return (
    <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)", zIndex:1500, display:"grid", placeItems:"center"}}>
      <div className="card" style={{width:480, padding:32, textAlign:"center"}}>
        <div style={{width:64, height:64, borderRadius:16, background:"linear-gradient(135deg, rgb(var(--accent)), #8b5cf6)", display:"grid", placeItems:"center", color:"white", margin:"0 auto 20px"}}>{steps[step].ic}</div>
        <h2 style={{fontSize:24, marginBottom:8}}>{steps[step].t}</h2>
        <p className="muted" style={{fontSize:14, marginBottom:24, lineHeight:1.5}}>{steps[step].s}</p>
        <div className="row" style={{justifyContent:"center", gap:6, marginBottom:20}}>
          {steps.map((_, i) => (
            <span key={i} style={{width: i===step?20:6, height:6, borderRadius:3, background: i===step?"rgb(var(--accent))":"rgb(var(--border-strong))", transition:"all 0.2s"}}/>
          ))}
        </div>
        <div className="row" style={{justifyContent:"space-between"}}>
          <button className="btn btn-ghost" onClick={onClose}>Pular tour</button>
          <button className="btn btn-primary" onClick={()=>step<2?setStep(step+1):onClose()}>{step<2 ? "Próximo →" : "Começar"}</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   FLOATING ACTIONS (Copilot + Search shortcuts)
   ============================================ */
function FloatingHelpers({ onCopilot, onPalette }) {
  return (
    <div style={{position:"fixed", bottom:24, right:24, display:"flex", flexDirection:"column", gap:10, zIndex:50}}>
      <button onClick={onPalette} className="btn" style={{padding:"10px 14px", borderRadius:999, boxShadow:"0 4px 12px rgba(0,0,0,0.15)", fontSize:12}}>
        <I.search/><span style={{marginLeft:4}}>Buscar</span><span className="tt" style={{marginLeft:6}}>⌘K</span>
      </button>
      <button onClick={onCopilot} className="btn btn-primary" style={{padding:"12px 16px", borderRadius:999, boxShadow:"0 6px 20px rgba(var(--accent-rgb), 0.35)", fontSize:13, background:"linear-gradient(135deg, rgb(var(--accent)), #8b5cf6)", color:"white"}}>
        <I.sparkle/><span>AI Copilot</span>
      </button>
    </div>
  );
}

Object.assign(window, { CommandPalette, NotificationDrawer, CopilotDrawer, NewClientModal, NewBMModal, RelinkModal, LeadDetailModal, CampaignDetail, AdminAudiences, PacingCard, AdHealthCard, OnboardingTour, FloatingHelpers, NOTIFS });

/* Animations */
const _styleId = "axon-slidein";
if (!document.getElementById(_styleId)) {
  const s = document.createElement("style");
  s.id = _styleId;
  s.textContent = `@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`;
  document.head.appendChild(s);
}
