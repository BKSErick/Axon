/* ============================================
   MOCK DATA — Axon
   Realistic-looking data for a Meta Ads SaaS
   ============================================ */

// 30 dias de série diária
function dailySeries(days, base, variance, trend=0) {
  const out = [];
  let v = base;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    v = Math.max(0, v + (Math.random() - 0.5) * variance + trend);
    out.push({
      date: d.toISOString().slice(0,10),
      label: d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }),
      v: Math.round(v * 100) / 100
    });
  }
  return out;
}

const seedSpend30 = dailySeries(30, 850, 200, 8);
const seedLeads30 = dailySeries(30, 4.5, 2, 0.05);
const seedCPA30 = dailySeries(30, 180, 30, -1);
const seedROI30 = dailySeries(30, 1.8, 0.4, 0.01);
const seedCTR30 = dailySeries(30, 2.4, 0.5, 0.01);

// merge for performance chart
const performance30 = seedSpend30.map((s, i) => ({
  date: s.date,
  label: s.label,
  spend: s.v,
  leads: Math.round(seedLeads30[i].v),
  cpa: Math.round(seedCPA30[i].v * 100) / 100,
  ctr: seedCTR30[i].v,
}));

// Clientes
const CLIENTS = [
  { id: "alpha-biz", name: "Alpha Business Academy", logo: "AB", color: "avt-1", email: "expansao@pontoacafe.com.br", phone: "+55 11 99876-5432", accounts: 1, status: "ok", spend30: 18420.55, leads30: 76, cpa: 242.37, roi: 1.6, plan: "Pro", joined: "2025-08-14" },
  { id: "viabr", name: "Via BR Cenografia", logo: "VB", color: "avt-2", email: "daniela@viabrcenografia.com", phone: "+55 11 91234-5678", accounts: 2, status: "warn", spend30: 8750.0, leads30: 24, cpa: 364.58, roi: 0.9, plan: "Pro", joined: "2025-09-02" },
  { id: "gthouse", name: "GT House Imóveis", logo: "GT", color: "avt-3", email: "lucasrsantos996@gmail.com", phone: "+55 11 99160-5660", accounts: 1, status: "ok", spend30: 2705.46, leads30: 18, cpa: 150.30, roi: 2.3, plan: "Pro", joined: "2025-11-20" },
  { id: "bcksena", name: "Erick Sena — BCK Grow", logo: "ES", color: "avt-6", email: "contato.ericksenadesign@gmail.com", phone: "+55 11 99800-1122", accounts: 2, status: "ok", spend30: 55.60, leads30: 1, cpa: 55.60, roi: 0.0, plan: "Trial", joined: "2026-03-01" },
  { id: "pontoalpha", name: "Ponto Alpha Café", logo: "PA", color: "avt-4", email: "expansao@pontoacafe.com.br", phone: "+55 11 98512-3344", accounts: 1, status: "warn", spend30: 6588.77, leads30: 32, cpa: 205.90, roi: 1.4, plan: "Pro", joined: "2025-05-10" },
];

// Business Managers
const BMS = [
  { id: "bm_930684", name: "Agência Principal", connected: "2026-04-17", accounts: 7, status: "ok", health: 96, owner: "Erick Sena", tokenExp: "2026-07-11" },
  { id: "bm_771203", name: "BKS Grow Holding", connected: "2025-11-02", accounts: 3, status: "warn", health: 78, owner: "Erick Sena", tokenExp: "2026-05-30" },
  { id: "bm_558491", name: "Aliados — Parcerias", connected: "2026-02-08", accounts: 4, status: "ok", health: 92, owner: "Lucas Rodrigues", tokenExp: "2026-08-04" },
];

// Contas de Anúncio
const AD_ACCOUNTS = [
  { id: "act_940770918351047", name: "CA02 — Alpha Business Academy", bm: "Agência Principal", client: "alpha-biz", spend: 18420.55, status: "active", linked: true },
  { id: "act_253821928181436", name: "Via BR Cenografia 002", bm: "Agência Principal", client: "viabr", spend: 8750.00, status: "active", linked: true },
  { id: "act_411851407962178", name: "GT House", bm: "Agência Principal", client: "gthouse", spend: 2705.46, status: "active", linked: true },
  { id: "act_249933397636235", name: "BCK Grow", bm: "BKS Grow Holding", client: "bcksena", spend: 55.60, status: "active", linked: true },
  { id: "act_852880683619485", name: "Backstage Conference", bm: "Agência Principal", client: "bcksena", spend: 0, status: "paused", linked: true },
  { id: "act_117405493417884", name: "CA01 — Ponto Alpha", bm: "Agência Principal", client: "pontoalpha", spend: 6588.77, status: "active", linked: true },
  { id: "act_190859362673824", name: "Espaço Constru", bm: "BKS Grow Holding", client: null, spend: 0, status: "active", linked: false },
  { id: "act_339182093421872", name: "Aliados Beta — Captação", bm: "Aliados — Parcerias", client: null, spend: 0, status: "paused", linked: false },
];

// Campanhas
const CAMPAIGNS = [
  { id: "120244510145380769", name: "[LEADS] [CAPTAÇÃO INVESTIMENTO][AB]", account: "Alpha Business", client: "alpha-biz", spend: 9655.56, leads: 13, cpa: 742.74, ctr: 2.81, clicks: 5234, profit: -9655.56, status: "active" },
  { id: "120245680128500769", name: "[LEADS] [CAPTAÇÃO INVESTIMENTO][SP]", account: "Alpha Business", client: "alpha-biz", spend: 6555.07, leads: 0, cpa: null, ctr: 1.42, clicks: 2104, profit: -6555.07, status: "warn" },
  { id: "120245133405300076", name: "MOFU | TRAF | MENTORIA ABA | 0426", account: "Alpha Business", client: "alpha-biz", spend: 1405.02, leads: 6, cpa: 234.17, ctr: 2.81, clicks: 5012, profit: -1405.02, status: "warn" },
  { id: "120246558654180769", name: "[LEADS] [CAPTAÇÃO INVESTIMENTO][REGIONAL]", account: "Alpha Business", client: "alpha-biz", spend: 1285.32, leads: 5, cpa: 257.06, ctr: 3.04, clicks: 1842, profit: -1285.32, status: "active" },
  { id: "120245306412550769", name: "[LEADS] [WEBINAR][AB] [30-60][ABO] — 2", account: "Alpha Business", client: "alpha-biz", spend: 936.30, leads: 6, cpa: 156.05, ctr: 4.12, clicks: 944, profit: -936.30, status: "active" },
  { id: "120244510145410769", name: "[DP] [LEADS] [CHEKOUT]", account: "Alpha Business", client: "alpha-biz", spend: 0, leads: 0, cpa: null, ctr: null, clicks: 0, profit: 0, status: "paused" },
  { id: "120245006128500769", name: "[FUFU] [IMERSÃO ABA — MAIO]", account: "Alpha Business", client: "alpha-biz", spend: 8.28, leads: 0, cpa: null, ctr: 7.59, clicks: 6, profit: -8.28, status: "active" },
  { id: "120245006128500700", name: "[TOFU&MEFU] [IMERSÃO ABA — MAIO]", account: "Alpha Business", client: "alpha-biz", spend: 84.69, leads: 0, cpa: null, ctr: 12.54, clicks: 658, profit: -84.69, status: "active" },
  { id: "120246435745000769", name: "[LEADS] [CAPTAÇÃO INVESTIMENTO][REGIONAL]", account: "Via BR", client: "viabr", spend: 773.29, leads: 0, cpa: null, ctr: 1.8, clicks: 422, profit: -773.29, status: "warn" },
  { id: "120246435745001769", name: "GT House — Vendas Q2", account: "GT House", client: "gthouse", spend: 2705.46, leads: 18, cpa: 150.30, ctr: 3.21, clicks: 1980, profit: 4200, status: "active" },
];

// Leads
const LEADS = [
  { id: 1, name: "Ediflavio Dos Reis Assunção", email: "ediflavio.rs@gmail.com", phone: "+55 71 98123-4567", source: "FORMS - SALVADOR - INVESTIDOR", client: "alpha-biz", when: "2026-04-09T17:41:00", new: false, score: "warm" },
  { id: 2, name: "Quércia Bahia", email: "quercia@hotmail.com", phone: "+55 71 99432-1198", source: "FORMS - SALVADOR - INVESTIDOR", client: "alpha-biz", when: "2026-04-09T16:22:00", new: false, score: "hot" },
  { id: 3, name: "Cila Calmon", email: "cila.calmon@outlook.com", phone: "+55 71 98876-3322", source: "FORMS - SALVADOR - INVESTIDOR", client: "alpha-biz", when: "2026-04-09T14:08:00", new: false, score: "warm" },
  { id: 4, name: "Manuel Pombinho Tony Silva", email: "manuel.silva@uol.com.br", phone: "+55 71 99012-7745", source: "FORMS - SALVADOR - INVESTIDOR", client: "alpha-biz", when: "2026-04-09T12:51:00", new: false, score: "cold" },
  { id: 5, name: "Lara Mendes", email: "laram@gmail.com", phone: "+55 71 99234-5511", source: "MSG - DM INSTAGRAM", client: "alpha-biz", when: "2026-05-14T10:12:00", new: true, score: "hot" },
  { id: 6, name: "Rogério Alves", email: "rogerioa@gmail.com", phone: "+55 11 98123-9921", source: "MSG - WHATSAPP CAMP. INVESTIDOR", client: "alpha-biz", when: "2026-05-13T18:47:00", new: true, score: "warm" },
];

// Distribuição por idade
const AGE_DIST = [
  { age: "18-24", v: 2,  color: "#10b981" },
  { age: "25-34", v: 20, color: "#3b82f6" },
  { age: "35-44", v: 32, color: "#f59e0b" },
  { age: "45-54", v: 18, color: "#ef4444" },
  { age: "55-64", v: 12, color: "#a855f7" },
  { age: "65+",   v: 6,  color: "#06b6d4" },
];

// Gender split
const GENDER = [
  { k: "Feminino", v: 58, color: "#ec4899" },
  { k: "Masculino", v: 41, color: "#3b82f6" },
  { k: "Outro/N.I.", v: 1, color: "#a3a3a3" },
];

// Top regiões
const REGIONS = [
  { k: "São Paulo, SP", v: 38, leads: 28 },
  { k: "Rio de Janeiro, RJ", v: 16, leads: 12 },
  { k: "Salvador, BA", v: 14, leads: 11 },
  { k: "Belo Horizonte, MG", v: 11, leads: 8 },
  { k: "Curitiba, PR", v: 8, leads: 6 },
  { k: "Outros", v: 13, leads: 11 },
];

// Criativos
const CREATIVES = [
  { id: "cr_01", name: "Vídeo — Depoimento Ana", thumb: "video", format: "Vídeo 15s", ctr: 4.82, cpa: 89.40, spend: 4280, leads: 47, freq: 1.8, status: "winner" },
  { id: "cr_02", name: "Carrossel — 3 motivos", thumb: "carrossel", format: "Carrossel", ctr: 3.91, cpa: 124.12, spend: 3650, leads: 29, freq: 2.1, status: "active" },
  { id: "cr_03", name: "Imagem — Banner Black", thumb: "image", format: "Imagem", ctr: 2.45, cpa: 198.50, spend: 2840, leads: 14, freq: 3.4, status: "fatigue" },
  { id: "cr_04", name: "Reels — Bastidores", thumb: "video", format: "Reels", ctr: 5.21, cpa: 76.80, spend: 5410, leads: 70, freq: 1.5, status: "winner" },
  { id: "cr_05", name: "Stories — Promo 50%", thumb: "stories", format: "Stories", ctr: 1.82, cpa: 312.00, spend: 1840, leads: 5, freq: 4.2, status: "decline" },
  { id: "cr_06", name: "Imagem — Headline 02", thumb: "image", format: "Imagem", ctr: 3.04, cpa: 142.00, spend: 2100, leads: 14, freq: 2.6, status: "active" },
];

// Funil
const FUNNEL = [
  { stage: "Impressões",   v: 175696, pct: 100 },
  { stage: "Alcance",      v: 158906, pct: 90 },
  { stage: "Cliques",      v: 5476,   pct: 3.1 },
  { stage: "Cadastros",    v: 131,    pct: 0.075 },
  { stage: "Atendidos",    v: 82,     pct: 0.047 },
  { stage: "Vendas Est.",  v: 14,     pct: 0.008 },
];

// Instagram analytics
const IG_PROFILE = {
  handle: "@alphabusiness.aba",
  name: "Alpha Business Academy",
  followers: 18420,
  followersDelta: 5.4,
  posts30: 24,
  reach30: 245800,
  engagement: 4.8,
  avgLikes: 380,
  avgComments: 42,
  avgSaves: 65,
  avgShares: 28,
  bestTime: "Ter, 19h",
  worstTime: "Sáb, 11h",
};

const IG_GROWTH = dailySeries(30, 17800, 80, 22).map(d => ({ date: d.date, label: d.label, followers: Math.round(d.v) }));
const IG_ENGAGEMENT_BY_HOUR = Array.from({length: 24}, (_, h) => ({
  h: String(h).padStart(2,'0') + "h",
  mon: Math.round(2 + Math.random()*8 + (h>=18 && h<=21 ? 8 : 0)),
  tue: Math.round(2 + Math.random()*8 + (h>=18 && h<=21 ? 10 : 0)),
  wed: Math.round(2 + Math.random()*8 + (h>=12 && h<=14 ? 5 : 0)),
  thu: Math.round(2 + Math.random()*8 + (h>=19 && h<=22 ? 9 : 0)),
  fri: Math.round(2 + Math.random()*8 + (h>=20 && h<=23 ? 7 : 0)),
}));

const IG_TOP_POSTS = [
  { id: 1, type: "reel", caption: "5 erros que travam seu negócio em 2026", likes: 1240, comments: 184, saves: 312, reach: 28400 },
  { id: 2, type: "carrossel", caption: "Estratégia ABA — passo a passo", likes: 892, comments: 96, saves: 248, reach: 18200 },
  { id: 3, type: "post", caption: "Investidor Inteligente: ciclo MOFU", likes: 540, comments: 38, saves: 102, reach: 9800 },
  { id: 4, type: "reel", caption: "Como começou meu primeiro M de faturamento", likes: 2104, comments: 312, saves: 480, reach: 41200 },
];

// Relatórios enviados
const REPORTS = (function(){
  const arr = [];
  const clients = ["gthouse", "alpha-biz", "viabr", "pontoalpha"];
  let id = 1;
  for (let i = 0; i < 20; i++) {
    const c = clients[i % clients.length];
    const d = new Date();
    d.setDate(d.getDate() - i);
    arr.push({
      id: id++,
      title: "Relatório Diário",
      client: c,
      phone: "+55 11 99160-5660",
      period: "Últimas 24h",
      date: d.toISOString(),
      status: i % 7 === 0 ? "ok" : (i % 5 === 0 ? "queued" : "ok"),
      attempts: 1,
    });
  }
  // a couple failed
  arr[3].status = "failed"; arr[3].attempts = 3;
  arr[8].status = "failed"; arr[8].attempts = 3;
  return arr;
})();

window.MOCK = { performance30, CLIENTS, BMS, AD_ACCOUNTS, CAMPAIGNS, LEADS, AGE_DIST, GENDER, REGIONS, CREATIVES, FUNNEL, IG_PROFILE, IG_GROWTH, IG_ENGAGEMENT_BY_HOUR, IG_TOP_POSTS, REPORTS };

/* ============================================
   GOOGLE ADS DATA
   ============================================ */
const GOOGLE_PERF_30 = dailySeries(30, 1100, 280, 12).map((s, i) => ({
  date: s.date,
  label: s.label,
  spend: s.v,
  conversions: Math.round(seedLeads30[i].v * 1.3),
  clicks: Math.round(800 + Math.random() * 400),
  impressions: Math.round(28000 + Math.random() * 12000),
}));

const GOOGLE_CAMPAIGNS = [
  { id: "g_840291", name: "[SEARCH] Investimento — Termos Quentes", type: "Search", account: "Alpha Business", client: "alpha-biz", spend: 8420.30, conversions: 24, cpa: 350.85, ctr: 4.21, clicks: 1842, impr: 43800, cpc: 4.57, convValue: 72000, roas: 8.55, qs: 8.2, status: "active" },
  { id: "g_840300", name: "[PMAX] Performance Max — Geral BR", type: "PMax", account: "Alpha Business", client: "alpha-biz", spend: 5120.80, conversions: 18, cpa: 284.49, ctr: 2.84, clicks: 3022, impr: 106400, cpc: 1.69, convValue: 54000, roas: 10.54, qs: 7.9, status: "active" },
  { id: "g_840305", name: "[DISPLAY] Remarketing — Site", type: "Display", account: "Alpha Business", client: "alpha-biz", spend: 1840.55, conversions: 8, cpa: 230.07, ctr: 0.84, clicks: 2104, impr: 250500, cpc: 0.88, convValue: 24000, roas: 13.04, qs: 8.0, status: "active" },
  { id: "g_840310", name: "[SHOPPING] Catálogo principal", type: "Shopping", account: "GT House", client: "gthouse", spend: 2980.42, conversions: 14, cpa: 212.89, ctr: 1.94, clicks: 2840, impr: 146400, cpc: 1.05, convValue: 42000, roas: 14.09, qs: 7.4, status: "active" },
  { id: "g_840315", name: "[YOUTUBE] Awareness — Vídeos curtos", type: "YouTube", account: "Alpha Business", client: "alpha-biz", spend: 720.10, conversions: 2, cpa: 360.05, ctr: 0.42, clicks: 480, impr: 114200, cpc: 1.50, convValue: 6000, roas: 8.33, qs: 6.8, status: "warn" },
  { id: "g_840320", name: "[SEARCH] Marca + Concorrentes", type: "Search", account: "GT House", client: "gthouse", spend: 1240.18, conversions: 11, cpa: 112.74, ctr: 8.42, clicks: 622, impr: 7384, cpc: 1.99, convValue: 33000, roas: 26.61, qs: 9.4, status: "active" },
  { id: "g_840325", name: "[DISPLAY] Audience — Lookalike", type: "Display", account: "Via BR", client: "viabr", spend: 410.20, conversions: 0, cpa: null, ctr: 0.31, clicks: 184, impr: 59100, cpc: 2.23, convValue: 0, roas: 0, qs: 6.2, status: "warn" },
];

const KEYWORDS = [
  { kw: "investir 100 mil onde aplicar", match: "Phrase", impr: 18420, clicks: 642, ctr: 3.48, cpc: 5.20, conv: 14, cpa: 238.42, qs: 9, pos: 1.2, client: "alpha-biz" },
  { kw: "curso de investimento iniciante", match: "Broad", impr: 24800, clicks: 482, ctr: 1.94, cpc: 3.80, conv: 8, cpa: 229.00, qs: 8, pos: 2.1, client: "alpha-biz" },
  { kw: "alpha business academy", match: "Exact", impr: 1840, clicks: 412, ctr: 22.39, cpc: 0.82, conv: 18, cpa: 18.78, qs: 10, pos: 1.0, client: "alpha-biz" },
  { kw: "renda passiva mensal", match: "Phrase", impr: 12400, clicks: 248, ctr: 2.00, cpc: 4.10, conv: 6, cpa: 169.50, qs: 8, pos: 1.8, client: "alpha-biz" },
  { kw: "casa em condomínio fechado salvador", match: "Phrase", impr: 8420, clicks: 184, ctr: 2.18, cpc: 3.40, conv: 7, cpa: 89.42, qs: 9, pos: 1.4, client: "gthouse" },
  { kw: "apartamento decorado salvador", match: "Broad", impr: 14200, clicks: 312, ctr: 2.20, cpc: 2.80, conv: 5, cpa: 174.68, qs: 7, pos: 2.3, client: "gthouse" },
  { kw: "cenografia para eventos", match: "Exact", impr: 920, clicks: 84, ctr: 9.13, cpc: 2.40, conv: 4, cpa: 50.40, qs: 9, pos: 1.1, client: "viabr" },
  { kw: "decoração casamento luxo", match: "Broad", impr: 6800, clicks: 142, ctr: 2.09, cpc: 3.20, conv: 2, cpa: 227.20, qs: 7, pos: 2.2, client: "viabr" },
];

const SEARCH_TERMS = [
  { term: "onde investir 100 mil reais agora", clicks: 184, cpc: 4.40, conv: 4, addedAs: null, kw: "investir 100 mil onde aplicar" },
  { term: "como começar a investir do zero 2026", clicks: 142, cpc: 3.20, conv: 3, addedAs: null, kw: "curso de investimento iniciante" },
  { term: "alpha business academy é golpe", clicks: 28, cpc: 1.10, conv: 0, addedAs: "negative", kw: "alpha business academy" },
  { term: "investir 10 mil reais", clicks: 96, cpc: 2.80, conv: 2, addedAs: null, kw: "investir 100 mil onde aplicar" },
  { term: "casa em alphaville salvador", clicks: 64, cpc: 3.10, conv: 3, addedAs: "exact", kw: "casa em condomínio fechado salvador" },
  { term: "preço casa alphaville", clicks: 38, cpc: 2.40, conv: 0, addedAs: null, kw: "casa em condomínio fechado salvador" },
  { term: "aluguel casa condomínio salvador", clicks: 22, cpc: 1.80, conv: 0, addedAs: "negative", kw: "casa em condomínio fechado salvador" },
];

Object.assign(window.MOCK, { GOOGLE_PERF_30, GOOGLE_CAMPAIGNS, KEYWORDS, SEARCH_TERMS });
