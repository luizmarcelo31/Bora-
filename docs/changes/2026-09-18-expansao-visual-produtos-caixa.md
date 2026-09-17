# 2026-09-18 — Expansão visual Produtos + Caixa (POC aprovada)

**Aprovação:** POC PDV (grid + Sheet) aprovada — expansão autorizada sem novas deps/migrações.

## Produtos (`src/app/dashboard/produtos/page.tsx`)
- **Métricas:** `MetricCard` total/atívos/baixo (cálculo `allProducts.length`, `filter active`, `filter qty <= min`)
- **Filtros server-side:** `?q` (nome/SKU/barras, `toLowerCase includes`), `?cat` (categoria exata), `?status` (all/active/inactive) — via `searchParams` + `filter` em `allProducts`, sem `tanstack`
- **Tabs visuais:** links estilizados como tabs (`bg-primary` quando ativo) — sem `zustand`, sem `Tabs` state client
- **Tabela:** `Badge` categoria, `Badge` estoque baixo (`destructive` quando `qty <= min`), `Badge` status, `tabular-nums` preço/estoque
- **Isolamento:** page continua server (`requireSessionTenant`), filtros via `GET` (PRG), sem `useEffect`

## Caixa (`src/app/dashboard/caixa/page.tsx`)
- **Métricas:** `MetricCard` abertos/fechados/saldo em abertos (soma `currentBalance`), hint último caixa
- **Tabela:** `Badge` Aberto/Fechado, `tabular-nums`, sobra/falta com cor (`emerald`/`destructive`) abaixo do fechamento
- **Sheet já existente:** `CloseCashBoxDialog` mantido com preview diferença (cálculo servidor `diff = closing - currentBalance`)

## Validação
- `npx next build --webpack` verde (29 rotas, `ƒ /dashboard/produtos` + `ƒ /dashboard/caixa` dinâmicos)
- Nenhuma lib nova (`@tanstack`, `zustand`, `date-fns`, `cmdk` continuam ausentes), nenhuma migração
- Guards e `logAudit` intactos

## Arquivos
`src/app/dashboard/produtos/page.tsx`, `src/app/dashboard/caixa/page.tsx`, `docs/PROJECT_STATE.md`
