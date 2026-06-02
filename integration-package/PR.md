# PR: Integração frontend Axon

**Título sugerido:** `feat: novo frontend Axon (mantém backend Supabase/Meta/WhatsApp)`

## Resumo
Troca o frontend antigo (MetaReports) pela interface **Axon**, mantendo 100% das
funcionalidades existentes. O backend (Supabase Auth, Meta Ads API, WhatsApp,
Notion, relatórios) não muda — só a casca da UI.

## O que muda
- `src/App.jsx` novo (shell Axon + auth Supabase real). Antigo → `src/App.legacy.jsx`.
- `src/index.css` novo (design system Axon) + `src/legacy.css` (CSS antigo escopado).
- `src/axon/*` — telas, sidebar, topbar, login, overlays (⌘K, Notificações, Copilot, Onboarding).
- `src/lib/hooks/useAxonData.js` + `src/lib/mocks/axon.js` (novos).
- `index.html` com Tailwind Play CDN (preflight off) como camada de compat.

## O que NÃO muda (mantido)
- `src/lib/*` (supabase, meta, metaOrganic, metricsAggregator, notionService)
- `src/lib/hooks/useClientData.js`, `src/lib/clientTheme.js`
- `src/components/*` (AdminViews, SocialMediaPanel, LeadsCenter, ClientSettings,
  ReportsView, SocialMediaView, SuporteWhatsApp…) — renderizados dentro do Axon via bridge.

## Novidades com mock (ligar depois — schemas em MIGRATION.md §8)
AI Copilot · ⌘K · Notificações · Onboarding · Audiences IA · Google Ads + Keywords

## Como testar
1. `bash integration-package/apply.sh`
2. `npm run dev` → login → validar Admin e Cliente (checklist em MIGRATION.md §6)

## Rollback
`mv src/App.legacy.jsx src/App.jsx && git checkout HEAD -- src/index.css && rm -rf src/axon src/legacy.css src/lib/mocks src/lib/hooks/useAxonData.js`
