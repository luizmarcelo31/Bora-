# 2026-09-18 — Cache + mobile + impressão + busca global

## Cache sem staleness (sem TTL, sem dado velho)
- `React.cache()` em `getSessionUser`, `getUserContextByEmail`, `requireTenant`
  (`lib/auth.ts`, `lib/tenant.ts`): layout+page dividem 1 sessão + 2 queries.
- Venda: batch `findMany` (action + service, era 2N), `Promise.all` em
  tenant/caixa/user/settings; **preço autoritativo do banco** (input ignorado).
- Resumos via `groupBy`/`aggregate` SQL; `getTodaysSales` com `select` enxuto.
- Medição dev (warm): financeiro 7–19s → 5,1s; demais estáveis (compilação +
  pooler us-west-2 dominam). Ganho estrutural = menos round-trips (produção/escala).

## Mobile 390px (Playwright, 10 telas, 0 page errors)
- 13/13 tabelas com `overflow-x-auto`; `page-hscroll=false` em todas;
  auditoria oculta coluna Detalhes no mobile; home + relatórios cabem nativo.
- Extras: chart responsivo ok; fix "R R$" duplo na home.

## Impressão por tipo (`shared/ReportActions.tsx`, `jspdf` + `autotable`)
- Visualizar (`data-print-root` + `window.print`), Exportar PDF (prova: downloads
  reais 10KB/25KB), Compartilhar (Web Share + fallback).
- LOG (auditoria, paisagem), VENDAS (relatórios: lista nova do período + tabela
  visível, cap 200 com contagem), FINANCEIRO (respeita filtro), ESTOQUE (idem).

## Busca global (substitui a palette `cmdk`, removida)
- `GET /api/search` (produtos + categorias, `q>=2`, auth por vínculo) +
  `shared/GlobalSearch.tsx` no header (`Empresa — ( search )`): rotas locais,
  produtos, categorias; `/` foca, Enter abre o 1º. Prova browser: 10/10 interações.
- Drawer fecha sozinho pós-venda (achado do teste browser).
