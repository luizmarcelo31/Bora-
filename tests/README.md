# Testes

## Unit (Vitest, sem banco)
```bash
npm test
```
`src/lib/*.test.ts`: money, payments, audit-labels, validators (schemas), permissions.

## E2E (Playwright, ROADMAP item 9)
```bash
E2E_EMAIL=teste@empresa.com E2E_PASSWORD=... npm run test:e2e
```
- `auth.setup.ts`: login via UI → `tests/e2e/.auth.json` (ignorado no git).
- `smoke.spec.ts`: 9 rotas 200, sem pageerrors.
- `navigation.spec.ts`: busca global, tabs, toast com limpeza de URL.
- `mobile-tables.spec.ts`: viewport iPhone 13, scroll interno, sem overflow da página.
- `sale-flow.spec.ts`: venda + cancelamento reais — **só com `E2E_WRITE=1`**
  (requer produto com estoque; faz cleanup sozinho, estoque net-zero).
- `admin-platform.spec.ts`: admin só leitura (command center, 6 rotas 200,
  busca com filtro por URL, pagina fora do alcance, empresa 360).
  Guards deslogados rodam sempre; resto exige `E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD`.
- `role-redirect.spec.ts`: matriz role × rota + open-redirect.

## Tenant 3 (massa de teste)
```bash
npx prisma db execute --schema prisma/schema.prisma --file scripts/check-tenant3.sql
```
Somente leitura. Requer `DATABASE_URL` no ambiente. Estado esperado:
vendas/caixas/categorias `[TESTE]`, Coca-Cola 25l em estoque, settings com
controle ligado, sem negativo, desconto máx 10%.
