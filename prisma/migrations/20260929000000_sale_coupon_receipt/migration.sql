-- Cupom não-fiscal: sequência diária + recebido/troco na venda
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "couponSeq" INTEGER;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "couponDate" TIMESTAMP(3);
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "receivedAmount" INTEGER;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "changeAmount" INTEGER DEFAULT 0;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Sale_tenantId_couponDate_couponSeq_key'
  ) THEN
    ALTER TABLE "Sale" ADD CONSTRAINT "Sale_tenantId_couponDate_couponSeq_key" UNIQUE ("tenantId", "couponDate", "couponSeq");
  END IF;
END $$;
