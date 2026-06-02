#!/usr/bin/env bash
# ============================================
# Axon × METABKSFY — integração ponta-a-ponta
# Uso (na RAIZ do repo METABKSFY):
#   bash integration-package/apply.sh           # aplica e pergunta o que fazer
#   bash integration-package/apply.sh --push    # aplica e já commita + push (sem perguntar)
# ============================================
set -e

PKG="integration-package"
BRANCH="axon-integration"
AUTO_PUSH=false
[ "$1" = "--push" ] && AUTO_PUSH=true

# ── Sanity ───────────────────────────────────────────────
if [ ! -d "src" ] || [ ! -f "package.json" ]; then
  echo "❌ Rode na raiz do repo METABKSFY (onde estão src/ e package.json)."; exit 1
fi
if [ ! -d "$PKG" ]; then
  echo "❌ Pasta $PKG/ não encontrada na raiz. Copie o pacote pra cá primeiro."; exit 1
fi

echo "▶ 1/6  Branch $BRANCH"
git checkout -b "$BRANCH" 2>/dev/null || git checkout "$BRANCH"

echo "▶ 2/6  Backup do App.jsx e index.css antigos"
if [ -f src/App.jsx ] && [ ! -f src/App.legacy.jsx ]; then
  git mv src/App.jsx src/App.legacy.jsx
else
  echo "   (App.legacy.jsx já existe — pulando backup do App)"
fi
[ -f src/index.css ] && cp src/index.css src/index.css.bak

echo "▶ 3/6  Copiando arquivos novos"
cp -R "$PKG/src/." src/
cp "$PKG/index.html" index.html

echo "▶ 4/6  Garantindo .gitignore do backup"
grep -qxF "src/index.css.bak" .gitignore 2>/dev/null || echo "src/index.css.bak" >> .gitignore

echo "▶ 5/6  npm install"
npm install

echo "▶ 6/6  Build de fumaça (vite build) pra pegar erro de import antes do push"
if npm run build >/tmp/axon_build.log 2>&1; then
  echo "   ✅ build OK"
else
  echo "   ⚠ build falhou — veja /tmp/axon_build.log (provável: nome de export/props de um bridge, MIGRATION.md §3)."
  echo "   Os arquivos JÁ foram aplicados. Corrija e rode 'npm run dev'. NÃO vou dar push automático."
  AUTO_PUSH=false
  SKIP_PROMPT_PUSH=true
fi

echo ""
echo "════════════════════════════════════════════"
echo " Integração aplicada na branch '$BRANCH'."
echo "════════════════════════════════════════════"

do_push () {
  git add -A
  git commit -m "feat: integração frontend Axon (mantém Supabase/Meta/WhatsApp)" || true
  git push -u origin "$BRANCH"
  echo ""
  echo "✅ Push feito! Abra o PR:"
  REMOTE=$(git remote get-url origin | sed -E 's#git@github.com:#https://github.com/#; s#\.git$##')
  echo "   $REMOTE/compare/$BRANCH?expand=1"
  # PR automático se o gh CLI estiver instalado e logado
  if command -v gh >/dev/null 2>&1; then
    gh pr create --fill --base main --head "$BRANCH" 2>/dev/null && echo "   (PR criado via gh CLI)" || true
  fi
}

if [ "$AUTO_PUSH" = true ]; then
  do_push
elif [ "${SKIP_PROMPT_PUSH:-false}" != true ]; then
  echo "Rode 'npm run dev' pra validar visualmente."
  read -r -p "Commitar e dar push agora? [s/N] " ans
  case "$ans" in
    s|S|y|Y) do_push ;;
    *) echo "Ok. Quando quiser: git add -A && git commit -m 'feat: integração Axon' && git push -u origin $BRANCH" ;;
  esac
fi
