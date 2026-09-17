# PROJECT_STATE — fonte da verdade

**Atualizado:** 17/09/2026 · **Fase:** Fase B pronta (branding Studio Admin, preset Neutral)

## Implementado ✅
- Next.js 16 + TS + Tailwind v4 + shadcn radix-nova/Neutral (25 ui) + shared (PageHeader/MetricCard/EmptyState/BrandMark)
- Shell admin (sidebar + header slim + NavUser) em /admin; /login e /signup no visual do kit (RHF + Zod v4 → actions Supabase)
- Supabase clients (browser/server) + Auth UI + `src/proxy.ts`
- Prisma schema completo + migration `20260917125414_init` + `src/lib/db.ts`
- Validators (Zod v4) + Services (product, inventory, sale, cashbox, financial)
- APIs com sessão→tenant (`src/lib/api-context.ts`): `/api/tenants`, `/api/products`, `/api/users`, `/api/sales`, `/api/stock`, `/api/cashbox`, `/api/cashbox/[id]/close`, `/api/financial` (+ `/api/test` pública)
- Super Admin: `requireSuperAdmin`, `/unauthorized`, `/admin` (métricas), `/admin/empresas`, `/admin/usuarios`, `/admin/permissoes`, bootstrap `scripts/bootstrap-admin.cjs`
- Produtos UI: `/dashboard/produtos` (lista com estoque, cadastro com conversão R$→centavos, ativa/desativa) + `requireSessionTenant` (`src/lib/tenant.ts`)
- Docs: PRD, ARCHITECTURE, DATABASE, AUTH, TENANCY, PERMISSIONS, DESIGN_SYSTEM, MODULES, ROADMAP, AI_RULES + ADR-001..004

## Em desenvolvimento 🟡
- Nenhum (Fase B fechada).

## Não implementado ⬜
- Estoque UI, PDV, caixa e financeiro UI · planos/assinaturas · relatórios/auditoria · testes automatizados · logo oficial · dark toggle · presets alternativos.

## Bugs conhecidos
- Nenhum registrado. Build verde (20 rotas). Gate produtos: /dashboard/produtos sem sessão → 307.

## Próxima tarefa
1. Estoque UI (`/dashboard/estoque` — saldo + movimentar ENTRADA/SAIDA/AJUSTE) ou deploy Vercel da estrutura atual.
