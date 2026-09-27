-- ============================================================
-- ENUMS EM PORTUGUES + MODELOS DE PLATAFORMA
-- ============================================================

-- ============================================================
-- 1. RENOMEAR TIPOS DE ENUM (PostgreSQL nao tem RENAME TYPE para enums:
--    cria-se o novo com os valores antigos e converte as colunas)
-- ============================================================

-- ---------- Funcao (antes Role) ----------
CREATE TYPE "Funcao" AS ENUM ('SUPER_ADMIN', 'PROPRIETARIO', 'GERENTE', 'FINANCEIRO', 'ESTOQUISTA', 'CAIXA', 'FUNCIONARIO');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Funcao" USING "role"::text::"Funcao";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'FUNCIONARIO';
DROP TYPE "Role";

-- ---------- TipoMovimentacaoEstoque (antes StockMovementType) ----------
CREATE TYPE "TipoMovimentacaoEstoque" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE', 'VENDA', 'DEVOLUCAO', 'TRANSFERENCIA', 'PERDA', 'AVARIA');

ALTER TABLE "StockMovement" ALTER COLUMN "type" TYPE "TipoMovimentacaoEstoque" USING "type"::text::"TipoMovimentacaoEstoque";
DROP TYPE "StockMovementType";

-- ---------- StatusVenda (antes SaleStatus) ----------
CREATE TYPE "StatusVenda" AS ENUM ('PENDENTE', 'CONCLUIDA', 'CANCELADA');

ALTER TABLE "Sale" ALTER COLUMN "status" DROP DEFAULT;
-- PENDING -> PENDENTE, COMPLETED -> CONCLUIDA, CANCELLED -> CANCELADA
ALTER TABLE "Sale" ALTER COLUMN "status" TYPE "StatusVenda"
  USING (CASE "status"::text
    WHEN 'PENDING' THEN 'PENDENTE'
    WHEN 'COMPLETED' THEN 'CONCLUIDA'
    WHEN 'CANCELLED' THEN 'CANCELADA'
  END)::"StatusVenda";
ALTER TABLE "Sale" ALTER COLUMN "status" SET DEFAULT 'CONCLUIDA';
DROP TYPE "SaleStatus";

-- ---------- FormaPagamento (antes PaymentMethod) ----------
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'CARTAO', 'TRANSFERENCIA', 'PIX', 'CHEQUE', 'OUTRO', 'CREDITO', 'DEBITO');

ALTER TABLE "Sale" ALTER COLUMN "paymentMethod" DROP DEFAULT;
ALTER TABLE "Sale" ALTER COLUMN "paymentMethod" TYPE "FormaPagamento"
  USING (CASE "paymentMethod"::text
    WHEN 'CASH' THEN 'DINHEIRO'
    WHEN 'CARD' THEN 'CARTAO'
    WHEN 'TRANSFER' THEN 'TRANSFERENCIA'
    WHEN 'CHECK' THEN 'CHEQUE'
    WHEN 'OTHER' THEN 'OUTRO'
    WHEN 'CREDIT' THEN 'CREDITO'
    WHEN 'DEBIT' THEN 'DEBITO'
  END)::"FormaPagamento";
ALTER TABLE "Sale" ALTER COLUMN "paymentMethod" SET DEFAULT 'DINHEIRO';
DROP TYPE "PaymentMethod";

-- ---------- StatusCaixa (antes CashBoxStatus) ----------
CREATE TYPE "StatusCaixa" AS ENUM ('FECHADO', 'ABERTO');

ALTER TABLE "CashBox" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "CashBox" ALTER COLUMN "status" TYPE "StatusCaixa"
  USING (CASE "status"::text
    WHEN 'CLOSED' THEN 'FECHADO'
    WHEN 'OPEN' THEN 'ABERTO'
  END)::"StatusCaixa";
ALTER TABLE "CashBox" ALTER COLUMN "status" SET DEFAULT 'FECHADO';
DROP TYPE "CashBoxStatus";

-- ---------- TipoMovimentacaoFinanceira (antes FinancialMovementType) ----------
CREATE TYPE "TipoMovimentacaoFinanceira" AS ENUM ('RECEITA', 'DESPESA', 'TRANSFERENCIA');

ALTER TABLE "FinancialMovement" ALTER COLUMN "type" TYPE "TipoMovimentacaoFinanceira" USING "type"::text::"TipoMovimentacaoFinanceira";
DROP TYPE "FinancialMovementType";

-- ---------- TipoCategoria (antes CategoryKind) ----------
CREATE TYPE "TipoCategoria" AS ENUM ('PRODUTO', 'FINANCEIRO');

ALTER TABLE "Category" ALTER COLUMN "kind" TYPE "TipoCategoria"
  USING (CASE "kind"::text
    WHEN 'PRODUCT' THEN 'PRODUTO'
    WHEN 'FINANCIAL' THEN 'FINANCEIRO'
  END)::"TipoCategoria";
DROP TYPE "CategoryKind";

-- ---------- TipoPromocao (antes PromotionType) ----------
CREATE TYPE "TipoPromocao" AS ENUM ('PERCENTUAL', 'VALOR_FIXO', 'COMBO');

ALTER TABLE "Promotion" ALTER COLUMN "type" TYPE "TipoPromocao"
  USING (CASE "type"::text
    WHEN 'PERCENTAGE' THEN 'PERCENTUAL'
    WHEN 'FIXED_AMOUNT' THEN 'VALOR_FIXO'
  END)::"TipoPromocao";
DROP TYPE "PromotionType";

-- ---------- StatusCompra (antes PurchaseStatus) ----------
CREATE TYPE "StatusCompra" AS ENUM ('PENDENTE', 'RECEBIDA', 'CANCELADA');

ALTER TABLE "Purchase" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Purchase" ALTER COLUMN "status" TYPE "StatusCompra"
  USING (CASE "status"::text
    WHEN 'PENDING' THEN 'PENDENTE'
    WHEN 'RECEIVED' THEN 'RECEBIDA'
    WHEN 'CANCELLED' THEN 'CANCELADA'
  END)::"StatusCompra";
ALTER TABLE "Purchase" ALTER COLUMN "status" SET DEFAULT 'PENDENTE';
DROP TYPE "PurchaseStatus";

-- ---------- StatusInventario (antes CountStatus) ----------
CREATE TYPE "StatusInventario" AS ENUM ('ABERTO', 'CONCLUIDO', 'CANCELADO');

ALTER TABLE "InventoryCount" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "InventoryCount" ALTER COLUMN "status" TYPE "StatusInventario"
  USING (CASE "status"::text
    WHEN 'OPEN' THEN 'ABERTO'
    WHEN 'COMPLETED' THEN 'CONCLUIDO'
    WHEN 'CANCELLED' THEN 'CANCELADO'
  END)::"StatusInventario";
ALTER TABLE "InventoryCount" ALTER COLUMN "status" SET DEFAULT 'ABERTO';
DROP TYPE "CountStatus";

-- ---------- TipoInventario (antes CountType) ----------
CREATE TYPE "TipoInventario" AS ENUM ('TOTAL', 'PARCIAL');

ALTER TABLE "InventoryCount" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "InventoryCount" ALTER COLUMN "type" TYPE "TipoInventario"
  USING (CASE "type"::text
    WHEN 'FULL' THEN 'TOTAL'
    WHEN 'PARTIAL' THEN 'PARCIAL'
  END)::"TipoInventario";
ALTER TABLE "InventoryCount" ALTER COLUMN "type" SET DEFAULT 'TOTAL';
DROP TYPE "CountType";

-- ============================================================
-- 2. ENUMS NOVOS DE PLATAFORMA
-- ============================================================

CREATE TYPE "StatusEmpresa" AS ENUM ('TRIAL', 'ATIVA', 'SUSPENSA', 'CANCELADA', 'ARQUIVADA');
CREATE TYPE "StatusSaude" AS ENUM ('SAUDAVEL', 'ATENCAO', 'CRITICA', 'DESCONHECIDO');
CREATE TYPE "StatusAssinatura" AS ENUM ('EXPERIMENTACAO', 'ATIVA', 'PENDENTE_PAGAMENTO', 'SUSPENSA', 'CANCELADA', 'ARQUIVADA');
CREATE TYPE "CicloCobranca" AS ENUM ('MENSAL', 'ANUAL');
CREATE TYPE "MotivoCancelamento" AS ENUM ('SOLICITACAO_CLIENTE', 'FALHA_PAGAMENTO', 'INADIMPLENCIA', 'VIOLACAO_TERMO', 'INICIADA_PLATAFORMA');
CREATE TYPE "StatusTicket" AS ENUM ('ABERTO', 'EM_ANALISE', 'AGUARDANDO_CLIENTE', 'RESOLVIDO', 'FECHADO');
CREATE TYPE "PrioridadeTicket" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');
CREATE TYPE "AcaoAuditoria" AS ENUM (
  'EMPRESA_CRIADA',
  'EMPRESA_STATUS_ALTERADO',
  'EMPRESA_ARQUIVADA',
  'ASSINATURA_ALTERADA',
  'PLANO_ALTERADO',
  'USUARIO_CRIADO',
  'USUARIO_ALTERADO',
  'USUARIO_DESATIVADO',
  'FUNCAO_ALTERADA',
  'TICKET_ALTERADO',
  'COMUNICACAO_ENVIADA',
  'CONFIGURACAO_ALTERADA'
);
CREATE TYPE "StatusEnvio" AS ENUM ('RASCUNHO', 'AGENDADO', 'ENVIANDO', 'ENVIADO', 'FALHOU');
CREATE TYPE "AlvoNotificacao" AS ENUM ('TODAS_EMPRESAS', 'POR_PLANO', 'POR_EMPRESA', 'POR_FUNCAO');
CREATE TYPE "StatusIntegracao" AS ENUM ('CONECTADA', 'DESCONECTADA', 'ERRO', 'PENDENTE');

-- ============================================================
-- 3. CICLO DE VIDA DA EMPRESA
-- ============================================================

ALTER TABLE "Tenant" ADD COLUMN "status" "StatusEmpresa" NOT NULL DEFAULT 'ATIVA';
ALTER TABLE "Tenant" ADD COLUMN "health" "StatusSaude" NOT NULL DEFAULT 'DESCONHECIDO';
ALTER TABLE "Tenant" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN "lastActivityAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN "suspendedAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN "suspensionReason" TEXT;

CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");
CREATE INDEX "Tenant_health_idx" ON "Tenant"("health");
CREATE INDEX "Tenant_lastActivityAt_idx" ON "Tenant"("lastActivityAt");

-- ============================================================
-- 4. PLANOS E ASSINATURAS
-- ============================================================

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

CREATE UNIQUE INDEX "Subscription_tenantId_key" ON "Subscription"("tenantId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Subscription_renewsAt_idx" ON "Subscription"("renewsAt");
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- 5. SUPORTE
-- ============================================================

CREATE TABLE "Ticket" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "StatusTicket" NOT NULL DEFAULT 'ABERTO',
    "priority" "PrioridadeTicket" NOT NULL DEFAULT 'MEDIA',
    "assigneeId" INTEGER,
    "slaDueAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketMessage" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "internal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Ticket_tenantId_idx" ON "Ticket"("tenantId");
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");
CREATE INDEX "Ticket_priority_idx" ON "Ticket"("priority");
CREATE INDEX "TicketMessage_ticketId_idx" ON "TicketMessage"("ticketId");

ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- 6. AUDITORIA DE PLATAFORMA (tenantId opcional)
-- ============================================================

CREATE TABLE "PlatformAuditLog" (
    "id" SERIAL NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "action" "AcaoAuditoria" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" INTEGER,
    "tenantId" INTEGER,
    "before" TEXT,
    "after" TEXT,
    "metadata" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlatformAuditLog_action_idx" ON "PlatformAuditLog"("action");
CREATE INDEX "PlatformAuditLog_tenantId_idx" ON "PlatformAuditLog"("tenantId");
CREATE INDEX "PlatformAuditLog_entity_idx" ON "PlatformAuditLog"("entity");
CREATE INDEX "PlatformAuditLog_createdAt_idx" ON "PlatformAuditLog"("createdAt");

-- ============================================================
-- 7. COMUNICACAO, CONFIGURACOES E INTEGRACOES
-- ============================================================

CREATE TABLE "Broadcast" (
    "id" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "target" "AlvoNotificacao" NOT NULL DEFAULT 'TODAS_EMPRESAS',
    "targetRef" TEXT,
    "status" "StatusEnvio" NOT NULL DEFAULT 'RASCUNHO',
    "sentAt" TIMESTAMP(3),
    "recipients" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlatformSettings" (
    "id" SERIAL NOT NULL,
    "supportEmail" TEXT,
    "defaultTrialDays" INTEGER NOT NULL DEFAULT 14,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'BRL',
    "defaultTimezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "auditRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Integracao" (
    "id" SERIAL NOT NULL,
    "platformSettingsId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "StatusIntegracao" NOT NULL DEFAULT 'PENDENTE',
    "externalAccount" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Integracao_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Broadcast_status_idx" ON "Broadcast"("status");
CREATE UNIQUE INDEX "Integracao_key_key" ON "Integracao"("key");

ALTER TABLE "Integracao" ADD CONSTRAINT "Integracao_platformSettingsId_fkey" FOREIGN KEY ("platformSettingsId") REFERENCES "PlatformSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
