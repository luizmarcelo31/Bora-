"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { SaleService, ProductService } from "@/services";
import { prisma } from "@/lib/db";
import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { createSaleSchema, cancelSaleSchema, ValidationError } from "@/lib/validators";
import { parseBRLToCents } from "@/lib/money";
import { paymentLabel } from "@/lib/payments";

const PAYMENTS = ["CASH", "PIX", "CREDIT", "DEBIT"] as const;

export type CreateSaleResult = { ok: number } | { error: string };

/**
 * Retorna o resultado em vez de redirect: o carrinho (estado client)
 * é preservado no erro e limpo só no sucesso.
 */
export async function createSaleAction(formData: FormData): Promise<CreateSaleResult> {
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
    return { error: "invalid" };
  }
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: "empty" };
  }

  const paymentMethod = String(formData.get("paymentMethod") ?? "CASH");
  if (!PAYMENTS.includes(paymentMethod as (typeof PAYMENTS)[number])) {
    return { error: "invalid" };
  }

  const cashBoxRaw = String(formData.get("cashBoxId") ?? "");
  const cashBoxId = cashBoxRaw ? parseInt(cashBoxRaw, 10) : undefined;
  const discount = parseBRLToCents(formData.get("discount")) ?? 0;

  // Preço sempre do banco (nunca do cliente) + ownership por tenant.
  // 1 query batch em vez de N getProduct (dedup por request via React.cache não cobre loops).
  const wanted = rawItems.map((entry) => ({
    productId: Number(entry.productId),
    quantity: Number(entry.quantity),
  }));
  if (wanted.some((w) => !w.productId || !w.quantity || w.quantity <= 0)) {
    return { error: "invalid" };
  }
  const dbProducts = await prisma.product.findMany({
    where: { tenantId: tenant.id, id: { in: [...new Set(wanted.map((w) => w.productId))] } },
    select: { id: true, price: true, active: true },
  });
  const priceById = new Map(dbProducts.map((p) => [p.id, p]));
  const items = [];
  for (const w of wanted) {
    const product = priceById.get(w.productId);
    if (!product || !product.active) return { error: "invalid" };
    items.push({ productId: w.productId, quantity: w.quantity, unitPrice: product.price, discount: 0 });
  }

  const idempotencyKey = String(formData.get("idempotencyKey") ?? "").trim() || undefined;

  try {
    const parsed = createSaleSchema.parse({
      userId: dbUser.id,
      cashBoxId,
      items,
      discount,
      paymentMethod,
      customerName: String(formData.get("customerName") ?? ""),
      idempotencyKey,
    });
    const sale = await SaleService.createSale(tenant.id, parsed);
    const { logAudit } = await import("@/lib/audit");
    await logAudit({
      tenantId: tenant.id,
      action: "create",
      entity: "sale",
      entityId: sale.id,
      userId: dbUser.id,
      userEmail: dbUser.email,
      changes: { total: sale.total, items: sale.items?.length ?? items.length, idempotencyKey },
      details: `Venda #${sale.id} ${paymentLabel(sale.paymentMethod)} ${sale.total}`,
    });
    revalidatePath("/dashboard/pdv");
    return { ok: sale.id };
  } catch (e) {
    if (e instanceof ValidationError) {
      if (e.type === "INSUFFICIENT_STOCK") return { error: "stock" };
      if (e.type === "INVALID_DISCOUNT") return { error: "discount" };
      if (e.type === "CLOSED_CASHBOX") return { error: "cashbox" };
      return { error: "invalid" };
    }
    console.error("[createSaleAction] falha inesperada", {
      tenantId: tenant.id,
      items: rawItems,
      paymentMethod,
      cashBoxId,
      cause: e instanceof Error ? e.message : String(e),
    });
    return { error: "sale" };
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
  const reasonRaw = String(formData.get("reason") ?? "").trim();
  const reasonParsed = cancelSaleSchema.safeParse({ reason: reasonRaw });
  if (!saleId || !reasonParsed.success) redirect("/dashboard/pdv?error=invalid");
  try {
    const saleBefore = await prisma.sale.findFirst({ where: { id: saleId, tenantId: tenant.id } });
    await SaleService.cancelSale(tenant.id, saleId);
    // Estorno financeiro: se havia RECEITA, criar DESPESA de estorno
    const { FinancialService: FinancialService2 } = await import("@/services");
    if (saleBefore) {
      await FinancialService2.registerMovement(tenant.id, {
        type: "DESPESA",
        category: "Estorno PDV",
        description: `Estorno venda #${saleBefore.id} — ${reasonParsed.data.reason}`,
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
      details: `Motivo: ${reasonParsed.data.reason}`,
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
