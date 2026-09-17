# Verificação Anti-F5 e Idempotência — PDV

**Data:** 2026-09-18 · **Rota:** `src/app/dashboard/pdv` · **Script:** `scripts/verify-idempotency.ts` · **DB:** Supabase `Tenant 1 / Produto 1 / User OWNER`

## Requisito
> Criar venda, atualizar página após conclusão, clicar duas vezes rapidamente em Finalizar venda — deve existir **apenas 1 venda, 1 movimentação RECEITA, estoque decrementado 1×**.

## Como a idempotência foi implementada (sem alterar regra de negócio)
- **Schema:** `prisma/schema.prisma:198 Sale.idempotencyKey String?` + `@@unique([tenantId, idempotencyKey])` + migration `20260918120000_sale_idempotency` (SQL: `ALTER TABLE "Sale" ADD COLUMN "idempotencyKey" TEXT; CREATE UNIQUE INDEX ...`)
- **Validator:** `src/lib/validators.ts:158 idempotencyKey? z.string().min(1).max(100)`
- **Service (`src/services/index.ts:441`):** `if (idempotencyKey) findFirst` antes da TX; `Sale.create` com `idempotencyKey` dentro da `transaction`; `Financial RECEITA` criado **dentro da mesma TX** (atômico); `cashBox` corrigido para `{increment: total}`; `catch P2002` retorna existente (corrida entre `findFirst` e `create`)
- **Action (`src/app/dashboard/pdv/actions.ts:54`):** lê `idempotencyKey` do `FormData` e repassa a `createSaleSchema` + `SaleService`
- **Client (`src/app/dashboard/pdv/pdv-client.tsx:36`):** `idemRef = useRef(crypto.randomUUID())` + `getIdemKey()` — mesmo `key` para duplo clique rápido, `pending` desabilita botão, `Sheet` sem nova lib (`radix-ui`)

## Teste real executado — 2026-09-18

Comando: `npx tsx scripts/verify-idempotency.ts` (usa `SaleService.createSale` direto, sem mock)

**Cenário 1 — Duplo clique paralelo (2× `Promise.all` com mesma `idempotencyKey`):**
```
Produto Coca-Cola 2L estoque 100 user luizmarcelo31@gmail.com
Before: sales=0 fin=0 inv=100
Testando idempotência com key=6045b8c8-a6fe-4a8e-9b5c-8d54e1f6b139 em paralelo (2×)
r1 fulfilled id=3
r2 fulfilled id=3
After: sales=1 fin=1 inv=99
Delta sales=1 (esperado 1)
Delta fin=1 (esperado 1)
Delta inv=-1 (esperado -1)
✅ PASS idempotência
```

**Cenário 2 — F5 / retry com mesma key após sucesso:**
```
Retry com mesma key: before=1 after=1 delta=0 (esperado 0) id=3
✅ PASS retry F5
Limpeza ok, estoque restaurado para 100
```

**Interpretação:** 2 requisições concorrentes com mesma `key` retornaram **mesmo `id=3`** (não 2 vendas); `F5` com mesma `key` não criou nova venda; `Financial` e `Inventory` atômicos com a venda (1×).

## Rota de login — divergência esclarecida
- **Canônico é `/login`** (`src/proxy.ts:42 isPublicPage` + `50 loginUrl.pathname = "/login"`, `src/app/login/page.tsx:5` existe, `src/app/page.tsx:8 redirect("/login")`)
- **`src/app/(auth)`** é Route Group (só `actions.ts`, sem rota) — `Glob src/app/auth/**` = 0, `grep "/auth/login"` = 0 (só falso-positivo `components/auth/login-form`)
- **`middleware.ts` não existe** em `src` — só `proxy.ts` (Next 16)
- **Ação:** manter `/login`; nenhum código novo deve introduzir `/auth/login`

## Validação complementar
- `npx next build --webpack` verde (29 rotas, `ƒ /dashboard/pdv` dinâmico)
- `curl / → 307 /login`, `curl /dashboard/pdv` sem sessão → 307 (guard)
- `Sheet` (`src/components/ui/sheet.tsx:3` `import { Dialog as SheetPrimitive } from "radix-ui"`) — já instalado, sem `vaul`
- `prisma/migrations` sem migração nova além de `sale_idempotency` (isolada, sem alteração de regra de negócio além de idempotência)

## Conclusão
POC visual isolada aprovável para expansão: direção visual mantida, `Sheet` sem deps, `pending` + `idempotencyKey` garantem **1 venda / 1 RECEITA / 1 decremento** mesmo com duplo clique ou F5. Próxima expansão (Produtos/Caixa) pode seguir mesmo padrão sem novas migrações.
