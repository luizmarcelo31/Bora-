# 2026-09-18 — Robustez C + testes no repo (B)

## C1 — erros honestos nas actions
- `lib/audit.ts`: best-effort agora loga `[audit]` no console (nunca quebra a operação).
- Todas as actions com `console.error("[<action>]")` + causa; códigos genéricos `fail`
  com mensagem ("Não foi possível concluir. Tente novamente.") em produtos,
  categorias, estoque, financeiro, caixa, configurações.
- Máscaras removidas: `createCategoryAction` (só P2002 → duplicate), `moveStockAction`
  (só `INSUFFICIENT_STOCK` → stock), `createProductAction` (DUPLICATE_SKU/BARCODE),
  `updateProductAction` (ValidationError tipado), toggles com `forbidden` em vez de 500.
- `requirePermission` que lançava 500 virou redirect `forbidden` (produtos toggle/update).

## C2/C3 — concorrência em caixa e estoque
- Venda: incremento do caixa via `updateMany(status OPEN)` — caixa fechado na corrida
  → `CLOSED_CASHBOX`; revalidação de estoque **dentro** da tx (fecha oversell).
- Fechamento: `updateMany(status OPEN)` — um vencedor (sem duplo lançamento de diferença).
- Cancelamento em caixa fechada: saldo preservado (fechamento imutável), estorno segue
  no financeiro; audit detalha `(caixa fechado — saldo preservado)`.
- E2E-C 3/3: cancel-caixa-fechada, refechar bloqueado, venda-caixa-fechado.

## B — testes no repo (ROADMAP item 9)
- Vitest 3 (`npm test`): 5 arquivos, 23 testes (money, payments, audit-labels,
  validators, permissions). Achado: docstring `parseBRLToCents` mentia sobre "12.99"
  (ponto é milhar) — doc corrigida + teste do comportamento real.
- Playwright (`npm run test:e2e`, `playwright.config.ts`): auth.setup via UI
  (env `E2E_EMAIL/E2E_PASSWORD`, `.auth.json` ignorado), smoke (9 rotas 200),
  navigation (busca/tabs/toast), mobile-tables (390px), sale-flow (escrita real só
  com `E2E_WRITE=1`, cleanup sozinho). Timeout 240s (dev compila por rota).
- Mobile: `min-w-0` em `SidebarInset` + conteúdo (dashboard e admin) — remove
  overflow horizontal raiz (sidebar-wrapper estourava 1408px no desktop).

## Arquivos
Actions de 6 rotas + `services/index.ts` (venda/cancel/fechamento) + `lib/audit.ts` +
layouts (dashboard/admin) + `vitest.config.ts` + `src/lib/*.test.ts` +
`playwright.config.ts` + `tests/e2e/*` + `tests/README.md` + `.gitignore`.
