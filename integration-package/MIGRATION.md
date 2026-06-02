# MIGRATION — passo a passo

> Rode tudo na **raiz** do repo `METABKSFY` (não dentro de `integration-package/`).
> **Importante:** nada é movido pra pasta `legacy/`. Os componentes antigos
> ficam onde estão pra não quebrar os imports internos deles.

## 0 — Branch de segurança

```bash
git checkout -b axon-integration
git push -u origin axon-integration
```

## 1 — Backup do App e do CSS antigos

```bash
git mv src/App.jsx src/App.legacy.jsx
cp    src/index.css src/index.css.bak   # segurança (não commitar o .bak)
```

## 2 — Colar os arquivos do pacote

**Atalho (recomendado):** rode o script que faz backup + cópia + install:

```bash
bash integration-package/apply.sh
```

Ou manualmente:

```bash
cp -R integration-package/src/* src/
cp integration-package/index.html index.html
```

Isso adiciona/sobrescreve:
- `src/App.jsx` (novo)
- `src/index.css` (novo — Axon, importa `legacy.css`)
- `src/legacy.css` (novo)
- `src/axon/*` (novo)
- `src/lib/hooks/useAxonData.js` (novo)
- `src/lib/mocks/axon.js` (novo)

**Não toca** em `src/components/`, `src/data/`, `src/lib/supabase.js|meta.js|metaOrganic.js|metricsAggregator.js|notionService.js`, `src/lib/hooks/useClientData.js`, `src/main.jsx`.

## 3 — Conferir os bridges (caminhos + props dos componentes legados)

O Axon importa os painéis pesados do lugar **original** (`src/components/...`).
Imports prontos e tolerantes a `export default` OU named. **Confirmei as
assinaturas reais** lendo o repo — as props já estão corretas no pacote:

| Componente | Export | Props que o componente espera | Como o bridge passa |
|---|---|---|---|
| `admin/SocialMediaPanel.jsx` | named `SocialMediaPanel` | — | `<SocialMediaPanel/>` |
| `AdminViews.jsx` → `AdminSettings` | named | `{ auth, onUpdate }` | `auth`, `onUpdate` ✅ |
| `client/LeadsCenter.jsx` | named `LeadsCenter` | `{ user }` (usa `user.id`) | `user={{ id: clientId }}` ✅ |
| `client/SocialMediaView.jsx` | named | `{ user }` | `user={{ id: clientId }}` ✅ |
| `client/ReportsView.jsx` | named | `{ user, kpis, campaigns }` | `user`, `kpis`, `campaigns` do contexto ✅ |
| `client/ClientSettings.jsx` | named | `{ user, onLogout }` | `user={auth}`, `onLogout` ✅ |
| `client/SuporteWhatsApp.jsx` | named | — | `<SuporteWhatsApp/>` ✅ |

> ✅ **Boa notícia:** esses componentes usam **estilos inline** via `C` de
> `src/lib/clientTheme.js` (+ `lucide-react`), **não Tailwind**. Renderizam
> certo sem nenhuma config extra. O `clientTheme.js` e os botões
> `ConnectFacebookButton`/`ConnectLinkedInButton`/`CreditAlert` ficam no lugar.

## 4 — `index.html` (raiz)

O `apply.sh` já copia o `index.html` pronto do pacote (título Axon, fontes
Inter Tight + JetBrains Mono + Plus Jakarta + Material Symbols, e o **Tailwind
Play CDN** com `preflight` desligado pra não resetar o Axon).
Se preferir editar o seu manualmente, veja `integration-package/index.html`.
Nada novo no `.env`.

## 5 — Rodar

```bash
npm install
npm run dev
```

## 6 — Checklist de validação

**Admin**
- [ ] Login email/senha real funciona
- [ ] "Visão Geral" mostra KPIs reais (Investimento/Leads/CPA/ROI)
- [ ] Clientes carregam do Supabase
- [ ] BMs + Contas de Anúncio carregam
- [ ] Campanhas carregam (Meta API) — coluna "Conta" pode aparecer `—` (ver nota)
- [ ] Relatórios carregam
- [ ] **Social Media** abre o `SocialMediaPanel` legado dentro do Axon, estilizado
- [ ] **Configurações** abre `AdminSettings` legado
- [ ] Toggle "Cliente" no topbar → modo auditoria (banner amarelo)

**Cliente**
- [ ] Dashboard mostra `useKpis` corretamente (Investido = `extended.spend`, Leads = `extended.totalLeads`, ROI = `%`)
- [ ] **Leads** abre `LeadsCenter`
- [ ] **Instagram** abre `SocialMediaView`
- [ ] **Relatórios** abre `ReportsView`
- [ ] **Configurações** / **Suporte** abrem os legados

**Geral**
- [ ] Dark/Light persiste · Logout funciona · ⌘K abre busca · 🔔 e Copilot abrem (mock)

## 7 — Tailwind (camada de compatibilidade)

Os componentes que bridgeamos **não usam Tailwind** (usam `clientTheme` inline),
então a transição funciona sem nada extra. Mas deixei o **Tailwind Play CDN** já
montado no `index.html` (preflight off + cores `primary`/`accent` + fonte
material-symbols + classe `.backstagefy-glass-card` em `legacy.css`) caso você
reative telas Tailwind antigas como `client/ClientReports.jsx`.

### Quer Tailwind de verdade pra produção? (opcional, §11)
O Play CDN mostra um aviso no console e não é ideal pro build final. Pra instalar
de forma própria sem quebrar o Axon, veja §11.

## 8 — Schemas pras features novas (rodar quando for ligar)

### 8.1 Notificações
```sql
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  kind text not null, title text not null, body text,
  action jsonb, read boolean default false,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;
create policy "own_select" on public.notifications for select using (user_id = auth.uid());
create policy "own_update" on public.notifications for update using (user_id = auth.uid());
```
Depois, em `useAxonData.js → useNotifications`, descomente a query real (já está pronta, comentada).

### 8.2 Audiences
```sql
create table if not exists public.audiences (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  name text not null, source text, size integer,
  status text default 'active', meta_id text, config jsonb,
  created_at timestamptz default now()
);
```

### 8.3 Onboarding
```sql
alter table public.profiles add column if not exists onboarding_completed boolean default false;
```

### 8.4 Google Ads (futuro)
Crie `src/lib/google.js` no mesmo padrão de `meta.js` e troque os mocks em
`src/axon/google-screens.jsx` pelos hooks reais.

### 8.5 AI Copilot (OpenRouter) — JÁ MONTADO ✅

A Edge Function e o frontend já estão prontos no pacote. Só falta deployar e
configurar a key. **A key fica só no servidor** (nunca no frontend/Vite).

**Arquivos:**
- `supabase/functions/copilot/index.ts` — proxy server-side pro OpenRouter (Deno)
- `src/axon/overlays.jsx → CopilotDrawer` — já chama `supabase.functions.invoke('copilot', …)`
  enviando `messages` + um `context` com os KPIs/campanhas da tela atual.

**Deploy (uma vez):**
```bash
# 1. CLI do Supabase (se ainda não tiver):  npm i -g supabase
supabase login
supabase link --project-ref SEU_PROJECT_REF

# 2. Deployar a função
supabase functions deploy copilot --no-verify-jwt

# 3. Configurar os secrets (server-side, NÃO vão pro .env do Vite)
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxx
supabase secrets set COPILOT_MODEL=anthropic/claude-3.5-sonnet   # opcional (default já é esse)
supabase secrets set COPILOT_APP_URL=https://meta.backstagefy.com.br   # opcional
```

**Trocar de modelo:** é só mudar o secret `COPILOT_MODEL`. Exemplos no OpenRouter:
`anthropic/claude-3.5-sonnet`, `openai/gpt-4o-mini`, `google/gemini-flash-1.5`,
`meta-llama/llama-3.1-70b-instruct`. (lista: https://openrouter.ai/models)

**Custo/segurança:** a função usa `temperature 0.4`, `max_tokens 800`. Como o
`invoke` passa o JWT do usuário logado, dá pra restringir por auth depois
(remova `--no-verify-jwt` e valide a sessão dentro da função). Para rate-limit por
cliente, dá pra logar chamadas numa tabela `copilot_usage`.

> Sem deploy, o Copilot mostra uma mensagem de erro amigável explicando o que falta
> (não quebra o app).

## 9 — Notas conhecidas

- **Coluna "Conta" em Campanhas (admin)**: `fetchUnifiedCampaignsInsights` achata
  as campanhas e perde `account_id`. Pra resolver, ajuste o aggregator pra
  carimbar `account_id`/`account_name` em cada campanha.
- **`whatsapp_logs`**: a tela de Relatórios admin tenta ler dessa tabela. Se ela
  tiver outro nome no seu schema, ajuste em `useAxonData.js → useAllReports`.
  Se não existir, a tela mostra estado vazio (não quebra).

## 10 — Deploy
Branch `axon-integration` → preview na Vercel → validar → merge `main`.

## 11 — Tailwind de produção (opcional — substitui o Play CDN)

Se quiser remover o aviso do Play CDN e ter Tailwind no build:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

`tailwind.config.js`:
```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  corePlugins: { preflight: false }, // NÃO resetar o Axon
  theme: {
    extend: {
      colors: { primary: { DEFAULT: '#10b981', hover: '#059669' }, accent: '#06b6d4' },
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'sans-serif'] },
    },
  },
  plugins: [],
};
```

No topo do `src/index.css`, **antes** dos `@import`, adicione só utilities +
components (sem `@tailwind base`, que é o preflight):
```css
@tailwind components;
@tailwind utilities;
```

E remova as duas tags do Play CDN (`<script src="https://cdn.tailwindcss.com">`
e o `<script>tailwind.config…</script>`) do `index.html`.

