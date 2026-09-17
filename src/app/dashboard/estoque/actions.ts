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
    await InventoryService.registerMovement(tenant.id, parsed);
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
