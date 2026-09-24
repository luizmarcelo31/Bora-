"use server";

import { prisma } from "@/lib/db";
import { requireSessionTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createInventoryCountAction(formData: FormData) {
  const { tenant } = await requireSessionTenant("/dashboard/inventario");

  const type = formData.get("type") as "FULL" | "PARTIAL";
  if (!type) redirect("/dashboard/inventario?error=invalid");

  try {
    await prisma.inventoryCount.create({
      data: {
        tenantId: tenant.id,
        type,
        status: "OPEN",
      },
    });
  } catch (err) {
    console.error("[createInventoryCountAction]", err);
    redirect("/dashboard/inventario?error=fail");
  }

  revalidatePath("/dashboard/inventario");
  redirect("/dashboard/inventario?ok=1");
}

export async function finalizeInventoryCountAction(formData: FormData) {
  const { tenant } = await requireSessionTenant("/dashboard/inventario");
  const countId = parseInt(formData.get("countId") as string, 10);

  if (isNaN(countId)) redirect("/dashboard/inventario?error=invalid");

  try {
    await prisma.inventoryCount.update({
      where: { id: countId, tenantId: tenant.id },
      data: { status: "COMPLETED", finishedAt: new Date() },
    });
  } catch (err) {
    console.error("[finalizeInventoryCountAction]", err);
    redirect("/dashboard/inventario?error=fail");
  }

  revalidatePath("/dashboard/inventario");
  redirect("/dashboard/inventario?ok=1");
}
