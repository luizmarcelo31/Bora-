"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { SaleService, ProductService } from "@/services";
import { prisma } from "@/lib/db";
import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { createSaleSchema } from "@/lib/validators";
import { parseBRLToCents } from "@/lib/money";

const PAYMENTS = ["CASH", "CARD", "TRANSFER", "PIX", "CHECK", "OTHER"] as const;

export async function createSaleAction(formData: FormData) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/pdv");

  try {
    requirePermission(dbUser.role as Role, "sales.create");
  } catch {
    redirect("/dashboard/pdv?error=forbidden");
  }

  let rawItems: { productId: number; quantity: number }[] = [];
  try {
    rawItems = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    redirect("/dashboard/pdv?error=invalid");
  }
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    redirect("/dashboard/pdv?error=empty");
  }

  const paymentMethod = String(formData.get("paymentMethod") ?? "CASH");
  if (!PAYMENTS.includes(paymentMethod as (typeof PAYMENTS)[number])) {
    redirect("/dashboard/pdv?error=invalid");
  }

  const cashBoxRaw = String(formData.get("cashBoxId") ?? "");
  const cashBoxId = cashBoxRaw ? parseInt(cashBoxRaw, 10) : undefined;
  const discount = parseBRLToCents(formData.get("discount")) ?? 0;

  // Preço sempre do banco (nunca do cliente) + ownership por tenant
  const items = [];
  for (const entry of rawItems) {
    const productId = Number(entry.productId);
    const quantity = Number(entry.quantity);
    if (!productId || !quantity || quantity <= 0) redirect("/dashboard/pdv?error=invalid");
    const product = await ProductService.getProduct(tenant.id, productId).catch(() => null);
    if (!product || !product.active) redirect("/dashboard/pdv?error=invalid");
    items.push({ productId, quantity, unitPrice: product.price, discount: 0 });
  }

  try {
    const parsed = createSaleSchema.parse({
      userId: dbUser.id,
      cashBoxId,
      items,
      discount,
      paymentMethod,
      customerName: String(formData.get("customerName") ?? ""),
    });
    const sale = await SaleService.createSale(tenant.id, parsed);
    // PDV → Financeiro (§19 PRD): toda venda gera RECEITA automaticamente
    if (sale.status === "COMPLETED") {
      const { FinancialService } = await import("@/services");
      await FinancialService.registerMovement(tenant.id, {
        type: "RECEITA",
        category: "Vendas PDV",
        description: `Venda #${sale.id} — ${sale.paymentMethod}`,
        amount: sale.total,
        movementDate: sale.createdAt,
        cashBoxId: sale.cashBoxId ?? undefined,
      });
    }
    const { logAudit } = await import("@/lib/audit");
    await logAudit({
      tenantId: tenant.id,
      action: "create",
      entity: "sale",
      entityId: sale.id,
      userId: dbUser.id,
      userEmail: dbUser.email,
      changes: { total: sale.total, items: sale.items?.length ?? items.length },
      details: `Venda #${sale.id} ${sale.paymentMethod} ${sale.total}`,
    });
    revalidatePath("/dashboard/pdv");
    redirect(`/dashboard/pdv?ok=${sale.id}`);
  } catch {
    redirect("/dashboard/pdv?error=stock");
  }
}

export async function cancelSaleAction(formData: FormData) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/pdv");
  try {
    requirePermission(dbUser.role as Role, "sales.cancel");
  } catch {
    redirect("/dashboard/pdv?error=forbidden");
  }
  const saleId = parseInt(String(formData.get("saleId") ?? "0"), 10);
  if (!saleId) redirect("/dashboard/pdv?error=invalid");
  try {
    const saleBefore = await prisma.sale.findFirst({ where: { id: saleId, tenantId: tenant.id } });
    await SaleService.cancelSale(tenant.id, saleId);
    // Estorno financeiro: se havia RECEITA, criar DESPESA de estorno
    const { FinancialService: FinancialService2 } = await import("@/services");
    if (saleBefore) {
      await FinancialService2.registerMovement(tenant.id, {
        type: "DESPESA",
        category: "Estorno PDV",
        description: `Estorno venda #${saleBefore.id}`,
        amount: saleBefore.total,
        movementDate: new Date(),
        cashBoxId: saleBefore.cashBoxId ?? undefined,
      });
    }
    const { logAudit: logAuditCancel } = await import("@/lib/audit");
    await logAuditCancel({
      tenantId: tenant.id,
      action: "cancel",
      entity: "sale",
      entityId: saleId,
      userId: dbUser.id,
      userEmail: dbUser.email,
    });
  } catch {
    redirect("/dashboard/pdv?error=cancel");
  }
  revalidatePath("/dashboard/pdv");
  redirect("/dashboard/pdv?ok=cancel");
}

export async function getPdvPageData(tenantId: number) {
  const [products, cashboxes, todaysSales] = await Promise.all([
    ProductService.listProducts(tenantId),
    prisma.cashBox.findMany({
      where: { tenantId, status: "OPEN" },
      orderBy: { createdAt: "desc" },
    }),
    SaleService.getTodaysSales(tenantId),
  ]);
  return { products, cashboxes, todaysSales };
}
