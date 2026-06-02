/* ============================================
   Axon — Login (Supabase auth real)
   Visual do Axon + lógica do legacy LoginScreen
   ============================================ */
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { I, BrandMark } from './icons';

export function Login() {
  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!email || !pass) { setErr('Preencha e-mail e senha'); return; }
    setErr(''); setLoading(true);
    try {
      const authReq = supabase.auth.signInWithPassword({ email, password: pass });
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('O servidor não respondeu a tempo (20s). Tente recarregar a página ou usar outro navegador.')), 20000));
      const { data, error } = await Promise.race([authReq, timeout]);
      if (error) throw error;
      console.log('[Axon] Auth OK');
    } catch (e) {
      console.error('[Axon] Auth error:', e);
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(var(--bg))', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Left — hero */}
      <div style={{ padding: '48px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid rgb(var(--border))', background: 'rgb(var(--bg-elev))' }}>
        <div className="row" style={{ gap: 10 }}>
          <BrandMark />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Axon</div>
            <div style={{ fontSize: 10, color: 'rgb(var(--text-3))', textTransform: 'uppercase', letterSpacing: '0.08em' }}>by BKS Grow</div>
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 14 }}>AI-powered ads intelligence</div>
          <h1 style={{ fontSize: 42, lineHeight: 1.05, letterSpacing: '-0.035em', fontWeight: 600, marginBottom: 16 }}>
            Toda sua mídia paga,<br />com um cérebro só.
          </h1>
          <p className="muted" style={{ fontSize: 15, lineHeight: 1.6, maxWidth: 480, marginBottom: 32 }}>
            Meta, Google e Instagram orgânico em um painel — com IA que detecta oportunidades, anomalias e otimiza criativos automaticamente.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 420 }}>
            {[
              { ic: <I.sparkle />, t: 'AI Copilot integrado', s: "Pergunte 'o que otimizar hoje?' e receba ações priorizadas" },
              { ic: <I.layers />, t: 'Multi-canal nativo', s: 'Meta Ads + Google Ads + Instagram orgânico' },
              { ic: <I.send />, t: 'Relatórios automatizados', s: 'PDFs entregues via WhatsApp todos os dias' },
            ].map((f, i) => (
              <div key={i} className="row" style={{ gap: 12, padding: '12px 14px', background: 'rgb(var(--bg-card))', borderRadius: 10, border: '1px solid rgb(var(--border-soft))' }}>
                <span style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(var(--accent-rgb), 0.1)', color: 'rgb(var(--accent))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{f.ic}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{f.t}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{f.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="row" style={{ gap: 24, color: 'rgb(var(--text-3))', fontSize: 12 }}>
          <span>© 2026 Axon</span>
          <a className="lnk" href="/termos">Termos</a>
          <a className="lnk" href="/privacidade">Privacidade</a>
          <a className="lnk" href="#">Status</a>
        </div>
      </div>

      {/* Right — form */}
      <div style={{ padding: '48px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <form onSubmit={submit} style={{ maxWidth: 380, width: '100%', margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, marginBottom: 6, letterSpacing: '-0.025em' }}>Acessar painel</h2>
          <p className="muted" style={{ fontSize: 13, marginBottom: 28 }}>Entre com sua conta para continuar</p>

          <div className="seg" style={{ width: '100%', marginBottom: 20 }}>
            <button type="button" className={role === 'admin' ? 'on' : ''} onClick={() => setRole('admin')} style={{ flex: 1, padding: '7px 10px' }}>Gestor / Admin</button>
            <button type="button" className={role === 'client' ? 'on' : ''} onClick={() => setRole('client')} style={{ flex: 1, padding: '7px 10px' }}>Cliente</button>
          </div>

          {err && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: 'rgb(var(--c-danger))', fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>
              ⚠ {err}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" />
            </div>
            <div className="field">
              <label>Senha</label>
              <input className="input" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <label className="row" style={{ gap: 6, fontSize: 12, color: 'rgb(var(--text-2))', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked /> Lembrar de mim
                </label>
                <a className="lnk" href="#" style={{ fontSize: 12 }}>Esqueci a senha</a>
              </div>
            </div>
            <button className="btn btn-primary" type="submit" style={{ justifyContent: 'center', padding: '10px' }} disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar no painel'}
            </button>

            <div className="row" style={{ gap: 10, margin: '10px 0', color: 'rgb(var(--text-3))', fontSize: 11 }}>
              <div style={{ flex: 1, height: 1, background: 'rgb(var(--border))' }} />
              <span>OU</span>
              <div style={{ flex: 1, height: 1, background: 'rgb(var(--border))' }} />
            </div>

            <button type="button" className="btn" style={{ justifyContent: 'center', padding: '10px' }} onClick={() => alert('Login Facebook em breve — use email/senha por enquanto')}>
              <I.fb style={{ color: '#1877f2' }} />Entrar com Facebook
            </button>
          </div>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'rgb(var(--text-3))' }}>
            Novo cliente? Solicite acesso ao seu gestor de performance.
          </div>
        </form>
      </div>
    </div>
  );
}
