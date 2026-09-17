import { PrismaClient } from "@prisma/client";
import { SaleService } from "@/services";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  const tenantId = 1;
  // Ensure product 1 exists and has inventory
  const product = await prisma.product.findFirst({ where: { id: 1, tenantId }, include: { inventory: true } });
  if (!product) throw new Error("Produto 1 não encontrado");
  const user = await prisma.user.findFirst({ where: { tenantId, role: "OWNER" } });
  if (!user) throw new Error("Usuário OWNER não encontrado");
  console.log(`Produto ${product.name} estoque ${product.inventory?.quantity} user ${user.email}`);

  // Ensure stock sufficient: set to 100 for test
  if (product.inventory) {
    await prisma.inventory.update({ where: { id: product.inventory.id }, data: { quantity: 100 } });
    console.log("Estoque ajustado para 100");
  }

  const beforeSale = await prisma.sale.count({ where: { tenantId } });
  const beforeFin = await prisma.financialMovement.count({ where: { tenantId, category: "Vendas PDV" } });
  const beforeInv = (await prisma.inventory.findFirst({ where: { productId: product.id } }))?.quantity ?? 0;
  console.log(`Before: sales=${beforeSale} fin=${beforeFin} inv=${beforeInv}`);

  const idem = crypto.randomUUID();
  const payload = {
    userId: user.id,
    items: [{ productId: product.id, quantity: 1, unitPrice: product.price, discount: 0 }],
    discount: 0,
    paymentMethod: "CASH" as const,
    customerName: "Teste Idempotência",
    idempotencyKey: idem,
  };

  console.log(`Testando idempotência com key=${idem} em paralelo (2×)`);
  const [r1, r2] = await Promise.allSettled([
    SaleService.createSale(tenantId, payload),
    SaleService.createSale(tenantId, payload),
  ]);
  console.log("r1", r1.status, r1.status === "fulfilled" ? `id=${(r1.value as any).id}` : (r1.reason as Error).message.slice(0,120));
  console.log("r2", r2.status, r2.status === "fulfilled" ? `id=${(r2.value as any).id}` : (r2.reason as Error).message.slice(0,120));

  const afterSale = await prisma.sale.count({ where: { tenantId } });
  const afterFin = await prisma.financialMovement.count({ where: { tenantId, category: "Vendas PDV" } });
  const afterInv = (await prisma.inventory.findFirst({ where: { productId: product.id } }))?.quantity ?? 0;
  console.log(`After: sales=${afterSale} fin=${afterFin} inv=${afterInv}`);
  console.log(`Delta sales=${afterSale - beforeSale} (esperado 1)`);
  console.log(`Delta fin=${afterFin - beforeFin} (esperado 1)`);
  console.log(`Delta inv=${afterInv - beforeInv} (esperado -1)`);
  const ok = (afterSale - beforeSale === 1) && (afterFin - beforeFin === 1) && (afterInv - beforeInv === -1);
  console.log(ok ? "✅ PASS idempotência" : "❌ FAIL idempotência");

  // Teste F5: mesmo idempotencyKey após sucesso deve retornar mesma venda sem criar nova
  const before2 = await prisma.sale.count({ where: { tenantId } });
  const retry = await SaleService.createSale(tenantId, payload);
  const after2 = await prisma.sale.count({ where: { tenantId } });
  console.log(`Retry com mesma key: before=${before2} after=${after2} delta=${after2-before2} (esperado 0) id=${retry.id}`);
  console.log(after2 - before2 === 0 ? "✅ PASS retry F5" : "❌ FAIL retry F5");

  // Limpeza: remover vendas de teste (as com idempotencyKey = idem) e seus financeiros e movimentos
  const toDelete = await prisma.sale.findMany({ where: { tenantId, idempotencyKey: idem } });
  for (const s of toDelete) {
    await prisma.financialMovement.deleteMany({ where: { tenantId, description: { contains: `Venda #${s.id}` } } });
    await prisma.stockMovement.deleteMany({ where: { tenantId, referenceId: s.id, referenceType: "SALE" } });
    await prisma.saleItem.deleteMany({ where: { saleId: s.id } });
    await prisma.sale.delete({ where: { id: s.id } });
  }
  // Restaurar estoque
  await prisma.inventory.update({ where: { id: product.inventory!.id }, data: { quantity: beforeInv } });
  console.log(`Limpeza ok, estoque restaurado para ${beforeInv}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
