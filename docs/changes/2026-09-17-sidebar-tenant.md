# 2026-09-17 — Sidebar do tenant (/dashboard)

## O que mudou
- `src/navigation/tenant-nav.ts`: grupos Operação (Visão geral, Produtos,
  Estoque, PDV) e Financeiro (Caixa, Financeiro), mesmo formato do admin-nav.
- `src/components/tenant/tenant-sidebar.tsx`: sidebar com `BrandMark`,
  `NavMain` e `NavUser` reaproveitados (sem duplicar código do admin).
- `src/app/dashboard/layout.tsx`: guarda `requireSessionTenant` + shell
  (SidebarProvider com cookie `sidebar_state`, header slim com empresa + role).
- `/dashboard` enxuto: links dos módulos removidos (navegação no sidebar).

## Testes
- `npx next build --webpack` verde (24 rotas).
- Guards: `/dashboard` + 5 módulos sem sessão → 307.

## Efeitos colaterais
- Nenhum nas páginas (mantêm o próprio `main`; só ganharam o shell).
