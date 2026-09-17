# Mapeamento Branding Kit — Fase 0 (read-only)

**Data:** 2026-09-18 · **Origem:** `C:\Users\Usuario\AppData\Local\Temp\opencode\studio-admin` (`arhamkhnz/next-shadcn-admin-dashboard`, MIT, Next 16.3.5, `recharts 3.10.1`) · **Destino:** `C:\Users\Usuario\Desktop\BoraMais\saas-conveniencia` · **Critério:** identificar, adaptar e reutilizar componentes visuais dentro das telas reais — **não copiar o template inteiro**.

---

## 1. Componentes do Branding Kit que serão reutilizados (POC PDV)

**Princípio:** só `src/components/ui` visuais puros (sem `zustand`, `data.json`, `preferences`). Dados reais continuam vindo do servidor.

| Kit (origem real) | Já em `src/components/ui` (destino real) | Uso na POC PDV (tela real) | Por que |
|---|---|---|---|
| `src/components/ui/card.tsx` (60 linhas, `cva` + `cn`) | `src/components/ui/card.tsx` ✅ idêntico | Container do carrinho e do catálogo (`src/app/dashboard/pdv/pdv-client.tsx:72,121`) | Já está — reuso direto |
| `src/components/ui/button.tsx` | `src/components/ui/button.tsx` ✅ | `+`/`−` do catálogo, Finalizar venda (`pdv-client.tsx:93,105,183`) | Já está |
| `src/components/ui/input.tsx` | `src/components/ui/input.tsx` ✅ | Busca, desconto, cliente (`pdv-client.tsx:79,176,180`) | Já está |
| `src/components/ui/sheet.tsx` (via `radix-ui`, `cn`) | `src/components/ui/sheet.tsx` ✅ | **Novo:** `cart-sheet.tsx` — confirmação antes de `createSaleAction` (substitui submit direto) | Já instalado, visual puro |
| `src/components/ui/dialog.tsx` | `src/components/ui/dialog.tsx` ✅ | `CancelSaleDialog` já usa (`src/app/dashboard/pdv/cancel-dialog.tsx:1`) — manter | Já está |
| `src/components/ui/badge.tsx` | `src/components/ui/badge.tsx` ✅ | Badge estoque baixo e pagamento (`fatura` futuro) | Já está |
| `src/components/ui/chart.tsx` (`recharts` + `ChartContainer`) | `src/components/ui/chart.tsx` ✅ | `DashboardChart` já em `src/app/dashboard/dashboard-chart.tsx:1` — reuso para gráfico diário no PDV (faturamento 7d) | Já está, `recharts` instalado |
| `src/components/ui/table.tsx` | `src/components/ui/table.tsx` ✅ | Vendas do dia (`src/app/dashboard/pdv/page.tsx:72`) | Já está |
| `src/components/ui/separator.tsx` | `src/components/ui/separator.tsx` ✅ | Divisor no header do `pdv/page.tsx` futuro | Já está |
| `src/components/ui/skeleton.tsx` | `src/components/ui/skeleton.tsx` ✅ | Loading do catálogo (quando busca filtra) | Já está, uso opcional |
| `src/components/shared/BrandMark.tsx` (custom, não do kit, `Store` icon) | `src/components/shared/BrandMark.tsx` ✅ | Header do PDV (consistência) | Custom melhor que `Command` do kit |
| `src/components/ui/command.tsx` (kit, `cmdk`) | ❌ não copiado | **Não usar na POC** — busca atual é `Input` + `filter` (`pdv-client.tsx:59`), evita `cmdk` (12kB) | Adiar |

**Não serão reutilizados na POC:** `calendar.tsx` (`react-day-picker` → `date-fns`), `carousel` (`embla`), `command` (`cmdk`), `drawer` (`vaul`), `data.json`/`data.ts` de qualquer `dashboard/*` template, `stores/preferences` (`zustand`), `ThemeBoot`. **Confirmação:** `Sheet` (`src/components/ui/sheet.tsx`) é `radix-ui` puro, já instalado — **não introduz `vaul` nem nova dependência** (ver `sheet.tsx:1 import { Dialog as SheetPrimitive } from "radix-ui"` + `cn`).

---

## 2. Dependências — já instaladas vs. adiadas

**Estado real em `src/package.json:11-31` (verificado 2026-09-18, `npm ls` + `Read`):**

```json
dependencies: {
  "@hookform/resolvers": "5.9.1", "@prisma/client": "6.18.0", "@supabase/ssr": "0.12.7",
  "@supabase/supabase-js": "2.116.0", "class-variance-authority": "0.7.1", "clsx": "2.1.1",
  "cn": "0.3.0", "lucide-react": "1.47.0", "next": "16.3.5", "next-themes": "0.4.6",
  "radix-ui": "1.6.7", "react": "19.2.8", "react-dom": "19.2.8", "react-hook-form": "7.88.0",
  "recharts": "3.10.1", "shadcn": "4.21.0", "sonner": "2.0.8", "tailwind-merge": "3.7.0",
  "tw-animate-css": "1.4.0", "zod": "4.6.5"
}
devDependencies: { "@tailwindcss/postcss": "4", "tailwindcss": "4", "prisma": "6.18.0", "typescript": "5" }
```

| Pacote | Instalado hoje | Kit usa | Decisão POC (com necessidade comprovada) |
|---|---|---|---|
| `next` / `react` / `react-dom` | `16.3.5` / `19.2.8` | `16.3.5` / `19.3.0` | ✅ manter — compatível |
| `recharts` | `3.10.1` ✅ | `3.8.0` | ✅ já instalado — POC usa para gráfico diário |
| `radix-ui` + `cn` + `cva` + `tailwind-merge` + `clsx` + `sonner` + `next-themes` + `lucide-react` | ✅ todos | idem | ✅ cobrem `ui/*` e `Sheet` |
| `@tanstack/react-table` | ❌ **ausente** | `ecommerce`/`finance` tables | ⛔ **Fora da POC** — salvo necessidade comprovada (tabela atual `src/components/ui/table.tsx` supre POC) |
| `zustand` | ❌ **ausente** | `preferences-store` | ⛔ **Fora da POC** — sidebar mantém `cookies().get("sidebar_state")` (`src/app/dashboard/layout.tsx:15`) |
| `date-fns` / `react-day-picker` | ❌ **ausentes** | `calendar` | ⛔ **Fora da POC** — datas via `Input type=date` + `new Date(v+"T12:00:00")` |
| `cmdk` | ❌ **ausente** | `command` palette | ⛔ **Fora da POC** — busca PDV segue `Input` + `filter` (`pdv-client.tsx:59`) |
| `vaul` / `embla` / `nuqs` / `input-otp` / `@dnd-kit/*` | ❌ ausentes | diversos templates | ⛔ **Fora da POC** |

**Conclusão atualizada:** POC PDV **não exige `npm install`** — `Sheet` (`src/components/ui/sheet.tsx:1` via `radix-ui`) já está instalada e é visual pura (`Dialog` + `cn`, sem `vaul`). Qualquer adição (`tanstack`/`cmdk`/`zustand`/`date-fns`) só com necessidade comprovada e aprovação prévia.

---

## 3. Componentes que precisam de adaptação (não cópia 1:1)

| Tela real (destino) | Kit candidato (origem) | O que muda na adaptação |
|---|---|---|
| `src/app/dashboard/pdv/pdv-client.tsx` (client island, `useState cart/payment/discount`, `useMemo lines/subtotal`) | `src/app/(main)/dashboard/default/_components/performance-overview.tsx` (gráfico `ComposedChart` com mock `chartValues[207]`) | **Não copiar** `chartValues` mock nem `Select` de período; criar `pdv/_components/daily-sales-chart.tsx` leaf client que recebe `data: {date,total}[]` do server (`page.tsx` já calcula `dailyMap` para `/dashboard`), usa `ChartContainer` + `Area` com `fillTotal` — dados reais de `SaleService` |
| `src/app/dashboard/pdv/page.tsx` (server, `getPdvPageData` → `ProductService.listProducts`, `prisma.cashBox OPEN`, `SaleService.getTodaysSales`) | `src/app/(main)/dashboard/ecommerce/page.tsx` (grid `kpi-strip` + `recent-orders-table` com `data.json`) | Manter `getPdvPageData` server; grid novo só reorganiza `PdvClient` em `lg:grid-cols-3` (catálogo `lg:col-span-2` + carrinho sticky), sem `tanstack` |
| `src/app/dashboard/pdv/cancel-dialog.tsx` | `src/app/(main)/dashboard/_components/header/search-dialog.tsx` (visual `Dialog`) | Já adaptado: `Dialog` + `reason` obrigatório + `pending` + `logAudit` com `details: Motivo` |
| `src/app/page.tsx` (hoje 62 linhas estáticas) | `src/app/(external)/page.tsx` (landing externa do kit) | **Não usar** landing externa; substituir por `page.tsx` com `getSessionUser() → redirect("/dashboard") : redirect("/login")` (Opção A inteligente), 12 linhas, mantém `proxy.ts` guard |

**Padrão de adaptação:** page continua `async` Server Component (`requireSessionTenant("/dashboard/pdv")` + `requirePermission("sales.create")`); leaf clients (`pdv-client.tsx`, `chart.tsx`) recebem props serializáveis (`PdvProduct[]`, `PdvCashbox[]`, `chartData`). Nenhum `fetch` client, nenhum `zustand`.

---

## 4. Como os dados reais chegam às telas (caminho verificado)

```
Supabase Auth (Supabase) → src/lib/supabase/server.ts → src/lib/auth.ts:getSessionUser()
  → src/lib/tenant.ts:requireSessionTenant(redirectTo) → prisma.user.findFirst({email}) + prisma.tenant.findUnique → {tenant, dbUser}
  → page.tsx (server) → Service ou prisma direto com where:{tenantId: tenant.id}
  → props para leaf client → Server Action ("use server") → Service → prisma.$transaction → logAudit → revalidatePath → redirect (PRG)
```

**Exemplos reais (caminhos absolutos):**

- **PDV venda:** `src/app/dashboard/pdv/page.tsx:32 requireSessionTenant("/dashboard/pdv")` → `src/app/dashboard/pdv/actions.ts:15 createSaleAction` → `ProductService.getProduct(tenant.id, productId)` (preço do banco, `src/app/dashboard/pdv/actions.ts:49`) → `src/services/index.ts:340 SaleService.createSale` (`prisma.$transaction` com `sale.create` + `stockMovement VEND A` + `inventory.decrement` + `cashBox.currentBalance + total`) + `FinancialService.registerMovement RECEITA Vendas PDV` (`actions.ts:65`) → `src/lib/audit.ts:7 logAudit`
- **Estoque limites:** `src/app/dashboard/estoque/actions.ts:59 updateInventorySettingsAction` → `prisma.inventory.update({minimumStock, maximumStock})` sem tocar `quantity`
- **Produtos:** `src/app/dashboard/produtos/actions.ts:62 updateProductAction` → `ProductService.updateProduct` (recalcula `margin` no servidor)
- **Dashboard overview:** `src/app/dashboard/page.tsx:21 requireSessionTenant("/dashboard")` → `prisma.product.count({active:true})`, `SaleService.getTodaysSales`, `FinancialService.getFinancialResume(monthStart)`, `prisma.inventory.findMany take 5`, `prisma.cashBox OPEN` → `dashboard-chart.tsx` recebe `chartData` (total/100)

**Isolamento multi-tenant:** todo `prisma.*` filtra `tenantId` (ver `src/services/index.ts:19 where:{tenantId}` e `src/app/dashboard/financeiro/page.tsx:47 where:{tenantId}`); `src/proxy.ts:1 proxy` só refresca sessão, guarda real é `requireSessionTenant`/`requireApiContext`.

---

## 5. Regras de segurança e negócio que devem permanecer intactas (não negociar) — POC não altera

- **Autenticação server (inalterada):** `src/proxy.ts` + `src/lib/auth.ts:getSessionUser()` + `requireSessionTenant`/`requireApiContext` (nunca confiar em header `X-Tenant-Id` exceto `SUPER_ADMIN` em `src/lib/api-context.ts:28`) — POC não toca
- **Autorização server (inalterada):** `src/lib/permissions.ts:9 Permission` + `requirePermission(role, "...")` em cada `actions.ts` + `page.tsx` gate (`estoque: inventory.view`, `pdv: sales.create`, `financeiro: financial.view`, etc.); `roles.ts:7 ROLE_RANK` + `admin.ts:5 ROOT_ADMIN_EMAIL` imutável — POC não altera `ROLE_PERMISSIONS`
- **Isolamento multi-tenant (inalterado):** `tenantId` em toda query operacional (`src/services/index.ts:19`, `src/app/dashboard/financeiro/page.tsx:47`); `prisma.$transaction` em `SaleService` — POC não cria nova query sem `tenantId`
- **Histórico imutável (inalterado):** `SaleItem.unitPrice` snapshot (não editar), `StockMovement` append-only, `FinancialMovement` bloqueia edição se `paid=true` (`financeiro/actions.ts:63`), `Product.category` permanece `String` desnormalizada (não migrar para FK agora), `Category` soft-delete se em uso (`categorias/actions.ts:47`) — POC não modifica regra
- **Auditoria (inalterada e estendida):** `src/lib/audit.ts` best-effort em toda mutação (`produtos:46`, `estoque:41`, `categorias:26`, `financeiro:44`, `pdv:76`, `caixa:24`) → `src/app/dashboard/auditoria/page.tsx:14` limita 100 — POC mantém `logAudit` em cada nova mutação (ex.: futura edição PDV)
- **PRG anti-F5 (validado com teste real):** todos os `toggle/update/delete` com `revalidatePath + redirect` (`produtos:80`, `categorias:56`, `financeiro/pay-actions.ts:40`, `pdv:88`); `pdv-client.tsx:63 pending` anti-duplo clique; sem `useEffect` com escrita, sem `GET` que cria. **Validação exigida na POC:** teste real de duplo clique e F5 durante operação (`npm run build` + dev: clicar “Finalizar venda” 2× rápido + F5 na resposta 303 → deve criar apenas 1 `Sale` + 1 `Financial RECEITA` + 1 `auditLog`)

---

## 6. Pontos que exigem decisão antes da POC

1. **Home Opção A:** confirma `src/app/page.tsx` como redirect inteligente (`/dashboard` se logado senão `/login`) vs. manter landing? **Assumido A** (confirmar).
2. **Catálogo PDV:** grid 2 colunas de `Card` por produto (imagem mock + preço/estoque) vs. manter lista atual (`pdv-client.tsx:84 li border p-2`)? Grid aumenta altura mas melhora scan visual — **decidir antes de criar `product-grid.tsx`**.
3. **Confirmação de venda:** `Sheet` lateral (kit `sheet.tsx` já em `src/components/ui/sheet.tsx`) vs. `Dialog` simples? `Sheet` preserva contexto do carrinho; `Dialog` é menor bundle — **decidir**.
4. **Gráfico no PDV:** reuso `DashboardChart` (7 dias) abaixo do carrinho vs. sem gráfico na POC (foco só em venda)? Gráfico já existe e é leaf client — **sugerido incluir, sem `date-fns`**.
5. **Validação do mapeamento:** este documento deve ser confirmado nos arquivos (todos os caminhos acima são reais e verificáveis via `Read`/`Glob`). POC só inicia após `approve` explícito.

---

## 7. Próxima etapa (após aprovação)

- Criar `src/app/dashboard/pdv/_components/product-grid.tsx` + `cart-sheet.tsx` (opcional) como leaf clients, mantendo `page.tsx` server.
- Substituir `src/app/page.tsx` por redirect inteligente (12 linhas).
- `npx prisma generate && npx next build --webpack` (29 → 30 rotas), teste F5 + `pending` + `logAudit`, commit com co-autoria do proprietário.
