# PROJECT_STATE — fonte da verdade

**Atualizado:** 18/09/2026 · **Fase:** POC PDV visual isolada + Home Opção A (Fase 0 aprovada)

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
- Home: `/` → redirect inteligente (`/dashboard` se logado senão `/login`) — Opção A
- POC PDV: `product-grid.tsx` + `cart-sheet.tsx` (grid 2 col + Sheet confirmação, sem novas deps, sem migração, regras intactas) — isolada em `_components`
- Docs: PRD, ARCHITECTURE, DATABASE, AUTH, TENANCY, PERMISSIONS, DESIGN_SYSTEM, MODULES, ROADMAP, AI_RULES + ADR-001..004 + `mapping-branding-kit.md` (Fase 0)

## Em desenvolvimento 🟡
- Nenhum.

## Não implementado ⬜
- Imagens de produto (Supabase Storage) · planos/assinaturas tenant · testes automatizados · logo oficial · dark toggle · presets alternativos.

## Bugs conhecidos
- Nenhum registrado. Build verde (29 rotas, `npx next build --webpack`). Guards: `/ → 307 /login`, `/dashboard/* → 307` sem sessão. PRG + pending anti-duplo clique (F5 não duplica). Sheet é `radix-ui` puro, sem `vaul`. Sem migração nova. Sem `useEffect` com mutation, sem `GET` que escreve.
- O 403 reportado em /admin com conta comum é o comportamento correto (só SUPER_ADMIN).
  Resolvido o vínculo: `luizmarcelo31@gmail.com` = OWNER da Conveniencia Centro;
  `luizmarcelodev@gmail.com` = Super Admin raiz (imutável, ver PERMISSIONS.md).

## Próxima tarefa
1. Revisão da POC PDV (aprovar ou ajustar grid/Sheet/gráfico) — expandir para Produtos/Caixa somente após aprovação. Nenhuma alteração funcional será aplicada sem aprovação prévia.
