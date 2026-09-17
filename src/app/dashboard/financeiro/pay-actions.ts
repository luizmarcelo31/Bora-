"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";

export async function togglePaidAction(formData: FormData) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/financeiro");
  try {
    requirePermission(dbUser.role as Role, "financial.create");
  } catch {
    redirect("/dashboard/financeiro?error=forbidden");
  }

  const movementId = parseInt(String(formData.get("movementId") ?? "0"), 10);
  const paid = String(formData.get("paid") ?? "") === "true";
  if (!movementId) redirect("/dashboard/financeiro?error=invalid");

  const m = await prisma.financialMovement.findFirst({
    where: { id: movementId, tenantId: tenant.id },
  });
  if (!m) redirect("/dashboard/financeiro?error=invalid");

  await prisma.financialMovement.update({
    where: { id: movementId },
    data: { paid, paidAt: paid ? new Date() : null },
  });
  const { logAudit } = await import("@/lib/audit");
  await logAudit({
    tenantId: tenant.id,
    action: paid ? "pay" : "unpay",
    entity: "financial",
    entityId: movementId,
    userId: dbUser.id,
    userEmail: dbUser.email,
  });
  revalidatePath("/dashboard/financeiro");
}
