/* global React, MOCK, fmt, I, Modal */
const { useState: u2S, useEffect: u2E } = React;

/* ============================================
   TOAST SYSTEM (global)
   ============================================ */
function ToastHost() {
  const [toasts, setToasts] = u2S([]);
  u2E(() => {
    window.toast = (msg, kind="info") => {
      const id = Date.now() + Math.random();
      setToasts(t => [...t, { id, msg, kind }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
    };
  }, []);
  return (
    <div style={{position:"fixed", bottom:20, left:20, zIndex:2000, display:"flex", flexDirection:"column", gap:8}}>
      {toasts.map(t => (
        <div key={t.id} className="card fadein" style={{
          padding:"12px 16px", display:"flex", gap:10, alignItems:"center", minWidth:280, maxWidth:420,
          background:"rgb(var(--bg-elev))",
          borderColor: t.kind==="success" ? "rgba(34,197,94,0.4)" : t.kind==="error" ? "rgba(239,68,68,0.4)" : "rgb(var(--border-strong))",
          boxShadow:"0 8px 24px rgba(0,0,0,0.25)"
        }}>
          <span style={{flexShrink:0, color: t.kind==="success" ? "rgb(var(--c-success))" : t.kind==="error" ? "rgb(var(--c-danger))" : "rgb(var(--c-info))"}}>
            {t.kind==="success" ? <I.check/> : t.kind==="error" ? <I.x/> : <I.bell/>}
          </span>
          <span style={{fontSize:13, flex:1}}>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================================
   NEW AUDIENCE MODAL
   ============================================ */
function NewAudienceModal({ open, onClose }) {
  const [type, setType] = u2S("custom");
  const [step, setStep] = u2S(1);

  const finish = () => {
    window.toast && window.toast("Audiência criada — sincronizando com Meta…", "success");
    setStep(1);
    onClose();
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="Nova audiência" sub={`Passo ${step} de 3`} width={620}
      footer={<>
        {step > 1 && <button className="btn" onClick={()=>setStep(step-1)}>← Voltar</button>}
        <button className="btn" onClick={onClose}>Cancelar</button>
        {step < 3
          ? <button className="btn btn-primary" onClick={()=>setStep(step+1)}>Próximo →</button>
          : <button className="btn btn-primary" onClick={finish}>Criar audiência</button>}
      </>}>
      <div style={{display:"flex", gap:6, marginBottom:24}}>
        {[1,2,3].map(s => <div key={s} style={{flex:1, height:4, borderRadius:2, background: s<=step ? "rgb(var(--accent))" : "rgb(var(--border))"}}/>)}
      </div>

      {step === 1 && <>
        <div className="card-title" style={{marginBottom:14}}>Escolha o tipo</div>
        <div style={{display:"flex", flexDirection:"column", gap:10}}>
          {[
            { id:"saved", t:"Pública salva", s:"Combinação de interesses, comportamentos e dados demográficos", ic:<I.users/> },
            { id:"custom", t:"Audiência customizada", s:"Pixel, lista de clientes, engajamento, app activity", ic:<I.target/> },
            { id:"lookalike", t:"Lookalike (público semelhante)", s:"Encontre pessoas parecidas com sua base", ic:<I.sparkle/> },
          ].map(o => (
            <label key={o.id} className="row" style={{padding:14, border:`1px solid ${type===o.id?"rgb(var(--accent))":"rgb(var(--border))"}`, borderRadius:10, cursor:"pointer", background: type===o.id ? "rgba(var(--accent-rgb),0.05)" : "transparent", gap:12}}>
              <input type="radio" name="type" checked={type===o.id} onChange={()=>setType(o.id)}/>
              <span style={{width:36, height:36, borderRadius:8, background:"rgba(var(--accent-rgb),0.1)", color:"rgb(var(--accent))", display:"grid", placeItems:"center"}}>{o.ic}</span>
              <div>
                <div style={{fontSize:13, fontWeight:600}}>{o.t}</div>
                <div className="muted" style={{fontSize:12}}>{o.s}</div>
              </div>
            </label>
          ))}
        </div>
      </>}

      {step === 2 && <>
        <div className="card-title" style={{marginBottom:14}}>Configurar</div>
        <div className="field" style={{marginBottom:14}}><label>Nome da audiência</label><input className="input" placeholder="Ex: Investidores SP 35-55"/></div>
        {type === "custom" && <>
          <div className="field" style={{marginBottom:14}}><label>Fonte</label>
            <select className="select"><option>Pixel — visitantes do site</option><option>Lista de clientes (CSV)</option><option>Engajamento no Instagram</option><option>Eventos do app</option></select>
          </div>
          <div className="grid-2" style={{gap:14}}>
            <div className="field"><label>Janela de retenção</label><select className="select"><option>30 dias</option><option>60 dias</option><option>90 dias</option><option>180 dias</option></select></div>
            <div className="field"><label>Evento</label><select className="select"><option>Lead</option><option>ViewContent</option><option>InitiateCheckout</option><option>Purchase</option></select></div>
          </div>
        </>}
        {type === "lookalike" && <>
          <div className="field" style={{marginBottom:14}}><label>Audiência de origem</label>
            <select className="select">{MOCK.CLIENTS.map(c=><option key={c.id}>Compradores — {c.name}</option>)}</select>
          </div>
          <div className="field"><label>% de similaridade</label>
            <div className="seg"><button>1%</button><button className="on">2%</button><button>3%</button><button>5%</button><button>10%</button></div>
            <div className="hint">Menor % = mais parecido com origem (menor alcance)</div>
          </div>
        </>}
        {type === "saved" && <>
          <div className="field" style={{marginBottom:14}}><label>Localização</label><input className="input" placeholder="Brasil"/></div>
          <div className="grid-2" style={{gap:14}}>
            <div className="field"><label>Idade mínima</label><input className="input" defaultValue="25" type="number"/></div>
            <div className="field"><label>Idade máxima</label><input className="input" defaultValue="55" type="number"/></div>
          </div>
          <div className="field" style={{marginTop:14}}><label>Interesses</label><input className="input" placeholder="Ex: investimentos, mercado financeiro, educação"/></div>
        </>}
      </>}

      {step === 3 && <>
        <div className="card-title" style={{marginBottom:14}}>Revisar</div>
        <div className="card" style={{padding:16, background:"rgb(var(--bg-card-2))", marginBottom:14}}>
          <Row3 k="Tipo" v={type==="saved"?"Pública salva":type==="custom"?"Customizada":"Lookalike"}/>
          <Row3 k="Tamanho estimado" v={type==="lookalike" ? "2,3M pessoas" : type==="custom" ? "18,4K pessoas" : "892K pessoas"}/>
          <Row3 k="Vincular a cliente" v={<select className="select" style={{maxWidth:200}}>{MOCK.CLIENTS.map(c=><option key={c.id}>{c.name}</option>)}</select>}/>
        </div>
        <div className="alert info">
          <I.sparkle className="ic"/>
          <span>Após criar, a audiência ficará disponível em ~30 minutos no Meta. Você verá uma notificação aqui quando estiver pronta.</span>
        </div>
      </>}
    </Modal>
  );
}

function Row3({ k, v }) {
  return <div className="row" style={{justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgb(var(--border-soft))", fontSize:13}}>
    <span className="muted">{k}</span>
    <span style={{fontWeight:500}}>{v}</span>
  </div>;
}

/* ============================================
   NEW KEYWORD MODAL
   ============================================ */
function NewKeywordModal({ open, onClose }) {
  const finish = () => { window.toast && window.toast("3 keywords adicionadas em 'Search — Termos Quentes'", "success"); onClose(); };
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="Adicionar palavras-chave" sub="Adicione novas keywords a uma campanha Search" width={580}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={finish}>Adicionar</button></>}>
      <div className="field" style={{marginBottom:14}}>
        <label>Campanha de destino</label>
        <select className="select">
          {MOCK.GOOGLE_CAMPAIGNS.filter(c=>c.type==="Search").map(c=><option key={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="field" style={{marginBottom:14}}>
        <label>Match type</label>
        <div className="seg" style={{width:"100%"}}>
          <button style={{flex:1}}>Broad</button>
          <button className="on" style={{flex:1}}>Phrase</button>
          <button style={{flex:1}}>Exact</button>
        </div>
      </div>
      <div className="field" style={{marginBottom:14}}>
        <label>Keywords (uma por linha)</label>
        <textarea className="input" rows={6} style={{resize:"vertical", fontFamily:"var(--font-mono)", fontSize:13}} placeholder="investir em ações&#10;melhor investimento 2026&#10;curso renda passiva"/>
        <div className="hint">3 keywords detectadas</div>
      </div>
      <div className="alert info">
        <I.sparkle className="ic"/>
        <div>
          <div style={{fontWeight:600, fontSize:13}}>Sugestões do Copilot baseadas no histórico:</div>
          <div className="row" style={{flexWrap:"wrap", gap:4, marginTop:6}}>
            {["onde investir 100 mil","renda fixa 2026","educação financeira"].map(s => <span key={s} className="badge" style={{cursor:"pointer", fontFamily:"var(--font-mono)"}}>+ {s}</span>)}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================
   NEW NEGATIVE KEYWORD MODAL
   ============================================ */
function NewNegativeModal({ open, onClose }) {
  const finish = () => { window.toast && window.toast("Negativa adicionada — economiza ~847 cliques/mês (est.)", "success"); onClose(); };
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="Nova negativa" sub="Bloqueie termos para todas as campanhas Search/PMax" width={500}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={finish}>Adicionar negativa</button></>}>
      <div className="field" style={{marginBottom:14}}>
        <label>Termo negativo</label>
        <input className="input" placeholder="ex: golpe"/>
      </div>
      <div className="field" style={{marginBottom:14}}>
        <label>Match type</label>
        <div className="seg" style={{width:"100%"}}>
          <button style={{flex:1}}>Broad</button>
          <button className="on" style={{flex:1}}>Phrase</button>
          <button style={{flex:1}}>Exact</button>
        </div>
      </div>
      <div className="field"><label>Aplicar a</label>
        <select className="select"><option>Todas as campanhas Search</option><option>Apenas esta campanha</option><option>Conjunto de campanhas</option></select>
      </div>
    </Modal>
  );
}

/* ============================================
   SEND REPORTS MODAL
   ============================================ */
function SendReportsModal({ open, onClose }) {
  const [selected, setSelected] = u2S(MOCK.CLIENTS.map(c=>c.id));
  const finish = () => { window.toast && window.toast(`Relatórios enviados para ${selected.length} clientes via WhatsApp`, "success"); onClose(); };
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="Disparar relatórios" sub="Envie agora para os clientes selecionados" width={580}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={finish}><I.send/>Enviar para {selected.length} clientes</button></>}>
      <div className="field" style={{marginBottom:14}}><label>Período</label>
        <select className="select"><option>Últimas 24h</option><option>Últimos 7 dias</option><option>Últimos 30 dias</option><option>Mês atual</option></select>
      </div>
      <div className="field" style={{marginBottom:14}}><label>Canal</label>
        <div className="seg" style={{width:"100%"}}>
          <button className="on" style={{flex:1}}><I.chat/>WhatsApp</button>
          <button style={{flex:1}}><I.mail/>Email</button>
          <button style={{flex:1}}>Ambos</button>
        </div>
      </div>
      <div className="field"><label>Clientes</label>
        <div className="card" style={{maxHeight:240, overflowY:"auto"}}>
          {MOCK.CLIENTS.map(c => (
            <label key={c.id} className="row" style={{padding:"10px 14px", borderBottom:"1px solid rgb(var(--border-soft))", gap:10, cursor:"pointer"}}>
              <input type="checkbox" checked={selected.includes(c.id)} onChange={()=>setSelected(s => s.includes(c.id) ? s.filter(x=>x!==c.id) : [...s, c.id])}/>
              <span className={`avt ${c.color}`}>{c.logo}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13, fontWeight:500}}>{c.name}</div>
                <div className="muted" style={{fontSize:11}}>{c.phone}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </Modal>
  );
}

/* ============================================
   SCHEDULE REPORTS MODAL
   ============================================ */
function ScheduleReportsModal({ open, onClose }) {
  const finish = () => { window.toast && window.toast("Agenda salva — próximo envio: amanhã às 08h00", "success"); onClose(); };
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="Agenda de envios automáticos" sub="Configure quando enviar relatórios automaticamente" width={560}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={finish}>Salvar agenda</button></>}>
      <div className="field" style={{marginBottom:14}}><label>Frequência</label>
        <div className="seg" style={{width:"100%"}}>
          <button style={{flex:1}}>Diário</button>
          <button className="on" style={{flex:1}}>Semanal</button>
          <button style={{flex:1}}>Mensal</button>
        </div>
      </div>
      <div className="grid-2" style={{gap:14, marginBottom:14}}>
        <div className="field"><label>Dia da semana</label><select className="select"><option>Segunda-feira</option><option>Terça</option><option>Quarta</option><option>Quinta</option><option>Sexta</option></select></div>
        <div className="field"><label>Horário</label><input className="input" defaultValue="08:00" type="time"/></div>
      </div>
      <div className="field" style={{marginBottom:14}}><label>Fuso horário</label>
        <select className="select"><option>America/Sao_Paulo (BRT)</option><option>America/Manaus</option></select>
      </div>
      <div className="field"><label>Aplicar a</label>
        <div className="seg" style={{width:"100%"}}>
          <button className="on" style={{flex:1}}>Todos os clientes</button>
          <button style={{flex:1}}>Selecionar clientes</button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================
   FILTER DRAWER (campaigns)
   ============================================ */
function FilterDrawer({ open, onClose, onApply }) {
  if (!open) return null;
  return (
    <div style={{position:"fixed", inset:0, zIndex:900}}>
      <div style={{position:"absolute", inset:0, background:"rgba(0,0,0,0.4)"}} onClick={onClose}/>
      <div className="card" style={{position:"absolute", right:0, top:0, bottom:0, width:360, borderRadius:0, display:"flex", flexDirection:"column"}}>
        <div className="card-head">
          <div><div className="card-title">Filtros</div><div className="card-sub">Refine resultados</div></div>
          <button className="btn btn-sm btn-ghost btn-icon" onClick={onClose}><I.x/></button>
        </div>
        <div style={{flex:1, overflowY:"auto", padding:18, display:"flex", flexDirection:"column", gap:18}}>
          <div className="field"><label>Status</label>
            <div style={{display:"flex", flexDirection:"column", gap:6, marginTop:4}}>
              <label className="row" style={{gap:8}}><input type="checkbox" defaultChecked/>Ativas</label>
              <label className="row" style={{gap:8}}><input type="checkbox"/>Pausadas</label>
              <label className="row" style={{gap:8}}><input type="checkbox" defaultChecked/>Em atenção</label>
            </div>
          </div>
          <div className="field"><label>Objetivo</label>
            <div style={{display:"flex", flexDirection:"column", gap:6, marginTop:4}}>
              <label className="row" style={{gap:8}}><input type="checkbox" defaultChecked/>Leads</label>
              <label className="row" style={{gap:8}}><input type="checkbox" defaultChecked/>Tráfego</label>
              <label className="row" style={{gap:8}}><input type="checkbox"/>Conversões</label>
              <label className="row" style={{gap:8}}><input type="checkbox"/>Awareness</label>
            </div>
          </div>
          <div className="field"><label>Investimento mínimo (30d)</label>
            <input className="input" placeholder="R$ 0,00"/>
          </div>
          <div className="field"><label>CPA máximo aceitável</label>
            <input className="input" placeholder="R$ 250,00"/>
          </div>
          <div className="field"><label>CTR mínimo</label>
            <input className="input" placeholder="1,5%"/>
          </div>
        </div>
        <div className="card-foot" style={{justifyContent:"space-between"}}>
          <button className="btn btn-ghost" onClick={onClose}>Limpar</button>
          <button className="btn btn-primary" onClick={()=>{onApply && onApply(); onClose(); window.toast && window.toast("3 filtros aplicados — 4 campanhas encontradas", "success");}}>Aplicar filtros</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   CONFIRM dialog (destructive)
   ============================================ */
function Confirm({ open, onClose, title, body, danger, onConfirm }) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title} width={440}
      footer={<>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} style={danger?{background:"rgb(var(--c-danger))", color:"white", borderColor:"rgb(var(--c-danger))"}:{}} onClick={()=>{onConfirm && onConfirm(); onClose();}}>
          {danger ? "Sim, continuar" : "Confirmar"}
        </button>
      </>}>
      <p className="muted" style={{fontSize:13, lineHeight:1.6}}>{body}</p>
    </Modal>
  );
}

/* ============================================
   NEW GOOGLE CAMPAIGN MODAL (3 steps)
   ============================================ */
function NewGoogleCampaignModal({ open, onClose }) {
  const [step, setStep] = u2S(1);
  const [type, setType] = u2S("Search");
  const [objective, setObjective] = u2S("conversions");
  u2E(() => { if (!open) setStep(1); }, [open]);

  const finish = () => {
    window.toast && window.toast(`Campanha ${type} criada — entrando em revisão Google Ads…`, "success");
    onClose();
  };

  if (!open) return null;
  const TYPES = [
    { id:"Search",   t:"Search",          s:"Anúncios de texto na busca", color:"#4285F4" },
    { id:"PMax",     t:"Performance Max", s:"Cobertura em todos os canais Google", color:"#34A853" },
    { id:"Display",  t:"Display",         s:"Banners na rede de display", color:"#FBBC04" },
    { id:"Shopping", t:"Shopping",        s:"Anúncios com produtos do feed", color:"#EA4335" },
    { id:"YouTube",  t:"YouTube",         s:"Vídeo in-stream, shorts e bumpers", color:"#9C27B0" },
  ];
  const OBJ = [
    { id:"conversions", t:"Conversões",  s:"Leads, vendas, formulários", ic:<I.target/> },
    { id:"traffic",     t:"Tráfego",     s:"Cliques no site", ic:<I.ext/> },
    { id:"awareness",   t:"Awareness",   s:"Impressões e alcance", ic:<I.eye/> },
    { id:"app",         t:"App installs",s:"Instalações de app", ic:<I.bolt/> },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Nova campanha Google Ads" sub={`Passo ${step} de 3`} width={680}
      footer={<>
        {step > 1 && <button className="btn" onClick={()=>setStep(step-1)}>← Voltar</button>}
        <button className="btn" onClick={onClose}>Cancelar</button>
        {step < 3
          ? <button className="btn btn-primary" onClick={()=>setStep(step+1)}>Próximo →</button>
          : <button className="btn btn-primary" onClick={finish}>Criar campanha</button>}
      </>}>
      <div style={{display:"flex", gap:6, marginBottom:24}}>
        {[1,2,3].map(s => <div key={s} style={{flex:1, height:4, borderRadius:2, background: s<=step ? "rgb(var(--accent))" : "rgb(var(--border))"}}/>)}
      </div>

      {step === 1 && <>
        <div className="card-title" style={{marginBottom:14}}>Tipo de campanha</div>
        <div className="grid-3" style={{gap:10}}>
          {TYPES.map(o => (
            <label key={o.id} style={{padding:14, border:`1px solid ${type===o.id?o.color:"rgb(var(--border))"}`, borderRadius:10, cursor:"pointer", background: type===o.id ? o.color + "10" : "transparent", display:"flex", flexDirection:"column", gap:8}}>
              <input type="radio" name="gtype" checked={type===o.id} onChange={()=>setType(o.id)} style={{display:"none"}}/>
              <span style={{width:32, height:32, borderRadius:6, background:o.color + "22", color:o.color, display:"grid", placeItems:"center", fontSize:11, fontWeight:700, fontFamily:"var(--font-mono)"}}>{o.t.charAt(0)}</span>
              <div>
                <div style={{fontSize:13, fontWeight:600}}>{o.t}</div>
                <div className="muted" style={{fontSize:11, lineHeight:1.4, marginTop:2}}>{o.s}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="sp-20"/>
        <div className="card-title" style={{marginBottom:14}}>Objetivo</div>
        <div className="grid-2" style={{gap:10}}>
          {OBJ.map(o => (
            <label key={o.id} className="row" style={{padding:12, border:`1px solid ${objective===o.id?"rgb(var(--accent))":"rgb(var(--border))"}`, borderRadius:10, cursor:"pointer", background: objective===o.id ? "rgba(var(--accent-rgb),0.05)" : "transparent", gap:10}}>
              <input type="radio" name="gobj" checked={objective===o.id} onChange={()=>setObjective(o.id)}/>
              <span style={{width:30, height:30, borderRadius:6, background:"rgba(var(--accent-rgb),0.1)", color:"rgb(var(--accent))", display:"grid", placeItems:"center"}}>{o.ic}</span>
              <div>
                <div style={{fontSize:13, fontWeight:600}}>{o.t}</div>
                <div className="muted" style={{fontSize:11}}>{o.s}</div>
              </div>
            </label>
          ))}
        </div>
      </>}

      {step === 2 && <>
        <div className="card-title" style={{marginBottom:14}}>Configurar</div>
        <div className="field" style={{marginBottom:14}}><label>Nome da campanha</label><input className="input" placeholder={`Ex: ${type} — ${objective === "conversions" ? "Leads BR" : "Tráfego BR"}`}/></div>
        <div className="grid-2" style={{gap:14, marginBottom:14}}>
          <div className="field"><label>Cliente</label>
            <select className="select">{MOCK.CLIENTS.map(c=><option key={c.id}>{c.name}</option>)}</select>
          </div>
          <div className="field"><label>Localização</label><input className="input" defaultValue="Brasil"/></div>
        </div>
        <div className="grid-2" style={{gap:14, marginBottom:14}}>
          <div className="field"><label>Orçamento diário</label><input className="input" placeholder="R$ 200,00"/></div>
          <div className="field"><label>Lance</label>
            <select className="select"><option>Maximizar conversões</option><option>tCPA — Target CPA</option><option>tROAS — Target ROAS</option><option>Maximizar cliques</option></select>
          </div>
        </div>
        {type === "Search" && (
          <div className="field"><label>Keywords iniciais</label>
            <textarea className="input" rows={4} style={{resize:"vertical", fontFamily:"var(--font-mono)", fontSize:12}} placeholder="curso de investimentos&#10;assessoria financeira&#10;onde investir"/>
          </div>
        )}
        {(type === "Shopping" || type === "PMax") && (
          <div className="field"><label>Feed de produtos (Merchant Center)</label>
            <select className="select"><option>Loja principal — 248 produtos</option><option>Catálogo BR — 412 produtos</option></select>
          </div>
        )}
        {type === "YouTube" && (
          <div className="field"><label>Formato</label>
            <div className="seg" style={{width:"100%"}}>
              <button className="on" style={{flex:1}}>In-stream</button>
              <button style={{flex:1}}>Shorts</button>
              <button style={{flex:1}}>Bumper</button>
            </div>
          </div>
        )}
      </>}

      {step === 3 && <>
        <div className="card-title" style={{marginBottom:14}}>Revisar</div>
        <div className="card" style={{padding:16, background:"rgb(var(--bg-card-2))", marginBottom:14}}>
          <Row3 k="Tipo" v={type}/>
          <Row3 k="Objetivo" v={OBJ.find(o=>o.id===objective)?.t}/>
          <Row3 k="Orçamento" v="R$ 200,00 / dia (~R$ 6.000/mês)"/>
          <Row3 k="Cliente" v={<select className="select" style={{maxWidth:200}}>{MOCK.CLIENTS.map(c=><option key={c.id}>{c.name}</option>)}</select>}/>
          <Row3 k="Estimativa de tráfego" v={<span className="num">{type==="Search" ? "1,2K-2,4K cliques/mês" : type==="PMax" ? "8K-15K cliques/mês" : "Variável"}</span>}/>
        </div>
        <div className="alert info">
          <I.sparkle className="ic"/>
          <span>A campanha entrará em revisão Google Ads (~24h) e começará a rodar automaticamente após aprovação.</span>
        </div>
      </>}
    </Modal>
  );
}

/* ============================================
   GOOGLE FILTER DRAWER
   ============================================ */
function GoogleFilterDrawer({ open, onClose, onApply }) {
  if (!open) return null;
  return (
    <div style={{position:"fixed", inset:0, zIndex:900}}>
      <div style={{position:"absolute", inset:0, background:"rgba(0,0,0,0.4)"}} onClick={onClose}/>
      <div className="card" style={{position:"absolute", right:0, top:0, bottom:0, width:360, borderRadius:0, display:"flex", flexDirection:"column"}}>
        <div className="card-head">
          <div><div className="card-title">Filtros Google Ads</div><div className="card-sub">Refine campanhas</div></div>
          <button className="btn btn-sm btn-ghost btn-icon" onClick={onClose}><I.x/></button>
        </div>
        <div style={{flex:1, overflowY:"auto", padding:18, display:"flex", flexDirection:"column", gap:18}}>
          <div className="field"><label>Tipo</label>
            <div style={{display:"flex", flexDirection:"column", gap:6, marginTop:4}}>
              {["Search","Performance Max","Display","Shopping","YouTube"].map(t=>(
                <label key={t} className="row" style={{gap:8}}><input type="checkbox" defaultChecked/>{t}</label>
              ))}
            </div>
          </div>
          <div className="field"><label>Status</label>
            <div style={{display:"flex", flexDirection:"column", gap:6, marginTop:4}}>
              <label className="row" style={{gap:8}}><input type="checkbox" defaultChecked/>Ativa</label>
              <label className="row" style={{gap:8}}><input type="checkbox"/>Pausada</label>
              <label className="row" style={{gap:8}}><input type="checkbox" defaultChecked/>Em atenção</label>
            </div>
          </div>
          <div className="field"><label>ROAS mínimo</label><input className="input" placeholder="4,0x"/></div>
          <div className="field"><label>CPA máximo</label><input className="input" placeholder="R$ 200,00"/></div>
          <div className="field"><label>Quality Score mínimo</label>
            <div className="seg" style={{width:"100%"}}>
              <button style={{flex:1}}>≥ 5</button>
              <button className="on" style={{flex:1}}>≥ 7</button>
              <button style={{flex:1}}>≥ 9</button>
            </div>
          </div>
        </div>
        <div className="card-foot" style={{justifyContent:"space-between"}}>
          <button className="btn btn-ghost" onClick={onClose}>Limpar</button>
          <button className="btn btn-primary" onClick={()=>{onApply && onApply(); onClose(); window.toast && window.toast("Filtros aplicados — exibindo 4 campanhas", "success");}}>Aplicar filtros</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ToastHost, NewAudienceModal, NewKeywordModal, NewNegativeModal, NewGoogleCampaignModal, SendReportsModal, ScheduleReportsModal, FilterDrawer, GoogleFilterDrawer, Confirm });
