/* global React, ReactDOM, MOCK, BrandMark, I, fmt, AdminOverview, AdminBMs, AdminAccounts, AdminCampaigns, AdminClients, AdminReports, AdminSocial, AdminSettings, ClientDashboard, ClientCampaigns, ClientLeads, ClientCreatives, ClientSocial, ClientReports, ClientSettings, ClientSupport, ToastHost, NewAudienceModal, NewKeywordModal, NewNegativeModal, NewGoogleCampaignModal, SendReportsModal, ScheduleReportsModal, FilterDrawer, GoogleFilterDrawer, Confirm */

const { useState, useEffect, useMemo } = React;

/* ============================================
   LOGIN SCREEN
   ============================================ */
function Login({ onIn }) {
  const [role, setRole] = useState("admin");
  return (
    <div style={{minHeight:"100vh", background:"rgb(var(--bg))", display:"grid", gridTemplateColumns:"1fr 1fr"}}>
      {/* Left — hero */}
      <div style={{padding:"48px 56px", display:"flex", flexDirection:"column", justifyContent:"space-between", borderRight:"1px solid rgb(var(--border))", background:"rgb(var(--bg-elev))"}}>
        <div className="row" style={{gap:10}}>
          <BrandMark/>
          <div>
            <div style={{fontFamily:"var(--font-display)", fontSize:18, fontWeight:700, letterSpacing:"-0.02em"}}>Axon</div>
            <div style={{fontSize:10, color:"rgb(var(--text-3))", textTransform:"uppercase", letterSpacing:"0.08em"}}>by BKS Grow</div>
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{marginBottom:14}}>AI-powered ads intelligence</div>
          <h1 style={{fontSize:42, lineHeight:1.05, letterSpacing:"-0.035em", fontWeight:600, marginBottom:16}}>Toda sua mídia paga,<br/>com um cérebro só.</h1>
          <p className="muted" style={{fontSize:15, lineHeight:1.6, maxWidth:480, marginBottom:32}}>Meta, Google e Instagram orgânico em um painel — com IA que detecta oportunidades, anomalias e otimiza criativos automaticamente.</p>
          <div style={{display:"flex", flexDirection:"column", gap:14, maxWidth:420}}>
            {[
              {ic:<I.sparkle/>, t:"AI Copilot integrado", s:"Pergunte 'o que otimizar hoje?' e receba ações priorizadas"},
              {ic:<I.layers/>, t:"Multi-canal nativo", s:"Meta Ads + Google Ads + Instagram orgânico"},
              {ic:<I.send/>, t:"Relatórios automatizados", s:"PDFs entregues via WhatsApp todos os dias"}
            ].map((f,i) => (
              <div key={i} className="row" style={{gap:12, padding:"12px 14px", background:"rgb(var(--bg-card))", borderRadius:10, border:"1px solid rgb(var(--border-soft))"}}>
                <span style={{width:36, height:36, borderRadius:8, background:"rgba(var(--accent-rgb), 0.1)", color:"rgb(var(--accent))", display:"grid", placeItems:"center", flexShrink:0}}>{f.ic}</span>
                <div>
                  <div style={{fontSize:13, fontWeight:600}}>{f.t}</div>
                  <div className="muted" style={{fontSize:12}}>{f.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="row" style={{gap:24, color:"rgb(var(--text-3))", fontSize:12}}>
          <span>© 2026 Axon</span>
          <a className="lnk" href="#">Termos</a>
          <a className="lnk" href="#">Privacidade</a>
          <a className="lnk" href="#">Status</a>
        </div>
      </div>

      {/* Right — form */}
      <div style={{padding:"48px 56px", display:"flex", flexDirection:"column", justifyContent:"center"}}>
        <div style={{maxWidth:380, width:"100%", margin:"0 auto"}}>
          <h2 style={{fontSize:24, marginBottom:6, letterSpacing:"-0.025em"}}>Acessar painel</h2>
          <p className="muted" style={{fontSize:13, marginBottom:28}}>Entre com sua conta para continuar</p>

          <div className="seg" style={{width:"100%", marginBottom:20}}>
            <button className={role==="admin"?"on":""} onClick={()=>setRole("admin")} style={{flex:1, padding:"7px 10px"}}>Gestor / Admin</button>
            <button className={role==="client"?"on":""} onClick={()=>setRole("client")} style={{flex:1, padding:"7px 10px"}}>Cliente</button>
          </div>

          <div style={{display:"flex", flexDirection:"column", gap:14}}>
            <div className="field">
              <label>Email</label>
              <input className="input" defaultValue={role==="admin" ? "contato@backstagegrow.com.br" : "expansao@pontoacafe.com.br"}/>
            </div>
            <div className="field">
              <label>Senha</label>
              <input className="input" type="password" defaultValue="••••••••••••"/>
              <div className="row" style={{justifyContent:"space-between"}}>
                <label className="row" style={{gap:6, fontSize:12, color:"rgb(var(--text-2))", cursor:"pointer"}}><input type="checkbox" defaultChecked/>Lembrar de mim</label>
                <a className="lnk" href="#" style={{fontSize:12}}>Esqueci a senha</a>
              </div>
            </div>
            <button className="btn btn-primary" style={{justifyContent:"center", padding:"10px"}} onClick={()=>onIn(role)}>Entrar no painel</button>

            <div className="row" style={{gap:10, margin:"10px 0", color:"rgb(var(--text-3))", fontSize:11}}>
              <div style={{flex:1, height:1, background:"rgb(var(--border))"}}/>
              <span>OU</span>
              <div style={{flex:1, height:1, background:"rgb(var(--border))"}}/>
            </div>

            <button className="btn" style={{justifyContent:"center", padding:"10px"}}>
              <I.fb style={{color:"#1877f2"}}/>Entrar com Facebook
            </button>
          </div>

          <div style={{marginTop:24, textAlign:"center", fontSize:12, color:"rgb(var(--text-3))"}}>
            Novo cliente? <a className="lnk" href="#">Solicitar acesso</a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   NAVIGATION CONFIG
   ============================================ */
const NAV_ADMIN = [
  { id: "admin-overview", label: "Visão Geral", icon: <I.home/>, group: "Gestão" },
  { id: "admin-bms", label: "Business Managers", icon: <I.briefcase/>, count: MOCK.BMS.length, group: "Meta Ads" },
  { id: "admin-accounts", label: "Contas de Anúncio", icon: <I.layers/>, count: MOCK.AD_ACCOUNTS.length, group: "Meta Ads" },
  { id: "admin-campaigns", label: "Campanhas", icon: <I.trend/>, group: "Meta Ads" },
  { id: "admin-google", label: "Visão geral", icon: <I.home/>, group: "Google Ads", channelIcon: "google" },
  { id: "admin-google-kw", label: "Palavras-chave", icon: <I.search/>, group: "Google Ads", channelIcon: "google" },
  { id: "admin-clients", label: "Clientes", icon: <I.users/>, count: MOCK.CLIENTS.length, group: "Operação" },
  { id: "admin-audiences", label: "Audiências", icon: <I.target/>, badge: "IA", group: "Operação" },
  { id: "admin-reports", label: "Relatórios", icon: <I.file/>, group: "Operação" },
  { id: "admin-social", label: "Social Media", icon: <I.insta/>, group: "Operação" },
  { id: "admin-settings", label: "Configurações", icon: <I.cog/>, group: "Sistema" },
];

const NAV_CLIENT = [
  { id: "client-dashboard", label: "Dashboard", icon: <I.home/>, group: "Visão geral" },
  { id: "client-campaigns", label: "Meta Campanhas", icon: <I.trend/>, group: "Mídia paga", channelIcon: "meta" },
  { id: "client-google", label: "Google Ads", icon: <I.search/>, group: "Mídia paga", channelIcon: "google" },
  { id: "client-creatives", label: "Criativos", icon: <I.image/>, badge: "Novo", group: "Mídia paga" },
  { id: "client-leads", label: "Central de Leads", icon: <I.users/>, count: 6, group: "Aquisição" },
  { id: "client-social", label: "Instagram", icon: <I.insta/>, group: "Orgânico" },
  { id: "client-reports", label: "Relatórios", icon: <I.file/>, group: "Conta" },
  { id: "client-settings", label: "Configurações", icon: <I.cog/>, group: "Conta" },
  { id: "client-support", label: "Suporte", icon: <I.chat/>, group: "Conta" },
];

/* ============================================
   SIDEBAR
   ============================================ */
function Sidebar({ role, view, setView, onLogout }) {
  const items = role === "admin" ? NAV_ADMIN : NAV_CLIENT;
  // Group items preserving order
  const groups = [];
  for (const it of items) {
    let g = groups.find(x => x.name === it.group);
    if (!g) { g = { name: it.group, items: [] }; groups.push(g); }
    g.items.push(it);
  }
  return (
    <aside className="sidebar">
      <div className="brand">
        <BrandMark/>
        <div>
          <div className="brand-name">Axon</div>
          <div className="brand-tag">{role === "admin" ? "AGÊNCIA" : "CLIENTE"}</div>
        </div>
      </div>

      <div style={{flex:1, overflowY:"auto", marginRight:-12, paddingRight:12}}>
        {groups.map(g => (
          <React.Fragment key={g.name}>
            <div className="nav-section">{g.name}</div>
            {g.items.map(item => (
              <div key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} onClick={()=>setView(item.id)}>
                {item.channelIcon === "google" ? <GoogleIcon size={14}/> : item.channelIcon === "meta" ? <I.fb/> : item.icon}
                <span>{item.label}</span>
                {item.count != null && <span className="count">{item.count}</span>}
                {item.badge && <span className="count" style={{background:"rgba(var(--accent-rgb), 0.15)", color:"rgb(var(--accent))", borderColor:"rgba(var(--accent-rgb), 0.3)"}}>{item.badge}</span>}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      <div className="user">
        {role === "admin" ? (
          <>
            <span className="avatar">ES</span>
            <div className="user-info">
              <div className="user-name">Erick Sena</div>
              <div className="user-role">BKS Grow • Admin</div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onLogout} title="Sair"><I.out/></button>
          </>
        ) : (
          <>
            <span className="avatar">AB</span>
            <div className="user-info">
              <div className="user-name">Alpha Business</div>
              <div className="user-role">Plano Pro</div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onLogout} title="Sair"><I.out/></button>
          </>
        )}
      </div>
    </aside>
  );
}

/* ============================================
   TOPBAR
   ============================================ */
function Topbar({ role, setRole, view, theme, setTheme, onPalette, onNotifs, onCopilot, unread }) {
  const allItems = [...NAV_ADMIN, ...NAV_CLIENT];
  const current = allItems.find(i => i.id === view);
  return (
    <div className="topbar">
      <div className="crumbs">
        <span>{role === "admin" ? "Agência" : "Workspace do cliente"}</span>
        <span className="sep">/</span>
        <span className="cur">{current?.label || "Painel"}</span>
      </div>

      <div className="topbar-right">
        <button className="btn" onClick={onPalette} style={{paddingRight:8, gap:8}}>
          <I.search/><span style={{fontSize:12, color:"rgb(var(--text-3))"}}>Buscar…</span><span className="tt">⌘K</span>
        </button>
        <button className="btn btn-ghost btn-icon" title="Notificações" onClick={onNotifs} style={{position:"relative"}}>
          <I.bell/>
          {unread > 0 && <span style={{position:"absolute", top:4, right:4, minWidth:14, height:14, padding:"0 4px", borderRadius:7, background:"rgb(var(--c-danger))", color:"white", fontSize:9, fontWeight:600, display:"grid", placeItems:"center", fontFamily:"var(--font-mono)"}}>{unread}</span>}
        </button>

        <div className="role-switch">
          <button className={role==="admin"?"on":""} onClick={()=>setRole("admin")}><I.briefcase style={{width:13, height:13}}/>Admin</button>
          <button className={role==="client"?"on":""} onClick={()=>setRole("client")}><I.eye style={{width:13, height:13}}/>Cliente</button>
        </div>

        <button className="btn btn-ghost btn-icon" onClick={()=>setTheme(theme==="dark"?"light":"dark")} title="Alternar tema">
          {theme === "dark" ? <I.sun/> : <I.moon/>}
        </button>

        <button className="btn btn-primary" onClick={onCopilot} style={{background:"linear-gradient(135deg, rgb(var(--accent)), #8b5cf6)", color:"white"}}>
          <I.sparkle/>Copilot
        </button>
      </div>
    </div>
  );
}

/* ============================================
   AUDIT BANNER — Admin viewing client's perspective
   ============================================ */
function AuditBanner({ client, onBack }) {
  return (
    <div style={{
      background: "linear-gradient(90deg, rgba(234,179,8,0.08), rgba(234,179,8,0.04))",
      borderBottom: "1px solid rgba(234,179,8,0.25)",
      padding: "10px 24px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      fontSize: 12
    }}>
      <I.warn style={{color:"rgb(var(--c-warning))"}}/>
      <span><strong>Modo Auditoria:</strong> você está vendo o painel como <strong>{client?.name || "cliente"}</strong></span>
      <button className="btn btn-sm" style={{marginLeft:"auto"}} onClick={onBack}>← Voltar para Admin</button>
    </div>
  );
}

/* ============================================
   APP ROOT
   ============================================ */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "green",
  "density": "normal",
  "theme": "dark"
}/*EDITMODE-END*/;

const ACCENT_MAP = {
  green:  { rgb: "0 200 124",   hex: "#00C87C", fg: "#001a10" },
  blue:   { rgb: "59 130 246",  hex: "#3B82F6", fg: "#0a1426" },
  purple: { rgb: "139 92 246",  hex: "#8B5CF6", fg: "#1a0e2e" },
  amber:  { rgb: "245 158 11",  hex: "#F59E0B", fg: "#2a1a00" },
};

const DENSITY_MAP = { compact: 0.88, normal: 1, comfy: 1.12 };

function App() {
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState("admin");
  const [view, setView] = useState("admin-overview");
  const [client, setClient] = useState(MOCK.CLIENTS[0]);
  const [auditMode, setAuditMode] = useState(false);

  // Overlay state
  const [showPalette, setShowPalette] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewBM, setShowNewBM] = useState(false);
  const [relinkAccount, setRelinkAccount] = useState(null);
  const [leadDetail, setLeadDetail] = useState(null);
  const [campaignId, setCampaignId] = useState(null);
  const [showNewAudience, setShowNewAudience] = useState(false);
  const [showNewKeyword, setShowNewKeyword] = useState(false);
  const [showNewNegative, setShowNewNegative] = useState(false);
  const [showSendReports, setShowSendReports] = useState(false);
  const [showScheduleReports, setShowScheduleReports] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showGoogleFilter, setShowGoogleFilter] = useState(false);
  const [showNewGoogleCampaign, setShowNewGoogleCampaign] = useState(false);
  const [confirmDlg, setConfirmDlg] = useState(null);
  const [notifs, setNotifs] = useState(window.NOTIFS || []);

  const [t, setT] = window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, ()=>{}];

  // Apply tokens to :root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.theme || "dark");
    const a = ACCENT_MAP[t.accent] || ACCENT_MAP.green;
    document.documentElement.style.setProperty("--accent", a.rgb);
    document.documentElement.style.setProperty("--accent-rgb", a.rgb.replaceAll(' ', ', '));
    document.documentElement.style.setProperty("--density", DENSITY_MAP[t.density] || 1);
  }, [t.theme, t.accent, t.density]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowPalette(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // When role flips, jump to default view
  useEffect(() => {
    if (role === "admin" && !view.startsWith("admin-")) setView("admin-overview");
    if (role === "client" && !view.startsWith("client-")) setView("client-dashboard");
  }, [role]);

  if (!authed) {
    return <Login onIn={(r) => {
      setAuthed(true);
      setRole(r);
      setView(r === "admin" ? "admin-overview" : "client-dashboard");
      setShowOnboarding(true);
    }}/>;
  }

  const go = (id) => setView(id);
  const unreadNotifs = notifs.filter(n=>!n.read).length;

  const handleNotifAction = (n) => {
    setShowNotifs(false);
    if (!n.action) return;
    const a = n.action;
    if (a.target === "copilot") { setShowCopilot(true); }
    else if (a.target === "view" && a.view) { setCampaignId(null); setView(a.view); }
    else if (a.target === "campaign") { setCampaignId(null); setView("admin-campaigns"); }
    else if (a.target === "lead") { setView("client-leads"); setRole("client"); }
  };

  const renderView = () => {
    if (campaignId) return <CampaignDetail campaignId={campaignId} back={()=>setCampaignId(null)}/>;
    switch (view) {
      // Admin
      case "admin-overview":   return <AdminOverview go={go}/>;
      case "admin-bms":        return <AdminBMs onNew={()=>setShowNewBM(true)}/>;
      case "admin-accounts":   return <AdminAccounts onLink={setRelinkAccount}/>;
      case "admin-campaigns":  return <AdminCampaigns onOpen={setCampaignId} onFilter={()=>setShowFilterDrawer(true)}/>;
      case "admin-google":     return <GoogleAdsOverview onOpen={setCampaignId} role="admin" onNewCampaign={()=>setShowNewGoogleCampaign(true)} onFilter={()=>setShowGoogleFilter(true)} onToast={(m,k)=>window.toast && window.toast(m, k||"success")}/>;
      case "admin-google-kw":  return <GoogleKeywords onNewKeyword={()=>setShowNewKeyword(true)} onNewNegative={()=>setShowNewNegative(true)} onToast={(m,k)=>window.toast && window.toast(m, k||"success")}/>;
      case "admin-clients":    return <AdminClients onNew={()=>setShowNewClient(true)}/>;
      case "admin-audiences":  return <AdminAudiences onNew={()=>setShowNewAudience(true)} onConfirm={setConfirmDlg}/>;
      case "admin-reports":    return <AdminReports onSend={()=>setShowSendReports(true)} onSchedule={()=>setShowScheduleReports(true)} onToast={(m,k)=>window.toast && window.toast(m, k||"success")}/>;
      case "admin-social":     return <AdminSocial/>;
      case "admin-settings":   return <AdminSettings/>;
      // Client
      case "client-dashboard": return <ClientDashboard client={client} go={go}/>;
      case "client-campaigns": return <ClientCampaigns client={client} onOpen={setCampaignId}/>;
      case "client-google":    return <ClientGoogleAds client={client} onNewCampaign={()=>setShowNewGoogleCampaign(true)} onFilter={()=>setShowGoogleFilter(true)} onToast={(m,k)=>window.toast && window.toast(m, k||"success")}/>;
      case "client-leads":     return <ClientLeads client={client} onOpen={setLeadDetail}/>;
      case "client-creatives": return <ClientCreatives/>;
      case "client-social":    return <ClientSocial/>;
      case "client-reports":   return <ClientReports client={client}/>;
      case "client-settings":  return <ClientSettings client={client}/>;
      case "client-support":   return <ClientSupport/>;
      default: return <AdminOverview go={go}/>;
    }
  };

  return (
    <div className="app">
      <Sidebar role={role} view={view} setView={(v)=>{setCampaignId(null); setView(v);}} onLogout={()=>setAuthed(false)}/>
      <div className="main">
        {role === "client" && auditMode && <AuditBanner client={client} onBack={()=>{setRole("admin"); setAuditMode(false); setView("admin-overview");}}/>}
        <Topbar
          role={role}
          setRole={(r)=>{ if (r === "client") setAuditMode(true); else setAuditMode(false); setRole(r); }}
          view={view} theme={t.theme} setTheme={(v)=>setT('theme', v)}
          onPalette={()=>setShowPalette(true)}
          onNotifs={()=>setShowNotifs(true)}
          onCopilot={()=>setShowCopilot(true)}
          unread={unreadNotifs}
        />
        <div className="content">
          {renderView()}
        </div>
      </div>

      {/* Overlays */}
      <CommandPalette open={showPalette} onClose={()=>setShowPalette(false)} setView={(v)=>{setCampaignId(null); setView(v);}} setRole={setRole}/>
      <NotificationDrawer open={showNotifs} onClose={()=>setShowNotifs(false)} notifs={notifs} setNotifs={setNotifs} onAction={handleNotifAction}/>
      <CopilotDrawer open={showCopilot} onClose={()=>setShowCopilot(false)}/>
      <NewClientModal open={showNewClient} onClose={()=>setShowNewClient(false)}/>
      <NewBMModal open={showNewBM} onClose={()=>setShowNewBM(false)}/>
      <RelinkModal open={!!relinkAccount} onClose={()=>setRelinkAccount(null)} account={relinkAccount}/>
      <LeadDetailModal open={!!leadDetail} onClose={()=>setLeadDetail(null)} lead={leadDetail}/>
      <OnboardingTour open={showOnboarding} onClose={()=>setShowOnboarding(false)}/>

      {/* From interactions.jsx */}
      <NewAudienceModal open={showNewAudience} onClose={()=>setShowNewAudience(false)}/>
      <NewKeywordModal open={showNewKeyword} onClose={()=>setShowNewKeyword(false)}/>
      <NewNegativeModal open={showNewNegative} onClose={()=>setShowNewNegative(false)}/>
      <NewGoogleCampaignModal open={showNewGoogleCampaign} onClose={()=>setShowNewGoogleCampaign(false)}/>
      <SendReportsModal open={showSendReports} onClose={()=>setShowSendReports(false)}/>
      <ScheduleReportsModal open={showScheduleReports} onClose={()=>setShowScheduleReports(false)}/>
      <FilterDrawer open={showFilterDrawer} onClose={()=>setShowFilterDrawer(false)} onApply={()=>{}}/>
      <GoogleFilterDrawer open={showGoogleFilter} onClose={()=>setShowGoogleFilter(false)} onApply={()=>{}}/>
      <Confirm open={!!confirmDlg} onClose={()=>setConfirmDlg(null)} title={confirmDlg?.title} body={confirmDlg?.body} danger={confirmDlg?.danger} onConfirm={confirmDlg?.onConfirm}/>
      <ToastHost/>

      <AxonTweaks t={t} setT={setT}/>
    </div>
  );
}

/* ============================================
   TWEAKS PANEL
   ============================================ */
function AxonTweaks({ t, setT }) {
  const TweaksPanel = window.TweaksPanel;
  const TweakSection = window.TweakSection;
  const TweakColor = window.TweakColor;
  const TweakRadio = window.TweakRadio;
  const TweakSelect = window.TweakSelect;
  if (!TweaksPanel) return null;

  return (
    <TweaksPanel title="Axon · Tweaks">
      <TweakSection label="Cor de acento">
        <TweakColor
          value={ACCENT_MAP[t.accent]?.hex || "#00C87C"}
          onChange={(hex)=>{
            const k = Object.keys(ACCENT_MAP).find(k => ACCENT_MAP[k].hex === hex);
            if (k) setT('accent', k);
          }}
          options={["#00C87C", "#3B82F6", "#8B5CF6", "#F59E0B"]}
        />
      </TweakSection>
      <TweakSection label="Densidade">
        <TweakRadio
          value={t.density}
          onChange={(v)=>setT('density', v)}
          options={[{value:"compact", label:"Compacta"},{value:"normal", label:"Normal"},{value:"comfy", label:"Confortável"}]}
        />
      </TweakSection>
      <TweakSection label="Tema">
        <TweakRadio
          value={t.theme}
          onChange={(v)=>setT('theme', v)}
          options={[{value:"dark", label:"Escuro"},{value:"light", label:"Claro"}]}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
