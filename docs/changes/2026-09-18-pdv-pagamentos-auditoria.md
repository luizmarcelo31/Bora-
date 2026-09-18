# 2026-09-18 — PDV robusto + pagamentos PT + auditoria PT-BR

## BUG1 — falso erro de estoque no PDV
- Causa: catch-all em `createSaleAction` convertia qualquer erro em `?error=stock`;
  além disso todo erro fazia `redirect()` (reload full) e **limpava o carrinho`.
- Fix: action retorna `{ ok } | { error }` (sem redirect) — erro preserva o carrinho,
  sucesso limpa; `error=stock` só para `INSUFFICIENT_STOCK` real; demais → `error=sale`
  + `console.error("[createSaleAction]")` com a causa.
- `SaleService`: settings ausente = defaults da tela (`getSettingsWithDefaults`) —
  antes `null` desligava o controle e permitia estoque negativo silencioso.
- Drawer do carrinho passou a fechar sozinho no sucesso (`open` controlado).

## Pagamentos (só Dinheiro/Pix/Crédito/Débito)
- Migration `20260918_add_credit_debit_payments` (rewrite transacional do enum;
  `CARD/TRANSFER/CHECK/OTHER` seguem válidos no histórico, fora do UI).
- Histórico de migrations saneado (`sale_idempotency` marcada applied após DDL
  confirmada; `migrate deploy` → "No pending").
- `lib/payments.ts` (`PAYMENT_OPTIONS` + `PAYMENT_LABELS`) aplicado em PDV,
  tabelas, descrição financeira (`Venda #8 — Crédito`) e auditoria.

## Auditoria PT-BR
- `lib/audit-labels.ts`: 11 ações + 8 entidades traduzidas; página com `Badge`
  por semântica (criação=primário, destruição=vermelho).

## Testes
- Venda `CREDIT` fim-a-fim ok; build verde; 9/9 rotas 200.
- Dados `[TESTE]` mantidos no tenant 3 (vendas #7/#8, ENTRADA, caixas).
