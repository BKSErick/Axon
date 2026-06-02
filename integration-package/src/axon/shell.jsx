/* ============================================
   Axon — Shell (Sidebar + Topbar + AuditBanner)
   ============================================ */
import React from 'react';
import { I, BrandMark } from './icons';
import { useAxonData } from './data-bridge';

const NAV_ADMIN = [
  { id: 'admin-overview',    label: 'Visão Geral',         icon: <I.home/>,      group: 'Gestão' },
  { id: 'admin-bms',         label: 'Business Managers',   icon: <I.briefcase/>, countKey: 'bms',        group: 'Meta Ads' },
  { id: 'admin-accounts',    label: 'Contas de Anúncio',   icon: <I.layers/>,    countKey: 'accounts',   group: 'Meta Ads' },
  { id: 'admin-campaigns',   label: 'Campanhas',           icon: <I.trend/>,                              group: 'Meta Ads' },
  { id: 'admin-google',      label: 'Visão geral',         icon: <I.home/>,                               group: 'Google Ads',  channelIcon: 'google' },
  { id: 'admin-google-kw',   label: 'Palavras-chave',      icon: <I.search/>,                             group: 'Google Ads',  channelIcon: 'google' },
  { id: 'admin-clients',     label: 'Clientes',            icon: <I.users/>,     countKey: 'clients',    group: 'Operação' },
  { id: 'admin-audiences',   label: 'Audiências',          icon: <I.target/>,    badge: 'IA',            group: 'Operação' },
  { id: 'admin-reports',     label: 'Relatórios',          icon: <I.file/>,                               group: 'Operação' },
  { id: 'admin-social',      label: 'Social Media',        icon: <I.insta/>,                              group: 'Operação' },
  { id: 'admin-settings',    label: 'Configurações',       icon: <I.cog/>,                                group: 'Sistema' },
];

const NAV_CLIENT = [
  { id: 'client-dashboard',  label: 'Dashboard',           icon: <I.home/>,                               group: 'Visão geral' },
  { id: 'client-campaigns',  label: 'Meta Campanhas',      icon: <I.trend/>,                              group: 'Mídia paga',  channelIcon: 'meta' },
  { id: 'client-google',     label: 'Google Ads',          icon: <I.search/>,                             group: 'Mídia paga',  channelIcon: 'google' },
  { id: 'client-creatives',  label: 'Criativos',           icon: <I.image/>,     badge: 'Novo',          group: 'Mídia paga' },
  { id: 'client-leads',      label: 'Central de Leads',    icon: <I.users/>,                              group: 'Aquisição' },
  { id: 'client-social',     label: 'Instagram',           icon: <I.insta/>,                              group: 'Orgânico' },
  { id: 'client-reports',    label: 'Relatórios',          icon: <I.file/>,                               group: 'Conta' },
  { id: 'client-settings',   label: 'Configurações',       icon: <I.cog/>,                                group: 'Conta' },
  { id: 'client-support',    label: 'Suporte',             icon: <I.chat/>,                               group: 'Conta' },
];

function GoogleIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function Sidebar({ role, view, setView, auth, onLogout }) {
  const data = useAxonData();
  const items = role === 'admin' ? NAV_ADMIN : NAV_CLIENT;
  const counts = {
    bms: data.bms?.length ?? 0,
    accounts: data.accounts?.length ?? 0,
    clients: data.clients?.length ?? 0,
  };

  const groups = [];
  for (const it of items) {
    let g = groups.find(x => x.name === it.group);
    if (!g) { g = { name: it.group, items: [] }; groups.push(g); }
    g.items.push(it);
  }

  const initials = (auth?.name || '?').split(' ').slice(0, 2).map(s => s[0]).join('').toUpperCase();

  return (
    <aside className="sidebar">
      <div className="brand">
        <BrandMark />
        <div>
          <div className="brand-name">Axon</div>
          <div className="brand-tag">{role === 'admin' ? 'AGÊNCIA' : 'CLIENTE'}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', marginRight: -12, paddingRight: 12 }}>
        {groups.map(g => (
          <React.Fragment key={g.name}>
            <div className="nav-section">{g.name}</div>
            {g.items.map(item => (
              <div key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)}>
                {item.channelIcon === 'google' ? <GoogleIcon size={14}/> : item.channelIcon === 'meta' ? <I.fb/> : item.icon}
                <span>{item.label}</span>
                {item.countKey && counts[item.countKey] > 0 && <span className="count">{counts[item.countKey]}</span>}
                {item.badge && <span className="count" style={{ background: 'rgba(var(--accent-rgb), 0.15)', color: 'rgb(var(--accent))', borderColor: 'rgba(var(--accent-rgb), 0.3)' }}>{item.badge}</span>}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      <div className="user">
        <span className="avatar">{initials}</span>
        <div className="user-info">
          <div className="user-name">{auth?.name || 'Usuário'}</div>
          <div className="user-role">{auth?.agency || (role === 'admin' ? 'Admin' : 'Cliente')}</div>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={onLogout} title="Sair"><I.out/></button>
      </div>
    </aside>
  );
}

export function Topbar({ role, setRole, canSwitch, view, theme, setTheme, onPalette, onNotifs, onCopilot }) {
  const allItems = [...NAV_ADMIN, ...NAV_CLIENT];
  const current = allItems.find(i => i.id === view);
  return (
    <div className="topbar">
      <div className="crumbs">
        <span>{role === 'admin' ? 'Agência' : 'Workspace do cliente'}</span>
        <span className="sep">/</span>
        <span className="cur">{current?.label || 'Painel'}</span>
      </div>

      <div className="topbar-right">
        <button className="btn" onClick={onPalette} style={{ paddingRight: 8, gap: 8 }}>
          <I.search /><span style={{ fontSize: 12, color: 'rgb(var(--text-3))' }}>Buscar…</span><span className="tt">⌘K</span>
        </button>
        <button className="btn btn-ghost btn-icon" title="Notificações" onClick={onNotifs}><I.bell /></button>

        {canSwitch && (
          <div className="role-switch">
            <button className={role === 'admin' ? 'on' : ''} onClick={() => setRole('admin')}><I.briefcase style={{ width: 13, height: 13 }} />Admin</button>
            <button className={role === 'client' ? 'on' : ''} onClick={() => setRole('client')}><I.eye style={{ width: 13, height: 13 }} />Cliente</button>
          </div>
        )}

        <button className="btn btn-ghost btn-icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Alternar tema">
          {theme === 'dark' ? <I.sun /> : <I.moon />}
        </button>

        <button className="btn btn-primary" onClick={onCopilot} style={{ background: 'linear-gradient(135deg, rgb(var(--accent)), #8b5cf6)', color: 'white' }}>
          <I.sparkle />Copilot
        </button>
      </div>
    </div>
  );
}

export function AuditBanner({ clientId, onBack }) {
  const data = useAxonData();
  const client = data.clients?.find(c => c.id === clientId);
  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(234,179,8,0.08), rgba(234,179,8,0.04))',
      borderBottom: '1px solid rgba(234,179,8,0.25)',
      padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 12,
    }}>
      <I.warn style={{ color: 'rgb(var(--c-warning))' }} />
      <span><strong>Modo Auditoria:</strong> você está vendo o painel como <strong>{client?.name || 'cliente'}</strong></span>
      <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={onBack}>← Voltar para Admin</button>
    </div>
  );
}
