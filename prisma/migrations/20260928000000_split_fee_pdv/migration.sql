-- Split dinheiro+pix e taxa de maquineta (PDV Expresso)
-- Sale.payments: [{method, amount}] em centavos; nulo = pagamento único
-- Sale.feeAmount: taxa cobrada do cliente, registrada no financeiro como DESPESA
-- TenantSettings.feeCredit/feeDebit: % da maquineta (0 = sem acréscimo)

ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "payments" JSONB;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "feeAmount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "feeCredit" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "feeDebit" DOUBLE PRECISION NOT NULL DEFAULT 0;
