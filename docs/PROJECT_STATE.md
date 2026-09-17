# PROJECT_STATE — fonte da verdade

**Atualizado:** 17/09/2026 · **Fase:** Fundação pronta

## Implementado ✅
- Next.js 16 + TS + Tailwind v4 + shadcn base (button/input/card/table/badge) + shared (PageHeader/MetricCard/EmptyState)
- Supabase clients (browser/server) + Auth UI (/login, /signup, /dashboard) + `src/proxy.ts`
- Prisma schema completo + migration `20260917125414_init` + `src/lib/db.ts`
- Validators (Zod) + Services (product, inventory, sale, cashbox, financial)
- APIs: `/api/test`, `/api/tenants`, `/api/products`, `/api/users`, `/api/sales`, `/api/stock`, `/api/cashbox`, `/api/cashbox/[id]/close`, `/api/financial`
- Libs: `auth.ts`, `tenant.ts`, `roles.ts`, `permissions.ts`, `utils.ts`
- Docs: PRD, ARCHITECTURE, DATABASE, AUTH, TENANCY, PERMISSIONS, DESIGN_SYSTEM, MODULES, ROADMAP, AI_RULES + ADRs

## Em desenvolvimento 🟡
- Nenhum (fundação fechada neste ciclo).

## Não implementado ⬜
- Sessão→tenant automática nas APIs · Super Admin UI · UIs comerciais (produtos/estoque/PDV/caixa/financeiro) · relatórios/auditoria · testes automatizados.

## Bugs conhecidos
- Nenhum registrado. Validar com `npm run build` + teste manual POST/GET antes do deploy.

## Próxima tarefa
1. Amarrar sessão→tenant nas APIs (ver ROADMAP item 1).
