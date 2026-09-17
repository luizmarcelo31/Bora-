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
    revalidatePath("/dashboard/pdv");
    redirect(`/dashboard/pdv?ok=${sale.id}`);
  } catch {
    redirect("/dashboard/pdv?error=stock");
  }
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
