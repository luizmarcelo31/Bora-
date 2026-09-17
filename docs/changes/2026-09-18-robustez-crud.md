# 2026-09-18 — Robustez CRUD (BORA+1) — Etapas 1-9

**Prompt base:** AJUSTE E ROBUSTEZ DO CRUD — BORA+1 (Next 14.2.35, Zod, Server Actions, multi-tenant)

## Diagnóstico (Etapa 1)
- **Schemas:** `createProductSchema`/`updateProductSchema=partial` ok; `createCategorySchema` sem update; `createFinancialMovementSchema` hardcoded `z.enum` vs `nativeEnum`; `updateFinancialMovementSchema=partial` vazio; `cancelSaleSchema` exige reason mas não era usado; `updateInventorySchema` manual sem `productId` (correto)
- **Services:** `ProductService.updateProduct` já existe com unicidade `sku/barcode` mas sem `NOT id` fino e sem transaction; `InventoryService.registerMovement` transactional mas validação fora da tx (TOCTOU); `SaleService` transactional mas `cashBox.currentBalance + total` com stale read (deveria ser `increment`)
- **Tenant/Perm/Audit:** `requireSessionTenant` deriva `tenantId` de `user.tenantId` (seguro), `requirePermission` lança, `logAudit` best-effort, `proxy.ts` protege `/dashboard|/admin`
- **F5:** todos os `create*` com `redirect` (PRG ok); **3 `toggle*` sem `redirect`**: `produtos toggleProductAction`, `categorias toggleCategoryAction`, `financeiro togglePaidAction` — POST permanece no history, F5 reenvia e inverte estado + novo audit. `pdv-client.tsx` sem `pending` permite duplo clique.

## Implementado

### Etapa 2 Produtos (`src/app/dashboard/produtos/`)
- `updateProductAction` — `requireSessionTenant` → `requirePermission("products.update")` → `getProduct(tenantId)` → Zod `partial` + `toCents` → `NOT id` já coberto por service (`sku !== product.sku`) → `ProductService.updateProduct` → `margin` recalculada no servidor → `logAudit("update","product")` → `revalidatePath` + `redirect(?ok/duplicate/invalid/not_found)`; `toggleProductAction` agora com `redirect` (PRG)
- `edit-dialog.tsx` — Dialog com `centsToReais`, `pending` anti-duplo, select categorias PRODUCT, mensagens `duplicate sku/barcode`
- Página: coluna Editar + Toggle com PRG

### Etapa 3 Estoque (`src/app/dashboard/estoque/`)
- `updateInventorySettingsAction` — `requirePermission("inventory.move")`, valida `minimumStock >=0`, `maximumStock > minimumStock`, verifica `inventory` pertence ao tenant, `prisma.inventory.update({minimumStock, maximumStock})` sem tocar `quantity` nem criar `StockMovement`, `logAudit`, `redirect`
- `edit-inventory-dialog.tsx` — Dialog dedicado por produto, `pending`, validação local `max > min`
- Página: coluna Máximo + Situação + botão Limites

### Etapa 4 Categorias (`src/app/dashboard/categorias/`)
- `updateCategoryAction` — valida nome, unicidade `@@unique([tenantId,kind,name])` com `NOT id`, `requirePermission` por `kind` (PRODUCT→`products.update`, FINANCIAL→`financial.create`), `logAudit`, `redirect`
- `deleteCategoryAction` — verifica `product.count` e `financialMovement.count` com `category` string; se >0 soft-delete `active=false` senão hard `delete`, `logAudit`, `redirect`
- `toggleCategoryAction` com `redirect`
- `category-dialogs.tsx` — Edit Dialog + AlertDialog Confirm (explica soft vs hard), `pending`

### Etapa 5 Financeiro (`src/app/dashboard/financeiro/`)
- `updateFinancialAction` — bloqueia se `paid=true` (`?error=paid_locked`), valida `type/amount>0/movementDate` com `T12:00:00`, `Zod` + `parseBRLToCents`, `prisma.update`, `logAudit`, `redirect`
- `deleteFinancialAction` — bloqueia se `paid=true`, hard `delete` senão, `logAudit`, `redirect`
- `togglePaidAction` com `redirect`
- `financial-dialogs.tsx` — Edit Dialog (com selects categorias FINANCIAL e caixas), Delete Confirm, `pending`, `centsToReais`

### Etapa 6 PDV/Caixa
- **PDV** (`pdv/actions.ts`): `createSaleAction` mapeia `ValidationError.type` → `?error=stock|discount|cashbox` (mensagens específicas); `cancelSaleAction` exige `cancelSaleSchema` `reason`, valida, estorna financeiro com motivo, `logAudit` com `details: Motivo`, `redirect`; `pdv-client.tsx` com `pending` anti-duplo; `cancel-dialog.tsx` com Dialog + motivo obrigatório
- **Caixa** (`caixa/close-dialog.tsx`): preview client-side da diferença (`formatCurrency`, cor sobra/falta) calculado no servidor de forma oficial (`CashBoxService.closeCashBox` + `FinancialService` sobra/falta); Dialog em `caixa/page.tsx` substitui form inline

### Etapa 7-8 Duplicidade & Retorno
- **PRG:** todos os `toggle/update/delete` agora `revalidatePath + redirect`, sem `useEffect` com mutation, sem `GET` que escreve; verificado via `Select-String`
- **ActionResult:** mantido `redirect` compatível (não quebra `form action={...}`); documentado tipo `ActionResult` para futuro `useActionState`, sem substituir padrão atual

## Testes (Etapa 9)
- `npx next build --webpack` verde (29 rotas)
- `pending` em todos os dialogs/forms evita duplo clique
- F5 em `/dashboard/produtos|estoque|categorias|financeiro|pdv|caixa` após mutação não duplica (PRG)
- Permissões: OWNER e CASHIER testáveis via `requirePermission` (CASHIER sem `products.update` → `unauthorized`)
- Auditoria: cada mutação chama `logAudit` (ver `SELECT * FROM "AuditLog" WHERE tenantId=...`)

## Arquivos modificados
`src/lib/validators.ts` (já tinha `updateCategorySchema` adicionado antes), `src/app/dashboard/produtos/{actions.ts,page.tsx,edit-dialog.tsx}`, `src/app/dashboard/estoque/{actions.ts,page.tsx,edit-inventory-dialog.tsx}`, `src/app/dashboard/categorias/{actions.ts,page.tsx,category-dialogs.tsx}`, `src/app/dashboard/financeiro/{actions.ts,pay-actions.ts,page.tsx,financial-dialogs.tsx}`, `src/app/dashboard/pdv/{actions.ts,page.tsx,pdv-client.tsx,cancel-dialog.tsx}`, `src/app/dashboard/caixa/{close-dialog.tsx,page.tsx}`, `src/components/ui/alert-dialog.tsx`

## Riscos / decisões pendentes
- `Product.category` e `FinancialMovement.category` permanecem `String` desnormalizados (troca para FK exigiria migração e quebra de histórico) — mantido
- `SaleService` TOCTOU não refatorado nesta etapa (fora do escopo robustez CRUD, anotado para Fase concurrency)
- `Transferência` financeira sem lógica de transferência entre caixas (validação `z.enum` passa, mas sem movimento duplo) — deixado como registro simples
