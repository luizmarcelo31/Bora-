# 2026-09-18 — POC PDV visual isolada + Home Opção A (Fase 0 aprovada)

**Escopo:** POC visual isolada, **sem migração**, **sem alteração de regra de negócio**, com testes de build e anti-duplicação registrados. Alteração funcional apresentada para aprovação antes de aplicar (conforme decisão).

## Home — Opção A inteligente
- `src/app/page.tsx:1` substituído (62 linhas estáticas → 7 linhas): `getSessionUser() → redirect("/dashboard")` se logado senão `redirect("/login")`
- Mantém `src/proxy.ts` guard; verificado `curl / → 307 Location: /login` (sem sessão), `curl /dashboard/pdv → 307` (guard)
- Nenhuma landing externa do kit usada (`src/app/(external)` ignorado)

## POC PDV — visual isolado
- **Novos leaf clients (sem lógica de negócio):** `src/app/dashboard/pdv/_components/product-grid.tsx` (grid `sm:grid-cols-2` de `Card` com `Badge` categoria/estoque, `Package` icon) + `cart-sheet.tsx` (`Sheet` com `Separator`, preview `subtotal - desconto = total`, `pending` anti-duplo clique)
- **Integração:** `src/app/dashboard/pdv/pdv-client.tsx:1` agora `lg:grid-cols-3` (`lg:col-span-2` catálogo + `lg:sticky` carrinho), busca `Input` mantida, `ProductGrid` recebe `filtered` com `category`, `CartSheet` com `confirmSale()` que monta `FormData` e chama `createSaleAction` (mesma Server Action transacional)
- **Dados reais inalterados:** `src/app/dashboard/pdv/page.tsx:59` continua `getPdvPageData` server (`ProductService.listProducts` + `prisma.cashBox OPEN` + `SaleService.getTodaysSales`), props `PdvProduct` agora inclui `category?: string|null`, preço do banco (`actions.ts:49 getProduct`), `SaleService.createSale` transacional + `Financial RECEITA` + `logAudit`
- **Isolamento:** `src/app/dashboard/pdv/_components/` contém apenas 2 arquivos; nenhum `stores/preferences`, nenhum `data.json`, nenhum `zustand`/`tanstack`/`date-fns`/`cmdk`/`vaul` instalado; `Sheet` é `radix-ui` puro (`src/components/ui/sheet.tsx:3 import { Dialog as SheetPrimitive } from "radix-ui"` + `cn`), já instalado
- **Business rules intactas:** `tenantId` em toda query, `requirePermission("sales.create")`, `SaleItem.unitPrice` snapshot, `StockMovement` append-only, `paid` lock, `auditLog` em `pdv/actions.ts:76`

## Validação
- **Build:** `npx prisma generate && npx next build --webpack` verde (29 rotas, `ƒ /dashboard/pdv` dinâmico, `ƒ Proxy`)
- **Anti-F5 / duplo clique:** `pdv-client.tsx:35 pending` + `CartSheet` `pending` desabilita botão; todas as `toggle/update/delete` com `revalidatePath + redirect` (verificado `Select-String`); `Home 307` e `PDV 307` sem sessão; `F5` após `POST` cai em `GET ?ok=` (PRG) — não cria novo `Sale`/`Financial`/`AuditLog` (teste dev: `curl` + `pending` bloqueia 2× clique rápido)
- **Sem migração:** `prisma/migrations` permanece `20260917125414_init` + `20260917183200_add_categories` (verificado `Get-ChildItem`)
- **Sem regra alterada:** `SaleService` (`prisma.$transaction` + `increment/decrement` + `currentBalance + total` já auditado) não tocado; `parseBRLToCents` mantido

## Arquivos
`src/app/page.tsx`, `src/app/dashboard/pdv/pdv-client.tsx`, `src/app/dashboard/pdv/page.tsx`, `src/app/dashboard/pdv/_components/product-grid.tsx`, `src/app/dashboard/pdv/_components/cart-sheet.tsx`, `docs/mapping-branding-kit.md` (Seção 2 e 5 corrigidas)

## Próximo
Aguardar aprovação da POC visual isolada antes de expandir para Produtos/Caixa (mesmo padrão leaf client, sem novas deps).
