# DATABASE

- **Motor:** PostgreSQL (Supabase) · **ORM:** Prisma 6 · **Schema:** `prisma/schema.prisma`
- **Conexão:** pooler Supabase — `DATABASE_URL` (6543, pgbouncer) + `DIRECT_URL` (5432, migrations).
- **Migration inicial:** `prisma/migrations/20260917125414_init/`

## Modelos
Tenant, User (Role), Product, Inventory, StockMovement, Sale, SaleItem,
CashBox, FinancialMovement, DailyReport, AuditLog, TenantSettings.

## Princípios
- Todo dado operacional tem `tenantId` + índice.
- Soft delete em Product (`active=false`).
- Valores monetários em centavos (`Int`).
- Estoque nunca editado direto: só via `StockMovement` em transação.
- Alterações de schema sempre via `npx prisma migrate dev --name <desc>` + `npx prisma generate`.

## Comandos
```bash
npx prisma migrate dev --name init
npx prisma generate
npx prisma studio
```
