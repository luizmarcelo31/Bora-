# 2026-09-17 — Fase B: branding Studio Admin (preset Neutral)

## O que mudou
- **B0:** clone `--depth 1` do Studio Admin p/ temp (fora do repo) + inventário.
  Auth do kit era mock (toast) — só o visual foi aproveitado.
- **B1:** deps (`cn`, `radix-ui`, `tw-animate-css`, `shadcn`, `sonner`,
  `next-themes`, `react-hook-form`, `@hookform/resolvers`); `globals.css`
  Neutral + `src/styles/presets/` (reservados); `components.json` →
  radix-nova/neutral; 25 arquivos em `ui/`; `use-mobile` em `src/hooks/`;
  `Toaster` + `TooltipProvider` no root layout; Geist `--font-geist`.
  Tabelas próprias migradas p/ nomes padrão (`TableHeader`, `TableRow`...).
- **B2:** shell no `/admin` — `AdminSidebar` + `NavMain` (sem Quick Create,
  sem zustand) + `NavUser` (email real + Sair) + `src/navigation/admin-nav.ts`;
  header slim; `SupportCard`, busca, controles de layout e menus do kit
  descartados.
- **B3:** `/login` e `/signup` no visual v1 do kit (pt-BR, `BrandMark`,
  sem GoogleButton); forms RHF + Zod v4 chamando as Server Actions Supabase
  (sem `remember me` — sessão gerenciada pelo Supabase); home com
  `BrandMark` + status atualizado.

## Arquivos principais
`src/app/globals.css`, `src/components/ui/*`, `src/components/{admin,auth}/`,
`src/components/shared/BrandMark.tsx`, `src/navigation/admin-nav.ts`,
`src/app/{login,signup,page}.tsx`, `src/app/admin/layout.tsx`,
`docs/{DESIGN_SYSTEM,MODULES,PROJECT_STATE}.md`, `docs/decisions/ADR-004*`.

## Testes (Gate B)
- `npx next build --webpack` verde (19 rotas).
- Runtime 16/16: 8 APIs sem sessão → 401; /admin* e /dashboard → 307;
  /login, /signup e / com marca BoraMais → 200.
- Guards da Fase A revalidados (nenhuma regressão).

## Efeitos colaterais
- Dark mode: tokens `.dark` presentes, sem toggle (futuro).
- Troca de preset: só ativar `data-theme-preset` (futuro).
- Logo oficial entra no `BrandMark` sem refatorar usos.
