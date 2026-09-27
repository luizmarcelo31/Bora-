-- Verificação do tenant 3 (tenant de teste E2E).
-- Somente leitura: nenhum INSERT/UPDATE/DELETE aqui.
-- Uso (com DATABASE_URL no ambiente):
--   npx prisma db execute --schema prisma/schema.prisma --file scripts/check-tenant3.sql
--
-- Estado esperado (docs/PROJECT_STATE.md):
-- - vendas, caixas e categorias com marcador [TESTE]
-- - estoque Coca-Cola 25l
-- - settings: controle ligado, sem negativo, desconto máx 10%

SELECT id, name, status, active, suspended FROM "Tenant" WHERE id = 3;
SELECT COUNT(*) AS vendas FROM "Sale" WHERE "tenantId" = 3;
SELECT COUNT(*) AS vendas_teste FROM "Sale" WHERE "tenantId" = 3 AND "customerName" ILIKE '%[TESTE]%';
SELECT COUNT(*) AS categorias FROM "Category" WHERE "tenantId" = 3;
SELECT COUNT(*) AS caixas FROM "CashBox" WHERE "tenantId" = 3;
SELECT p.name AS produto, i.quantity AS estoque FROM "Product" p JOIN "Inventory" i ON i."productId" = p.id WHERE p."tenantId" = 3 AND p.name ILIKE '%coca%';
SELECT "enableDiscount", "maxDiscount", "enableStockControl", "allowNegativeStock" FROM "TenantSettings" WHERE "tenantId" = 3;
SELECT email, role, active FROM "User" WHERE "tenantId" = 3;
