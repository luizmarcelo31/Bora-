# 2026-09-17 — Estoque, PDV, Caixa e Financeiro UI

## O que mudou
- `src/lib/money.ts`: `parseBRLToCents()` (usado pelos 4 módulos).
- **Estoque** (`/dashboard/estoque`): saldo por produto (com alerta de mínimo),
  movimentar ENTRADA/SAIDA/AJUSTE (via `InventoryService`, permissão
  `inventory.move`), últimas 20 movimentações.
- **PDV** (`/dashboard/pdv`): carrinho client (`pdv-client.tsx`) com busca,
  pagamento (6 métodos), caixa aberta opcional, desconto e cliente; preço
  sempre do banco (anti-tamper); `createSaleAction` usa `userId` da sessão;
  vendas do dia abaixo.
- **Caixa** (`/dashboard/caixa`): abrir (nome + saldo inicial), fechar com
  valor contado, histórico com saldos (`cashbox.open` / `cashbox.close`).
- **Financeiro** (`/dashboard/financeiro`): lançar RECEITA/DESPESA/
  TRANSFERENCIA (categoria, descrição, valor R$, data, caixa opcional),
  resumo do mês (MetricCards), últimos 30 lançamentos.
- `/dashboard` com links dos 5 módulos. Permissões por página
  (`inventory.view`, `sales.create`, `cashbox.view`, `financial.view`) com
  queda para `/unauthorized`.

## Arquivos principais
`src/lib/money.ts`, `src/app/dashboard/{estoque,pdv,caixa,financeiro}/`,
`src/app/dashboard/page.tsx`, `docs/{MODULES,ROADMAP,PROJECT_STATE}.md`.

## Testes
- `npx next build --webpack` verde (24 rotas).
- Guards: `/dashboard/{estoque,pdv,caixa,financeiro,produtos}` sem sessão → 307.

## Pendente (conta real)
Fluxo ponta-a-ponta: abrir caixa → ENTRADA de estoque → venda no PDV com
caixa → fechar caixa → conferir financeiro. Fazer deploy e testar em produção.
