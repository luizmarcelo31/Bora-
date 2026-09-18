# 2026-09-18 — Kit UI (lotes 1–4 + extras)

## Lote 1 — 19 visuais 0-install + Select/Switch/Textarea (6 rotas)
- Copiados para `src/components/ui/`: `empty`, `item`, `kbd`, `alert`, `progress`,
  `pagination`, `accordion`, `aspect-ratio`, `native-select`, `marker`, `button-group`,
  `input-group`, `attachment`, `bubble`, `hover-card`, `context-menu`, `menubar`,
  `navigation-menu`, `direction` (zero deps novas, zero `zustand`).
- Novos: `select-field.tsx` (Radix Select + hidden input p/ FormData),
  `switch-field.tsx` (Switch + hidden input).
- Trocas em produtos, categorias, estoque, financeiro, configuracoes, produtos/estoque
  (descrição `Input → Textarea`).
- 4 `<select>` controlados adiados (pdv ×2, close-dialog ×1, filtro financeiro ×1).

## Fix financeiro (500)
- `typeFilter.toUpperCase()` vs `=== "all"` gerava `where: {type: "ALL"}` inválido →
  `PrismaClientValidationError`. Fix: whitelist `RECEITA/DESPESA/TRANSFERENCIA`, resto → `{}`.

## Lotes 2–4 + extras
- `shared/FilterTabs.tsx` (Tabs Radix + `router.push`, estado na URL) em produtos e estoque.
- `ui/controlled-select.tsx` (Radix controlado + hidden opcional) no PDV ×2 e close-dialog.
- `SelectField` no filtro financeiro; `Badge` em financeiro/categorias.
- `shared/EmptyState` reescrito sobre o kit `Empty` + prop `icon` (8 rotas).
- `Item` no carrinho PDV/drawer; `Empty` em product-grid/relatorios.
- `shared/SearchParamToast.tsx` (sonner): `?error/?ok` viram toast e limpam a URL (7 páginas).
  `okText` só aceita `string` (+ `{v}` e `okMap`) — funções não cruzam server→client.
- `cmdk` palette no PDV (**removida depois** — redundante; ver changes busca-global).
- `vaul` Drawer `direction="right"` no `CartSheet` (mesma API/props).

## Testes
- `npx next build --webpack` verde; 9/9 rotas 200 com sessão real, zero erros no log.

## Arquivos
`src/components/ui/` (+19, +`controlled-select`), `src/components/shared/` (`FilterTabs`,
`SearchParamToast`, `EmptyState`), `src/app/dashboard/{produtos,estoque,financeiro,
categorias,configuracoes,pdv,caixa}/*`.
