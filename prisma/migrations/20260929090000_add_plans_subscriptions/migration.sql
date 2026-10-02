-- Recria o histórico: Plan e Subscription existem no banco, mas a pasta desta
-- migration nunca foi versionada (só havia a linha failed em
-- `_prisma_migrations`, com finished_at nulo).
--
-- As tabelas abaixo foram conferidas coluna a coluna contra o schema.prisma
-- antes desta pasta ser criada, então o conteúdo é o estado real do banco —
-- por isso esta migration está marcada como `applied` e nunca roda de novo
-- sobre a instância existente. Ela existe para que o histórico de migrations
-- reconstrua o banco do zero, que antes não era possível.
--
-- Ver docs/AI_RULES.md (banco é estado compartilhado) e
-- docs/changes/2026-10-02-modo-offline-pdv.md.

-- CreateEnum
CREATE TYPE "StatusAssinatura" AS ENUM ('EXPERIMENTACAO', 'ATIVA', 'PENDENTE_PAGAMENTO', 'SUSPENSA', 'CANCELADA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "CicloCobranca" AS ENUM ('MENSAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "MotivoCancelamento" AS ENUM ('SOLICITACAO_CLIENTE', 'FALHA_PAGAMENTO', 'INADIMPLENCIA', 'VIOLACAO_TERMO', 'INICIADA_PLATAFORMA');

-- CreateTable
CREATE TABLE "Plan" (
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
CREATE TABLE "Subscription" (
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
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_tenantId_key" ON "Subscription"("tenantId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_renewsAt_idx" ON "Subscription"("renewsAt");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
