"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { InventoryService, ProductService } from "@/services";
import { prisma } from "@/lib/db";
import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { createStockMovementSchema } from "@/lib/validators";

const TYPES = ["ENTRADA", "SAIDA", "AJUSTE"] as const;

export async function moveStockAction(formData: FormData) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/estoque");

  try {
    requirePermission(dbUser.role as Role, "inventory.move");
  } catch {
    redirect("/dashboard/estoque?error=forbidden");
  }

  const productId = parseInt(String(formData.get("productId") ?? "0"), 10);
  const type = String(formData.get("type") ?? "");
  const quantity = parseInt(String(formData.get("quantity") ?? "0"), 10);
  const reason = String(formData.get("reason") ?? "");

  if (!productId || !TYPES.includes(type as (typeof TYPES)[number]) || !quantity || quantity <= 0) {
    redirect("/dashboard/estoque?error=invalid");
  }

  try {
    const inventory = await InventoryService.getInventory(tenant.id, productId);
    const parsed = createStockMovementSchema.parse({
      inventoryId: inventory.id,
      type,
      quantity,
      reason,
    });
    const movement = await InventoryService.registerMovement(tenant.id, parsed);
    const { logAudit } = await import("@/lib/audit");
    await logAudit({
      tenantId: tenant.id,
      action: "move",
      entity: "stock",
      entityId: movement.id,
      userId: dbUser.id,
      userEmail: dbUser.email,
      changes: parsed,
    });
  } catch {
    redirect("/dashboard/estoque?error=stock");
  }

  revalidatePath("/dashboard/estoque");
  redirect("/dashboard/estoque?ok=1");
}

export async function getStockPageData(tenantId: number) {
  const [products, history] = await Promise.all([
    ProductService.listProducts(tenantId, { active: "all" }),
    prisma.stockMovement.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { inventory: { include: { product: { select: { name: true } } } } },
    }),
  ]);
  return { products, history };
}

export async function updateInventorySettingsAction(formData: FormData) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/estoque");
  try {
    requirePermission(dbUser.role as Role, "inventory.move");
  } catch {
    redirect("/dashboard/estoque?error=forbidden");
  }

  const productId = parseInt(String(formData.get("productId") ?? "0"), 10);
  const minimumRaw = String(formData.get("minimumStock") ?? "").trim();
  const maximumRaw = String(formData.get("maximumStock") ?? "").trim();
  if (!productId) redirect("/dashboard/estoque?error=invalid");

  const minimumStock = minimumRaw === "" ? 0 : parseInt(minimumRaw, 10);
  const maximumStock = maximumRaw === "" ? undefined : parseInt(maximumRaw, 10);

  if (!Number.isInteger(minimumStock) || minimumStock < 0) redirect("/dashboard/estoque?error=invalid");
  if (maximumStock !== undefined && (!Number.isInteger(maximumStock) || maximumStock <= 0))
    redirect("/dashboard/estoque?error=invalid");
  if (maximumStock !== undefined && maximumStock <= minimumStock) redirect("/dashboard/estoque?error=invalid");

  // Verify product belongs to tenant and has inventory
  const inventory = await prisma.inventory.findFirst({ where: { tenantId: tenant.id, productId } });
  if (!inventory) redirect("/dashboard/estoque?error=invalid");

  await prisma.inventory.update({
    where: { id: inventory.id },
    data: { minimumStock, maximumStock: maximumStock ?? null },
  });

  const { logAudit } = await import("@/lib/audit");
  await logAudit({
    tenantId: tenant.id,
    action: "update",
    entity: "inventory",
    entityId: inventory.id,
    userId: dbUser.id,
    userEmail: dbUser.email,
    changes: { minimumStock, maximumStock },
    details: `Estoque produto ${productId} min ${minimumStock} max ${maximumStock ?? "—"}`,
  });

  revalidatePath("/dashboard/estoque");
  redirect("/dashboard/estoque?ok=1");
}
