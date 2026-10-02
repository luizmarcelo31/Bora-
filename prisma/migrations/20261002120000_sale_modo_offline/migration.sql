-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "occurredAt" TIMESTAMP(3),
ADD COLUMN     "offline" BOOLEAN NOT NULL DEFAULT false;