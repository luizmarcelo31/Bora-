-- Adiciona CREDIT e DEBIT ao enum PaymentMethod.
-- Reescrita transacional-segura (ALTER TYPE ... ADD VALUE nao roda dentro de transacao).
ALTER TABLE "Sale" ALTER COLUMN "paymentMethod" DROP DEFAULT;
CREATE TYPE "PaymentMethod_new" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'PIX', 'CHECK', 'OTHER', 'CREDIT', 'DEBIT');
ALTER TABLE "Sale" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING "paymentMethod"::text::"PaymentMethod_new";
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
ALTER TABLE "Sale" ALTER COLUMN "paymentMethod" SET DEFAULT 'CASH'::"PaymentMethod";
DROP TYPE "PaymentMethod_old";
