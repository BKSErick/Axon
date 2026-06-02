/* ============================================
   Axon — Overlays (Palette, Notifs, Copilot, Onboarding, TokenAlert)
   ============================================ */
import React, { useState, useMemo, useEffect } from 'react';
import { I } from './icons';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../lib/hooks/useAxonData';
import { useAxonData } from './data-bridge';
import { MOCK_ONBOARDING_STEPS } from '../lib/mocks/axon';

/* -------- Token expired alert (Meta API) -------- */
export function TokenAlert({ alert, onClose, onConfigure }) {
  return (
    <div style={{ background: '#7f1d1d', borderBottom: '1px solid #991b1b', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>🔑</span>
        <span style={{ color: '#fca5a5', fontWeight: 600, fontSize: 13 }}>
          Token Meta inválido ou expirado (Erro {alert.code}) - atualize o segredo no Supabase/Edge Functions.
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onConfigure} style={{ background: '#991b1b', border: '1px solid #f87171', borderRadius: 6, color: '#fca5a5', cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '4px 12px' }}>Configurar Agora</button>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
      </div>
    </div>
  );
}

/* -------- Command Palette (⌘K) -------- */
export function CommandPalette({ open, onClose, setView }) {
  const [q, setQ] = useState('');
  const ALL_VIEWS = [
    { id: 'admin-overview',   label: 'Visão Geral',         group: 'Admin' },
    { id: 'admin-bms',        label: 'Business Managers',   group: 'Admin' },
    { id: 'admin-accounts',   label: 'Contas de Anúncio',   group: 'Admin' },
    { id: 'admin-campaigns',  label: 'Campanhas (Meta)',    group: 'Admin' },
    { id: 'admin-google',     label: 'Google Ads',          group: 'Admin' },
    { id: 'admin-clients',    label: 'Clientes',            group: 'Admin' },
    { id: 'admin-audiences',  label: 'Audiências IA',       group: 'Admin' },
    { id: 'admin-reports',    label: 'Relatórios',          group: 'Admin' },
    { id: 'admin-social',     label: 'Social Media',        group: 'Admin' },
    { id: 'admin-settings',   label: 'Configurações',       group: 'Admin' },
    { id: 'client-dashboard', label: 'Cliente — Dashboard', group: 'Cliente' },
    { id: 'client-campaigns', label: 'Cliente — Campanhas', group: 'Cliente' },
    { id: 'client-leads',     label: 'Cliente — Leads',     group: 'Cliente' },
    { id: 'client-social',    label: 'Cliente — Instagram', group: 'Cliente' },
  ];
  const filtered = useMemo(() => {
    if (!q.trim()) return ALL_VIEWS;
    const s = q.toLowerCase();
    return ALL_VIEWS.filter(v => v.label.toLowerCase().includes(s) || v.group.toLowerCase().includes(s));
  }, [q]);

  useEffect(() => {
    if (open) setQ('');
  }, [open]);

  if (!open) return null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '12vh 20px', zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, background: 'rgb(var(--bg-elev))', border: '1px solid rgb(var(--border))', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgb(var(--border-soft))' }}>
          <I.search style={{ color: 'rgb(var(--text-3))' }} />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar comando ou tela…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'rgb(var(--text))', fontSize: 14 }} />
          <span className="tt">ESC</span>
        </div>
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: 6 }}>
          {filtered.length === 0 && <div style={{ padding: '16px', textAlign: 'center', color: 'rgb(var(--text-3))', fontSize: 13 }}>Nenhum resultado para "{q}"</div>}
          {filtered.map(v => (
            <div key={v.id} className="nav-item" onClick={() => { setView(v.id); onClose(); }} style={{ borderRadius: 8 }}>
              <I.bolt style={{ color: 'rgb(var(--accent))' }} />
              <span>{v.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgb(var(--text-3))' }}>{v.group}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------- Notifications Drawer -------- */
export function NotificationDrawer({ open, onClose, userId }) {
  const { data, markRead, markAllRead } = useNotifications(userId);
  const unread = data.filter(n => !n.read).length;
  if (!open) return null;

  const fmt = (d) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const kindColor = { alert: 'rgb(var(--c-danger))', success: 'rgb(var(--c-success))', warn: 'rgb(var(--c-warning))', info: 'rgb(var(--c-info))' };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 420, background: 'rgb(var(--bg-elev))', borderLeft: '1px solid rgb(var(--border))', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: '1px solid rgb(var(--border-soft))' }}>
          <I.bell />
          <div style={{ fontWeight: 600, fontSize: 15 }}>Notificações {unread > 0 && <span style={{ marginLeft: 6, fontSize: 11, padding: '1px 6px', borderRadius: 999, background: 'rgb(var(--c-danger))', color: 'white' }}>{unread}</span>}</div>
          {unread > 0 && <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={markAllRead}>Marcar todas</button>}
          <button className="btn btn-ghost btn-icon" onClick={onClose}><I.x /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
          {data.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'rgb(var(--text-3))', fontSize: 13 }}>Nenhuma notificação por enquanto.</div>}
          {data.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)} style={{ padding: 12, borderRadius: 10, marginBottom: 6, background: n.read ? 'transparent' : 'rgb(var(--bg-card))', border: '1px solid ' + (n.read ? 'transparent' : 'rgb(var(--border-soft))'), cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: kindColor[n.kind] || 'rgb(var(--text-3))', flexShrink: 0, marginTop: 6 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
                  {n.body && <div style={{ fontSize: 12, color: 'rgb(var(--text-2))', lineHeight: 1.4 }}>{n.body}</div>}
                  <div style={{ fontSize: 11, color: 'rgb(var(--text-3))', marginTop: 6 }}>{fmt(n.created_at)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------- Copilot Drawer (AI via OpenRouter → Supabase Edge Function) -------- */
export function CopilotDrawer({ open, onClose }) {
  const data = useAxonData();
  const [msg, setMsg] = useState('');
  const [thread, setThread] = useState([
    { role: 'assistant', text: 'Olá! Sou o Axon Copilot. Pergunte sobre suas campanhas — ex: "o que otimizar hoje?".' },
  ]);
  const [pending, setPending] = useState(false);

  // Monta um snapshot enxuto dos dados atuais pra dar contexto ao modelo
  const buildContext = () => {
    const isClient = data.role === 'client';
    const k = isClient ? data.clientKpis : data.adminOverview;
    const camps = isClient ? data.clientCampaigns : data.campaigns;
    const client = data.clients?.find(c => c.id === data.clientId);
    return {
      role: isClient ? 'cliente' : 'admin',
      clientName: client?.name || null,
      kpis: k ? {
        spend: isClient ? (k.extended?.spend ?? k.raw?.spend) : k.totalSpend,
        leads: isClient ? (k.extended?.totalLeads ?? k.raw?.leads) : k.totalLeads,
        cpa: k.cpa,
        roi: k.roi,
      } : null,
      campaigns: (camps || []).slice(0, 8).map(c => ({
        name: c.name, spend: c.spend, leads: c.leads, cpa: c.cpa, ctr: c.ctr,
      })),
    };
  };

  const send = async () => {
    if (!msg.trim() || pending) return;
    const userText = msg.trim();
    const next = [...thread, { role: 'user', text: userText }];
    setThread(next);
    setMsg('');
    setPending(true);

    try {
      const { data: res, error } = await supabase.functions.invoke('copilot', {
        body: {
          messages: next.map(m => ({ role: m.role, content: m.text })),
          context: buildContext(),
        },
      });
      if (error) throw error;
      const reply = res?.reply || res?.error || 'Não consegui responder agora.';
      setThread(t => [...t, { role: 'assistant', text: reply }]);
    } catch (e) {
      setThread(t => [...t, {
        role: 'assistant',
        text: 'Erro ao chamar o Copilot: ' + (e?.message || e) +
          '\n\nVerifique se a Edge Function "copilot" está deployada e a OPENROUTER_API_KEY configurada (ver MIGRATION.md §8.5).',
      }]);
    } finally {
      setPending(false);
    }
  };

  if (!open) return null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 480, background: 'rgb(var(--bg-elev))', borderLeft: '1px solid rgb(var(--border))', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: '1px solid rgb(var(--border-soft))' }}>
          <I.sparkle style={{ color: 'rgb(var(--accent))' }} />
          <div style={{ fontWeight: 600, fontSize: 15 }}>AI Copilot</div>
          <span className="tag" style={{ marginLeft: 6, fontSize: 10, padding: '2px 6px', borderRadius: 999, background: 'rgba(var(--c-warning), 0.15)', color: 'rgb(var(--c-warning))' }}>BETA</span>
          <button className="btn btn-ghost btn-icon" style={{ marginLeft: 'auto' }} onClick={onClose}><I.x /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {thread.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.45, whiteSpace: 'pre-wrap', background: m.role === 'user' ? 'rgb(var(--accent))' : 'rgb(var(--bg-card))', color: m.role === 'user' ? 'white' : 'rgb(var(--text))' }}>{m.text}</div>
          ))}
          {pending && <div style={{ alignSelf: 'flex-start', fontSize: 12, color: 'rgb(var(--text-3))' }}>Pensando…</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, padding: 14, borderTop: '1px solid rgb(var(--border-soft))' }}>
          <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Pergunte algo (ex: o que otimizar hoje?)" className="input" style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={send} disabled={pending}><I.send /></button>
        </div>
      </div>
    </div>
  );
}

/* -------- Onboarding Tour -------- */
export function OnboardingTour({ open, onClose }) {
  const [step, setStep] = useState(0);
  const steps = MOCK_ONBOARDING_STEPS;
  if (!open) return null;
  const s = steps[step];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ width: '100%', maxWidth: 460, background: 'rgb(var(--bg-elev))', borderRadius: 14, padding: 28, border: '1px solid rgb(var(--border))' }}>
        <div className="row" style={{ gap: 10, marginBottom: 16 }}>
          <I.sparkle style={{ color: 'rgb(var(--accent))', width: 24, height: 24 }} />
          <div className="eyebrow">Passo {step + 1} de {steps.length}</div>
        </div>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>{s.title}</h2>
        <p className="muted" style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 24 }}>{s.body}</p>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-ghost" onClick={onClose}>Pular</button>
          <div className="row" style={{ gap: 8 }}>
            {step > 0 && <button className="btn" onClick={() => setStep(step - 1)}>Voltar</button>}
            {step < steps.length - 1
              ? <button className="btn btn-primary" onClick={() => setStep(step + 1)}>Próximo</button>
              : <button className="btn btn-primary" onClick={onClose}>Começar</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
