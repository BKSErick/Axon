/* ============================================
   Axon — Mock data (fallback / new features)
   Extracted from prototype data.jsx
   Used when:
   - Tabela ainda não existe no Supabase (audiences, notifications)
   - Funcionalidade ainda não foi conectada (Google Ads, AI Copilot)
   - Fallback de erro/loading (opcional)
   ============================================ */

// Daily-series generator (deterministic-ish — for charts)
function dailySeries(days, base, variance, trend = 0) {
  const out = [];
  let v = base;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    v = Math.max(0, v + (Math.random() - 0.5) * variance + trend);
    out.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      v: Math.round(v * 100) / 100,
    });
  }
  return out;
}

const seedSpend30 = dailySeries(30, 850, 200, 8);
const seedLeads30 = dailySeries(30, 4.5, 2, 0.05);
const seedCPA30 = dailySeries(30, 180, 30, -1);
const seedCTR30 = dailySeries(30, 2.4, 0.5, 0.01);

export const MOCK_PERFORMANCE_30 = seedSpend30.map((s, i) => ({
  date: s.date, label: s.label, spend: s.v,
  leads: Math.round(seedLeads30[i].v),
  cpa: Math.round(seedCPA30[i].v * 100) / 100,
  ctr: seedCTR30[i].v,
}));

export const MOCK_AGE_DIST = [
  { age: '18-24', v: 2,  color: '#10b981' },
  { age: '25-34', v: 20, color: '#3b82f6' },
  { age: '35-44', v: 32, color: '#f59e0b' },
  { age: '45-54', v: 18, color: '#ef4444' },
  { age: '55-64', v: 12, color: '#a855f7' },
  { age: '65+',   v: 6,  color: '#06b6d4' },
];

export const MOCK_GENDER = [
  { k: 'Feminino', v: 58, color: '#ec4899' },
  { k: 'Masculino', v: 41, color: '#3b82f6' },
  { k: 'Outro/N.I.', v: 1, color: '#a3a3a3' },
];

export const MOCK_REGIONS = [
  { k: 'São Paulo, SP', v: 38, leads: 28 },
  { k: 'Rio de Janeiro, RJ', v: 16, leads: 12 },
  { k: 'Salvador, BA', v: 14, leads: 11 },
  { k: 'Belo Horizonte, MG', v: 11, leads: 8 },
  { k: 'Curitiba, PR', v: 8, leads: 6 },
  { k: 'Outros', v: 13, leads: 11 },
];

export const MOCK_FUNNEL = [
  { stage: 'Impressões',  v: 175696, pct: 100 },
  { stage: 'Alcance',     v: 158906, pct: 90 },
  { stage: 'Cliques',     v: 5476,   pct: 3.1 },
  { stage: 'Cadastros',   v: 131,    pct: 0.075 },
  { stage: 'Atendidos',   v: 82,     pct: 0.047 },
  { stage: 'Vendas Est.', v: 14,     pct: 0.008 },
];

// Audiences (mock — tabela não existe ainda; ver MIGRATION.md §8.2)
export const MOCK_AUDIENCES = [
  { id: 'aud_01', name: 'Leads quentes 30d', source: 'leads', size: 1840, status: 'active',  match: 92 },
  { id: 'aud_02', name: 'Engajamento IG 90d', source: 'engagement', size: 12420, status: 'active', match: 86 },
  { id: 'aud_03', name: 'Lookalike compradores 1%', source: 'lookalike', size: 2400000, status: 'syncing', match: 78 },
  { id: 'aud_04', name: 'Site visitors 14d', source: 'custom', size: 8200, status: 'active', match: 65 },
];

// Google Ads (mock — sem integração ainda)
export const MOCK_GOOGLE_CAMPAIGNS = [
  { id: 'g_001', name: '[SEARCH] Marca - Brand Defense', type: 'Search', status: 'active', spend: 4280.00, clicks: 1240, conv: 28, ctr: 6.8, cpc: 3.45 },
  { id: 'g_002', name: '[PMAX] Geral - Q2', type: 'Performance Max', status: 'active', spend: 8650.00, clicks: 2840, conv: 42, ctr: 4.2, cpc: 3.05 },
  { id: 'g_003', name: '[DISPLAY] Remarketing 30d', type: 'Display', status: 'active', spend: 1840.00, clicks: 5210, conv: 8, ctr: 0.9, cpc: 0.35 },
  { id: 'g_004', name: '[SEARCH] Competidores', type: 'Search', status: 'paused', spend: 0, clicks: 0, conv: 0, ctr: 0, cpc: 0 },
];

export const MOCK_KEYWORDS = [
  { kw: 'agencia de marketing digital', match: 'Frase', impr: 12400, clicks: 240, cpc: 4.20, conv: 8, qs: 8 },
  { kw: 'gestão de tráfego pago', match: 'Exata', impr: 8200, clicks: 184, cpc: 3.80, conv: 6, qs: 7 },
  { kw: 'consultoria meta ads', match: 'Ampla', impr: 4800, clicks: 92, cpc: 5.10, conv: 4, qs: 6 },
];

export const MOCK_NEGATIVE = [
  { kw: 'gratis', list: 'Lista global' },
  { kw: 'curso', list: 'Lista global' },
  { kw: 'concurso', list: 'Conta — Alpha' },
];

// Instagram (preferir useEngagementAnalytics real quando disponível)
export const MOCK_IG_PROFILE = {
  handle: '@cliente', name: '—',
  followers: 0, followersDelta: 0,
  posts30: 0, reach30: 0, engagement: 0,
  avgLikes: 0, avgComments: 0, avgSaves: 0, avgShares: 0,
  bestTime: '—', worstTime: '—',
};

// Onboarding tour steps
export const MOCK_ONBOARDING_STEPS = [
  { title: 'Bem-vindo ao Axon', body: 'Sua plataforma de mídia paga, em um cérebro só.' },
  { title: 'AI Copilot', body: 'Clique no botão Copilot no topo direito a qualquer hora pra perguntar sobre suas campanhas.' },
  { title: 'Busca rápida', body: 'Use ⌘K (Ctrl+K) para navegar e executar comandos em segundos.' },
  { title: 'Modo Auditoria', body: 'Como admin, alterne pra "Cliente" no topbar pra ver o painel que ele vê.' },
];

// Demo notifications (até criar a tabela notifications no Supabase)
export const MOCK_NOTIFICATIONS = [
  { id: 'n1', kind: 'alert',   title: 'Token Meta expira em 7 dias', body: 'Renove o System User Token em Configurações.', action: { target: 'view', view: 'admin-settings' }, read: false, created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: 'n2', kind: 'success', title: '+3 leads quentes em Alpha Business', body: 'Campanha [LEADS] [WEBINAR] está performando 38% acima da média.', action: { target: 'copilot' }, read: false, created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
  { id: 'n3', kind: 'warn',    title: 'CTR caindo em "Via BR Cenografia"', body: 'CTR -22% últimos 7d. Considere refresh de criativos.', action: { target: 'view', view: 'admin-campaigns' }, read: true,  created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
];

// Copilot demo (sem endpoint configurado)
export const MOCK_COPILOT_REPLIES = {
  default: 'Conecte um endpoint de IA (Edge Function Supabase chamando Anthropic/OpenAI) e troque o stub em src/axon/overlays.jsx → CopilotDrawer.',
  hello: 'Olá! Sou o Axon Copilot. Posso analisar suas campanhas e sugerir otimizações. (modo demo — endpoint pendente)',
};

// Creatives shape — fallback se useAds vier vazio
export const MOCK_CREATIVES = [];
