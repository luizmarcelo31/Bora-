-- Recria o histórico: Plan e Subscription existem no banco, mas a pasta desta
-- migration nunca foi versionada (só havia a linha failed em
-- `_prisma_migrations`, com finished_at nulo).
--
-- CONTEUDO AJUSTADO EM 02/10/2026 (idempotencia)
-- ------------------------------------------------
-- Esta migration foi marcada como `applied` no banco de producao, entao NUNCA
-- roda la -- por isso o estado real nunca foi.testado por ela. No replay do
-- zero (shadow database / Postgres novo) ela quebrava: a migration
-- 20260926000000_enums_pt_platforma JA cria StatusAssinatura, CicloCobranca,
-- MotivoCancelamento, Plan e Subscription, e esta tentava criar tudo de novo ->
-- ERROR: type "StatusAssinatura" already exists.
--
-- Por isso tudo aqui virou IF NOT EXISTS / DO $$. Assim a migration funciona
-- nos dois lados: no banco de producao (nao-op) e no replay do zero (no-op
-- tambem, porque a 20260926000000 ja fez o trabalho).
--
-- Editing foi feito porque o arquivo esta marked-as-applied; o checksum no
-- banco foi alinhado depois, com o mesmo procedimento de
-- `scripts/corrigir-migration-bom.cjs`. Ver
-- docs/changes/2026-10-02-baseline-migrations.md.

-- Enums (ja criados pela 20260926000000 -- aqui so para o caso de rodar isolada)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StatusAssinatura') THEN
        CREATE TYPE "StatusAssinatura" AS ENUM ('EXPERIMENTACAO', 'ATIVA', 'PENDENTE_PAGAMENTO', 'SUSPENSA', 'CANCELADA', 'ARQUIVADA');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CicloCobranca') THEN
        CREATE TYPE "CicloCobranca" AS ENUM ('MENSAL', 'ANUAL');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MotivoCancelamento') THEN
        CREATE TYPE "MotivoCancelamento" AS ENUM ('SOLICITACAO_CLIENTE', 'FALHA_PAGAMENTO', 'INADIMPLENCIA', 'VIOLACAO_TERMO', 'INICIADA_PLATAFORMA');
    END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Plan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "monthlyPrice" INTEGER NOT NULL DEFAULT 0,
    "annualPrice" INTEGER,
    "maxUsers" INTEGER,
    "maxProducts" INTEGER,
    "maxSalesPerMonth" INTEGER,
    "features" TEXT[],
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "status" "StatusAssinatura" NOT NULL DEFAULT 'EXPERIMENTACAO',
    "billingCycle" "CicloCobranca" NOT NULL DEFAULT 'MENSAL',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" "MotivoCancelamento",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Plan_slug_key" ON "Plan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_tenantId_key" ON "Subscription"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Subscription_renewsAt_idx" ON "Subscription"("renewsAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Subscription_planId_fkey') THEN
        ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Subscription_tenantId_fkey') THEN
        ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
