# Axon × METABKSFY — Pacote de Integração

Pacote pronto pra colar dentro do seu repo `BKSErick/METABKSFY`.
Troca o frontend antigo (MetaReports) pela nova interface **Axon**, **mantendo todas as funcionalidades** do backend (Supabase Auth, Meta Ads API, WhatsApp, Notion, relatórios).

---

## ⚠️ Leia primeiro — o que eu descobri no seu repo

Explorei o código real antes de montar e achei coisas que mudaram a estratégia:

1. **Não tem Tailwind** no `package.json` — mas vários arquivos `src/components/client/*.jsx` (ex: `ClientReports.jsx`) usam classes Tailwind + `material-symbols-outlined`. Ou seja, são telas parcialmente quebradas/abandonadas. A experiência cliente que **realmente roda** é `ClientHome → ClientLayout + ClientDashboard`.
2. **`ClientViews.jsx` é só um barrel** — `ClientCampaigns`, `ClientReports`, `ClientSettings`, `ClientEcommerce` ali são stubs `() => null`. Os componentes de verdade estão em `src/components/client/`.
3. **Colisão de variáveis CSS** — o Axon e o seu `index.css` usam os MESMOS nomes (`--bg`, `--border`, `--text`, `--accent`) com formatos diferentes (RGB vs HEX). Resolvido escopando o CSS antigo sob `.legacy-scope` (ver `src/legacy.css`).
4. **Mover componentes pra uma pasta `legacy/` quebraria centenas de imports internos** (`../lib`, `../data`) dentro do `AdminViews.jsx` (155 kb) e `SocialMediaPanel.jsx` (143 kb). Por isso **NÃO movemos nada** — os componentes antigos ficam onde estão e o Axon importa eles do lugar original.
5. **Campanhas não carregam `account_id`** — o `fetchUnifiedCampaignsInsights` achata tudo e perde a referência da conta. Na tela "Todas as Campanhas" a coluna "Conta" fica como `—`. Dá pra resolver depois ajustando o aggregator.

---

## Conceito

- **Visual Axon** vira o novo shell (sidebar, topbar, login, telas).
- Telas com lógica existente usam os **mesmos hooks/libs** de sempre (`useKpis`, `useCampaigns`, `useAds`, `useEngagementAnalytics`, `supabase`, `meta.js`, `metricsAggregator`).
- Painéis pesados (SocialMediaPanel, LeadsCenter, ClientSettings, ReportsView, SocialMediaView, SuporteWhatsApp, AdminSettings) são **renderizados dentro do shell Axon** via bridge — código intacto, só embrulhado em `.legacy-scope` pro CSS antigo funcionar.
- Funcionalidades **novas** (AI Copilot, ⌘K, Notificações, Onboarding, Audiences IA, Google Ads) entram com **mock** — você liga depois.

---

## Estrutura final do `src/`

```
src/
├── App.jsx                       ⟵ SUBSTITUI (backup do antigo vira App.legacy.jsx)
├── App.legacy.jsx                ⟵ seu App.jsx antigo (backup / rollback)
├── main.jsx                      ⟵ igual
├── index.css                     ⟵ SUBSTITUI (design system Axon, importa legacy.css)
├── legacy.css                    ⟵ NOVO — seu index.css antigo, escopado em .legacy-scope
│
├── axon/                         ⟵ NOVO — todo o frontend novo
│   ├── icons.jsx                 (I.* + BrandMark)
│   ├── common.jsx                (KPI, Spark, Status, TT, fmt, R=recharts)
│   ├── login.jsx                 (login real via supabase.auth)
│   ├── shell.jsx                 (Sidebar + Topbar + AuditBanner)
│   ├── data-bridge.jsx           (Context que liga hooks reais → telas)
│   ├── overlays.jsx              (⌘K, Notificações, Copilot, Onboarding, TokenAlert)
│   ├── admin-screens.jsx         (telas admin — dados reais)
│   ├── client-screens.jsx        (telas cliente — dados reais + bridges)
│   ├── google-screens.jsx        (Google Ads — mock)
│   └── extras.jsx                (modais, drawers, toasts, confirm)
│
├── lib/
│   ├── supabase.js               ⟵ igual
│   ├── meta.js                   ⟵ igual
│   ├── metaOrganic.js            ⟵ igual
│   ├── metricsAggregator.js      ⟵ igual
│   ├── notionService.js          ⟵ igual
│   ├── hooks/
│   │   ├── useClientData.js      ⟵ igual
│   │   └── useAxonData.js        ⟵ NOVO — hooks do admin (Supabase real)
│   └── mocks/
│       └── axon.js               ⟵ NOVO — mocks das features novas
│
├── components/                   ⟵ FICA NO LUGAR (imports internos intactos)
│   ├── AdminViews.jsx            (AdminSettings é bridgeado)
│   ├── admin/SocialMediaPanel.jsx (bridgeado)
│   ├── client/LeadsCenter.jsx    (bridgeado)
│   ├── client/ClientSettings.jsx (bridgeado)
│   ├── client/ReportsView.jsx    (bridgeado)
│   ├── client/SocialMediaView.jsx (bridgeado)
│   ├── client/SuporteWhatsApp.jsx (bridgeado)
│   └── Legal.jsx                 (rotas /privacidade /termos /data-deletion)
└── data/db.js                    ⟵ FICA NO LUGAR
```

Passo-a-passo detalhado em **[MIGRATION.md](./MIGRATION.md)**.

---

## O que continua igual (zero risco)

✅ Auth Supabase (signIn, profiles, auto-cura de client_id, retry/bypass)
✅ Hooks reais: `useKpis`, `useCampaigns`, `useAds`, `useEngagementAnalytics`
✅ Libs: `meta.js`, `metaOrganic.js`, `metricsAggregator.js`, `notionService.js`
✅ Painéis pesados renderizados dentro do Axon: SocialMediaPanel, LeadsCenter, ClientSettings, ReportsView, SocialMediaView, SuporteWhatsApp, AdminSettings
✅ Alerta de token Meta inválido (`META_TOKEN_INVALID_EVENT`)
✅ Páginas legais e `import.meta.env.*` (Supabase / Meta)

---

## O que muda

🟢 Visual Axon (dark + light, Inter Tight + JetBrains Mono)
🟢 Sidebar agrupada (Gestão / Meta Ads / Google Ads / Operação / Sistema)
🟢 Login refeito (mesma lógica)
🟢 Skeletons de loading + estados vazios/erro nas telas novas
🟢 Modo auditoria com banner amarelo

🆕 Mock por enquanto (você liga depois — schemas em MIGRATION.md §8):
- ⌘K Command Palette · 🔔 Notificações · 🎓 Onboarding · 🎯 Audiences IA · 🔍 Google Ads + Keywords

🤖 **AI Copilot — JÁ LIGADO via OpenRouter** (Supabase Edge Function). Só falta
deployar a função e setar a `OPENROUTER_API_KEY` (server-side). Ver MIGRATION.md §8.5.

---

## Tweaks
Removidos (a pedido). Só o toggle **dark/light** no topbar, persistido em `localStorage`.

---

## Rollback

```bash
mv src/App.legacy.jsx src/App.jsx
git checkout HEAD -- src/index.css
rm -rf src/axon src/legacy.css src/lib/hooks/useAxonData.js src/lib/mocks
```
