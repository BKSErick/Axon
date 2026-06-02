/* ============================================
   Axon — Extras (Modals + ToastHost + Confirm + CampaignDetail)
   Maioria são stubs funcionais — adapte conforme necessidade.
   ============================================ */
import React, { useState, useEffect } from 'react';
import { I } from './icons';
import { fmt } from './common';

/* -------- Modal shell -------- */
function Modal({ open, onClose, title, children, footer, width = 480 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 900 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: width, background: 'rgb(var(--bg-elev))', borderRadius: 14, border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgb(var(--border-soft))' }}>
          <h2 style={{ fontSize: 16 }}>{title}</h2>
          <button className="btn btn-ghost btn-icon" style={{ marginLeft: 'auto' }} onClick={onClose}><I.x /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
        {footer && <div style={{ padding: '14px 20px', borderTop: '1px solid rgb(var(--border-soft))', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>{footer}</div>}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="field" style={{ marginBottom: 14 }}>
      <label>{label}</label>
      {children}
    </div>
  );
}

/* -------- Confirm -------- */
export function Confirm({ open, onClose, title, body, danger, onConfirm }) {
  return (
    <Modal open={open} onClose={onClose} title={title || 'Confirmar'} width={420}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={() => { onConfirm?.(); onClose(); }}>Confirmar</button>
        </>
      }
    >
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{body}</p>
    </Modal>
  );
}

/* -------- ToastHost -------- */
let _push = null;
export function toast(message, kind = 'info') {
  _push?.({ id: Date.now() + Math.random(), message, kind });
}
if (typeof window !== 'undefined') window.toast = toast;

export function ToastHost() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    _push = (t) => {
      setItems(prev => [...prev, t]);
      setTimeout(() => setItems(prev => prev.filter(x => x.id !== t.id)), 3500);
    };
    return () => { _push = null; };
  }, []);
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1100 }}>
      {items.map(t => (
        <div key={t.id} style={{ background: 'rgb(var(--bg-elev))', border: '1px solid rgb(var(--border))', borderRadius: 10, padding: '10px 14px', fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8, minWidth: 240 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.kind === 'success' ? 'rgb(var(--c-success))' : t.kind === 'error' ? 'rgb(var(--c-danger))' : 'rgb(var(--accent))' }} />
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* -------- Campaign Detail (placeholder) -------- */
export function CampaignDetail({ campaignId, back }) {
  return (
    <>
      <div className="row" style={{ marginBottom: 18 }}>
        <button className="btn btn-sm" onClick={back}>← Voltar</button>
      </div>
      <div className="card">
        <div style={{ padding: 24 }}>
          <h1>Campanha {campaignId}</h1>
          <p className="muted">Detalhe de campanha — TODO: portar do legacy <code>AdminAllCampaigns</code> ou criar visualização Axon dedicada.</p>
        </div>
      </div>
    </>
  );
}

/* -------- Lead Detail Modal -------- */
export function LeadDetailModal({ open, onClose, lead }) {
  if (!lead) return null;
  return (
    <Modal open={open} onClose={onClose} title={lead.name || 'Lead'} width={520}>
      <div className="row" style={{ gap: 12, marginBottom: 16 }}>
        <span className="avatar avt-1" style={{ width: 44, height: 44, fontSize: 14 }}>{(lead.name || '?')[0]}</span>
        <div>
          <div style={{ fontWeight: 600 }}>{lead.name}</div>
          <div className="muted" style={{ fontSize: 12 }}>{lead.email}</div>
        </div>
      </div>
      <Field label="Telefone"><div className="txt-mono" style={{ fontSize: 13 }}>{lead.phone}</div></Field>
      <Field label="Origem"><span className="tag">{lead.source}</span></Field>
      <Field label="Data"><div style={{ fontSize: 13 }}>{lead.when ? new Date(lead.when).toLocaleString('pt-BR') : '—'}</div></Field>
    </Modal>
  );
}

/* -------- New Client / BM / Audience / Keyword / Negative / GoogleCampaign / Send Reports / Schedule Reports -------- */
export function NewClientModal({ open, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', plan: 'Pro' });
  return (
    <Modal open={open} onClose={onClose} title="Novo cliente"
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={() => { toast('Cliente criado', 'success'); onClose(); }}>Criar</button></>}>
      <Field label="Nome"><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Email"><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
      <Field label="Telefone"><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
      <Field label="Plano">
        <select className="input" value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}>
          <option>Trial</option><option>Pro</option><option>Enterprise</option>
        </select>
      </Field>
    </Modal>
  );
}

export function NewBMModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Conectar Business Manager"
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={() => { toast('Aguardando token Meta…'); onClose(); }}>Continuar</button></>}>
      <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>Conecte uma Business Manager do Meta com um System User Token.</p>
      <Field label="Nome interno"><input className="input" placeholder="ex: Agência Principal" /></Field>
      <Field label="Meta BM ID"><input className="input" placeholder="ex: 930684123456789" /></Field>
      <Field label="System User Token"><input className="input" type="password" placeholder="EAA…" /></Field>
    </Modal>
  );
}

export function RelinkModal({ open, onClose, account }) {
  return (
    <Modal open={open} onClose={onClose} title="Vincular a um cliente"
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={() => { toast('Conta vinculada', 'success'); onClose(); }}>Vincular</button></>}>
      {account && <p className="muted" style={{ fontSize: 13 }}>Conta: <strong>{account.name}</strong></p>}
      <Field label="Cliente"><select className="input"><option>Selecione um cliente…</option></select></Field>
    </Modal>
  );
}

export function NewAudienceModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Nova audiência" footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={() => { toast('Audiência criada', 'success'); onClose(); }}>Criar</button></>}>
      <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>Audiências geradas por IA com base em leads, engajamento ou comportamento.</p>
      <Field label="Nome"><input className="input" placeholder="ex: Leads quentes 30d" /></Field>
      <Field label="Origem">
        <select className="input">
          <option>Leads (formulários)</option>
          <option>Engajamento Instagram</option>
          <option>Lookalike de compradores</option>
          <option>Custom (upload CSV)</option>
        </select>
      </Field>
    </Modal>
  );
}

export function NewKeywordModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Nova palavra-chave" footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={() => { toast('Keyword adicionada'); onClose(); }}>Adicionar</button></>}>
      <Field label="Termo"><input className="input" placeholder="agência de marketing digital" /></Field>
      <Field label="Tipo de match"><select className="input"><option>Ampla</option><option>Frase</option><option>Exata</option></select></Field>
    </Modal>
  );
}

export function NewNegativeModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Nova negativa" footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={() => { toast('Negativa adicionada'); onClose(); }}>Adicionar</button></>}>
      <Field label="Termo"><input className="input" placeholder="grátis" /></Field>
      <Field label="Lista"><select className="input"><option>Lista global</option><option>Conta específica</option></select></Field>
    </Modal>
  );
}

export function NewGoogleCampaignModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Nova campanha Google" footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={() => { toast('Campanha criada (mock)'); onClose(); }}>Criar</button></>}>
      <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>Mock — integração Google Ads API ainda pendente.</p>
      <Field label="Nome"><input className="input" placeholder="[SEARCH] Brand Defense" /></Field>
      <Field label="Tipo"><select className="input"><option>Search</option><option>Performance Max</option><option>Display</option><option>Video</option></select></Field>
      <Field label="Orçamento diário (R$)"><input className="input" type="number" placeholder="100" /></Field>
    </Modal>
  );
}

export function SendReportsModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Enviar relatórios"
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={() => { toast('Relatórios na fila', 'success'); onClose(); }}>Enviar</button></>}>
      <Field label="Período"><select className="input"><option>Últimas 24h</option><option>Últimos 7 dias</option><option>Últimos 30 dias</option></select></Field>
      <Field label="Clientes"><select className="input"><option>Todos os ativos</option><option>Selecionar específicos</option></select></Field>
    </Modal>
  );
}

export function ScheduleReportsModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Agendar envio recorrente"
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={() => { toast('Agendamento salvo', 'success'); onClose(); }}>Salvar</button></>}>
      <Field label="Frequência"><select className="input"><option>Diário</option><option>Semanal</option><option>Mensal</option></select></Field>
      <Field label="Horário"><input className="input" type="time" defaultValue="09:00" /></Field>
    </Modal>
  );
}

/* -------- Filter Drawers -------- */
function Drawer({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 900 }}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 380, background: 'rgb(var(--bg-elev))', borderLeft: '1px solid rgb(var(--border))', display: 'flex', flexDirection: 'column' }}>
        <div className="row" style={{ padding: '16px 18px', borderBottom: '1px solid rgb(var(--border-soft))' }}>
          <I.filter />
          <div style={{ fontWeight: 600, fontSize: 15, marginLeft: 8 }}>{title}</div>
          <button className="btn btn-ghost btn-icon" style={{ marginLeft: 'auto' }} onClick={onClose}><I.x /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>{children}</div>
        <div style={{ padding: 14, borderTop: '1px solid rgb(var(--border-soft))', display: 'flex', gap: 8 }}>
          <button className="btn" style={{ flex: 1 }} onClick={onClose}>Limpar</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onClose}>Aplicar</button>
        </div>
      </div>
    </div>
  );
}

export function FilterDrawer({ open, onClose }) {
  return (
    <Drawer open={open} onClose={onClose} title="Filtros">
      <Field label="Status"><select className="input"><option>Todas</option><option>Ativas</option><option>Pausadas</option></select></Field>
      <Field label="Conta de anúncio"><select className="input"><option>Todas</option></select></Field>
      <Field label="Cliente"><select className="input"><option>Todos</option></select></Field>
      <Field label="Período"><select className="input"><option>Últimos 30 dias</option><option>Últimos 7 dias</option><option>Hoje</option></select></Field>
    </Drawer>
  );
}

export function GoogleFilterDrawer({ open, onClose }) {
  return (
    <Drawer open={open} onClose={onClose} title="Filtros Google Ads">
      <Field label="Tipo de campanha"><select className="input"><option>Todas</option><option>Search</option><option>PMax</option><option>Display</option></select></Field>
      <Field label="Status"><select className="input"><option>Todas</option><option>Ativas</option><option>Pausadas</option></select></Field>
    </Drawer>
  );
}
