# PROJECT_STATE — fonte da verdade

**Atualizado:** 18/09/2026 · **Fase:** Robustez CRUD concluída (ajuste e prevenção F5)

## Implementado ✅
- Next.js 16 + TS + Tailwind v4 + shadcn radix-nova/Neutral (25 ui) + shared (PageHeader/MetricCard/EmptyState/BrandMark)
- Shell admin (sidebar + header slim + NavUser) em /admin; /login e /signup no visual do kit (RHF + Zod v4 → actions Supabase)
- Shell do tenant em /dashboard (sidebar Operação/Financeiro, header com empresa + role); /dashboard enxuto (navegação no sidebar)
- Supabase clients (browser/server) + Auth UI + `src/proxy.ts`
- Prisma schema completo + migration `20260917125414_init` + `src/lib/db.ts`
- Validators (Zod v4) + Services (product, inventory, sale, cashbox, financial)
- APIs com sessão→tenant (`src/lib/api-context.ts`): `/api/tenants`, `/api/products`, `/api/users`, `/api/sales`, `/api/stock`, `/api/cashbox`, `/api/cashbox/[id]/close`, `/api/financial` (+ `/api/test` pública)
- Super Admin: `requireSuperAdmin`, `/unauthorized`, `/admin` (métricas), `/admin/empresas`, `/admin/usuarios`, `/admin/permissoes`, bootstrap `scripts/bootstrap-admin.cjs`
- Produtos: `/dashboard/produtos` — criar, listar, **editar (Dialog, SKU/barcode únicos, margem no servidor)**, ativa/desativa (PRG), audit
- Estoque: `/dashboard/estoque` — movimentar, **editar limites min/max (sem alterar saldo)**, histórico imutável, audit
- Categorias: `/dashboard/categorias` — criar, **editar nome (unicidade), excluir com soft-delete se em uso**, toggle (PRG), ConfirmDialog, audit
- Financeiro: `/dashboard/financeiro` — criar, **editar (bloqueia se paid), excluir (bloqueia se paid)**, toggle paid (PRG), dialogs, audit, baixa
- PDV: `/dashboard/pdv` — vender (preço do banco), **cancelar com motivo validado (DESPESA estorno)**, mensagens específicas stock/discount/cashbox, pending anti-duplo clique, audit
- Caixa: `/dashboard/caixa` — abrir/fechar, **preview diferença sobra/falta antes de confirmar (cálculo no servidor)**, Dialog, audit
- Relatórios: `/dashboard/relatorios` (filtro por data, vendas, financeiro, top produtos)
- Configurações: `/dashboard/configuracoes` (TenantSettings)
- Auditoria: `/dashboard/auditoria` + `src/lib/audit.ts` (trilha em todas as mutações)
- Docs: PRD, ARCHITECTURE, DATABASE, AUTH, TENANCY, PERMISSIONS, DESIGN_SYSTEM, MODULES, ROADMAP, AI_RULES + ADR-001..004

## Em desenvolvimento 🟡
- Nenhum.

## Não implementado ⬜
- Imagens de produto (Supabase Storage) · planos/assinaturas tenant · testes automatizados · logo oficial · dark toggle · presets alternativos.

## Bugs conhecidos
- Nenhum registrado. Build verde (29 rotas, `npx next build --webpack`). Guards: /dashboard/* sem sessão → 307. PRG corrigido em todos os toggle/update (F5 não duplica). Sem `useEffect` com mutation, sem `GET` que escreve.
- O 403 reportado em /admin com conta comum é o comportamento correto (só SUPER_ADMIN).
  Resolvido o vínculo: `luizmarcelo31@gmail.com` = OWNER da Conveniencia Centro;
  `luizmarcelodev@gmail.com` = Super Admin raiz (imutável, ver PERMISSIONS.md).

## Próxima tarefa
1. Teste manual ponta-a-ponta em produção (produto → estoque limites → categoria edit/delete → venda → cancelamento com motivo → caixa preview → financeiro edit/delete pago → F5 em cada página → auditoria) ou polish de imagens/upload.
