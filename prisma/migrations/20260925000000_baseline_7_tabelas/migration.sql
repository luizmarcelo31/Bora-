-- Baseline das 7 tabelas criadas fora do historico versionado.
--
-- PROBLEMA QUE ESTA MIGRATION RESOLVE
-- ------------------------------------
-- Promotion, PromotionItem, Supplier, Purchase, PurchaseItem, InventoryCount e
-- InventoryCountItem existem em schema.prisma e no Postgres de producao, mas
-- nenhuma migration criava as tabelas: foram feitas fora do historico. Como
-- `prisma migrate dev` monta um shadow database do zero e so executa as
-- migrations, o shadow nunca tinha essas tabelas e o Prisma falhava com P1014.
-- Pior: a migration 20260926000000_enums_pt_platforma faz ALTER TABLEnesses
-- tabelas, entao ela tambem quebrava no shadow.
--
-- POR QUE FICA ANTES DE 20260926000000
-- ------------------------------------
-- O timestamp desta migration e 20260925, um dia ANTES da de enums, e isso e
-- obrigatorio. A 20260926000000 converte os enums de ingles para portugues:
--   PromotionType -> TipoPromocao, PurchaseStatus -> StatusCompra,
--   CountStatus -> StatusInventario, CountType -> TipoInventario
-- Para essa conversao rodar, as tabelas precisam ja existir E com os enums
-- antigos (ingles). Por isso esta migration cria as tabelas nos nomes antigos.
-- Depois a 20260926000000 converte e o schema final bate com schema.prisma.
-- Nao mova esta migration para depois de 20260926000000.
--
-- IDEMPOTENCIA
-- ------------
-- IF NOT EXISTS em tudo, e cada FK dentro de um DO $$ que checa pg_constraint
-- (Postgres nao tem ADD CONSTRAINT IF NOT EXISTS). No banco de producao as
-- tabelas ja existem e nada acontece; em shadow/Postgres novo cria do zero.
--
-- Detalhe completo em docs/changes/2026-10-02-baseline-migrations.md

-- Enums originais (ingles) dessas 7 tabelas. Nenhuma migration os criava, e a
-- 20260926000000 faz DROP TYPE deles ao converter para portugues.
-- Postgres nao tem CREATE TYPE IF NOT EXISTS, entao cada um vai em DO $$.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PromotionType') THEN
        CREATE TYPE "PromotionType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'COMBO');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PurchaseStatus') THEN
        CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'RECEIVED', 'CANCELLED');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CountStatus') THEN
        CREATE TYPE "CountStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CountType') THEN
        CREATE TYPE "CountType" AS ENUM ('FULL', 'PARTIAL');
    END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Promotion" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PromotionType" NOT NULL,
    "value" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PromotionItem" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "promotionId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "PromotionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Supplier" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "contact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Purchase" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "total" INTEGER NOT NULL,
    "invoiceKey" TEXT,
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PurchaseItem" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "purchaseId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "InventoryCount" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "status" "CountStatus" NOT NULL DEFAULT 'OPEN',
    "type" "CountType" NOT NULL DEFAULT 'FULL',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryCount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "InventoryCountItem" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "inventoryCountId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "expectedQuantity" INTEGER NOT NULL,
    "countedQuantity" INTEGER,
    "divergence" INTEGER,

    CONSTRAINT "InventoryCountItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: Promotion_tenantId_fkey (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Promotion_tenantId_fkey'
    ) THEN
        ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: PromotionItem_tenantId_fkey (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PromotionItem_tenantId_fkey'
    ) THEN
        ALTER TABLE "PromotionItem" ADD CONSTRAINT "PromotionItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: PromotionItem_promotionId_fkey (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PromotionItem_promotionId_fkey'
    ) THEN
        ALTER TABLE "PromotionItem" ADD CONSTRAINT "PromotionItem_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: PromotionItem_productId_fkey (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PromotionItem_productId_fkey'
    ) THEN
        ALTER TABLE "PromotionItem" ADD CONSTRAINT "PromotionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: Supplier_tenantId_fkey (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Supplier_tenantId_fkey'
    ) THEN
        ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: Purchase_tenantId_fkey (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Purchase_tenantId_fkey'
    ) THEN
        ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: Purchase_supplierId_fkey (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Purchase_supplierId_fkey'
    ) THEN
        ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: PurchaseItem_tenantId_fkey (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PurchaseItem_tenantId_fkey'
    ) THEN
        ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: PurchaseItem_purchaseId_fkey (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PurchaseItem_purchaseId_fkey'
    ) THEN
        ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: PurchaseItem_productId_fkey (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PurchaseItem_productId_fkey'
    ) THEN
        ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: InventoryCount_tenantId_fkey (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'InventoryCount_tenantId_fkey'
    ) THEN
        ALTER TABLE "InventoryCount" ADD CONSTRAINT "InventoryCount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: InventoryCountItem_tenantId_fkey (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'InventoryCountItem_tenantId_fkey'
    ) THEN
        ALTER TABLE "InventoryCountItem" ADD CONSTRAINT "InventoryCountItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: InventoryCountItem_inventoryCountId_fkey (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'InventoryCountItem_inventoryCountId_fkey'
    ) THEN
        ALTER TABLE "InventoryCountItem" ADD CONSTRAINT "InventoryCountItem_inventoryCountId_fkey" FOREIGN KEY ("inventoryCountId") REFERENCES "InventoryCount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: InventoryCountItem_productId_fkey (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'InventoryCountItem_productId_fkey'
    ) THEN
        ALTER TABLE "InventoryCountItem" ADD CONSTRAINT "InventoryCountItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Promotion_tenantId_idx" ON "Promotion"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Promotion_active_idx" ON "Promotion"("active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PromotionItem_tenantId_idx" ON "PromotionItem"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PromotionItem_promotionId_productId_key" ON "PromotionItem"("promotionId", "productId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Supplier_tenantId_idx" ON "Supplier"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Supplier_active_idx" ON "Supplier"("active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Purchase_tenantId_idx" ON "Purchase"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Purchase_supplierId_idx" ON "Purchase"("supplierId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Purchase_status_idx" ON "Purchase"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PurchaseItem_tenantId_idx" ON "PurchaseItem"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PurchaseItem_purchaseId_idx" ON "PurchaseItem"("purchaseId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PurchaseItem_productId_idx" ON "PurchaseItem"("productId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InventoryCount_tenantId_idx" ON "InventoryCount"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InventoryCount_status_idx" ON "InventoryCount"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InventoryCountItem_tenantId_idx" ON "InventoryCountItem"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InventoryCountItem_inventoryCountId_idx" ON "InventoryCountItem"("inventoryCountId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InventoryCountItem_productId_idx" ON "InventoryCountItem"("productId");
