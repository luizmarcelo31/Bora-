# PROJECT_STATE — fonte da verdade

**Atualizado:** 17/09/2026 · **Fase:** Módulos operação prontos (Estoque, PDV, Caixa, Financeiro)

## Implementado ✅
- Next.js 16 + TS + Tailwind v4 + shadcn radix-nova/Neutral (25 ui) + shared (PageHeader/MetricCard/EmptyState/BrandMark)
- Shell admin (sidebar + header slim + NavUser) em /admin; /login e /signup no visual do kit (RHF + Zod v4 → actions Supabase)
- Supabase clients (browser/server) + Auth UI + `src/proxy.ts`
- Prisma schema completo + migration `20260917125414_init` + `src/lib/db.ts`
- Validators (Zod v4) + Services (product, inventory, sale, cashbox, financial)
- APIs com sessão→tenant (`src/lib/api-context.ts`): `/api/tenants`, `/api/products`, `/api/users`, `/api/sales`, `/api/stock`, `/api/cashbox`, `/api/cashbox/[id]/close`, `/api/financial` (+ `/api/test` pública)
- Super Admin: `requireSuperAdmin`, `/unauthorized`, `/admin` (métricas), `/admin/empresas`, `/admin/usuarios`, `/admin/permissoes`, bootstrap `scripts/bootstrap-admin.cjs`
- Produtos UI: `/dashboard/produtos` (lista com estoque, cadastro com conversão R$→centavos, ativa/desativa) + `requireSessionTenant` (`src/lib/tenant.ts`)
- Estoque UI: `/dashboard/estoque` (saldo, movimentar ENTRADA/SAIDA/AJUSTE, últimas 20 movimentações)
- PDV: `/dashboard/pdv` (carrinho client, preço do banco, pagamento, caixa aberta, vendas do dia)
- Caixa UI: `/dashboard/caixa` (abrir com saldo inicial, fechar com valor contado, histórico)
- Financeiro UI: `/dashboard/financeiro` (lançar RECEITA/DESPESA/TRANSFERENCIA, resumo do mês, últimos 30)
- Docs: PRD, ARCHITECTURE, DATABASE, AUTH, TENANCY, PERMISSIONS, DESIGN_SYSTEM, MODULES, ROADMAP, AI_RULES + ADR-001..004

## Em desenvolvimento 🟡
- Nenhum (Fase B fechada).

## Não implementado ⬜
- Imagens de produto (Supabase Storage) · baixa de contas (`paid`) · planos/assinaturas · relatórios/auditoria · testes automatizados · logo oficial · dark toggle · presets alternativos.

## Bugs conhecidos
- Nenhum registrado. Build verde (24 rotas). Guards: /dashboard/* sem sessão → 307.
- O 403 reportado em /admin com conta comum é o comportamento correto (só SUPER_ADMIN).
  Resolvido o vínculo: `luizmarcelo31@gmail.com` = OWNER da Conveniencia Centro;
  `luizmarcelodev@gmail.com` = Super Admin raiz (imutável, ver PERMISSIONS.md).

## Próxima tarefa
1. Fluxo ponta-a-ponta com conta real (abrir caixa → ENTRADA → venda no PDV → fechar caixa → financeiro) ou deploy Vercel.
