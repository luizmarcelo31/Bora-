-- Colunas de atacado no Product, usadas pelo PDV (src/app/dashboard/pdv).
--
-- O schema.prisma declara wholesalePrice e wholesaleMinQuantity e o PDV le as
-- duas em actions.ts, mas nenhuma migration criava as colunas e elas tambem
-- nao existiam no Postgres de producao -- mais uma tabela/coluna que nasceu
-- fora do historico versionado (a mesma armadilha da
-- 20260925000000_baseline_7_tabelas).
--
-- IF NOT EXISTS para o migration ser reexecutavel sem risco.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "wholesaleMinQuantity" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "wholesalePrice" INTEGER;
