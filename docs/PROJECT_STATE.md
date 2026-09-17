# PROJECT_STATE — fonte da verdade

**Atualizado:** 17/09/2026 · **Fase:** Fase A pronta (Super Admin funcional, visual atual)

## Implementado ✅
- Next.js 16 + TS + Tailwind v4 + shadcn base (button/input/card/table/badge) + shared (PageHeader/MetricCard/EmptyState)
- Supabase clients (browser/server) + Auth UI (/login, /signup, /dashboard) + `src/proxy.ts`
- Prisma schema completo + migration `20260917125414_init` + `src/lib/db.ts`
- Validators (Zod) + Services (product, inventory, sale, cashbox, financial)
- APIs com sessão→tenant (`src/lib/api-context.ts`): `/api/tenants`, `/api/products`, `/api/users`, `/api/sales`, `/api/stock`, `/api/cashbox`, `/api/cashbox/[id]/close`, `/api/financial` (+ `/api/test` pública)
- Super Admin: `requireSuperAdmin` (`src/lib/admin.ts`), `/unauthorized`, `/admin` (métricas), `/admin/empresas`, `/admin/usuarios`, `/admin/permissoes`, bootstrap `scripts/bootstrap-admin.cjs`
- Libs: `auth.ts`, `tenant.ts`, `roles.ts`, `permissions.ts`, `utils.ts`, `api-context.ts`, `admin.ts`
- Docs: PRD, ARCHITECTURE, DATABASE, AUTH, TENANCY, PERMISSIONS, DESIGN_SYSTEM, MODULES, ROADMAP, AI_RULES + ADRs

## Em desenvolvimento 🟡
- Fase B: re-skin com Studio Admin (preset Neutral).

## Não implementado ⬜
- UIs comerciais (produtos/estoque/PDV/caixa/financeiro) · planos/assinaturas · relatórios/auditoria · testes automatizados.

## Bugs conhecidos
- Nenhum registrado. Build verde (19 rotas). APIs sem sessão → 401; /admin sem sessão → 307.

## Próxima tarefa
1. Fase B: branding Studio Admin (deps, globals Neutral, shell, re-skin login/signup/admin).
