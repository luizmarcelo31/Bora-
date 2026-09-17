"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { FinancialService } from "@/services";
import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { createFinancialMovementSchema } from "@/lib/validators";
import { parseBRLToCents } from "@/lib/money";

const TYPES = ["RECEITA", "DESPESA", "TRANSFERENCIA"] as const;

export async function createFinancialAction(formData: FormData) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/financeiro");
  try {
    requirePermission(dbUser.role as Role, "financial.create");
  } catch {
    redirect("/dashboard/financeiro?error=forbidden");
  }

  const type = String(formData.get("type") ?? "");
  if (!TYPES.includes(type as (typeof TYPES)[number])) {
    redirect("/dashboard/financeiro?error=invalid");
  }

  const amount = parseBRLToCents(formData.get("amount"));
  if (amount === undefined || amount <= 0) redirect("/dashboard/financeiro?error=invalid");

  const dateRaw = String(formData.get("movementDate") ?? "");
  const cashBoxRaw = String(formData.get("cashBoxId") ?? "");

  const parsed = createFinancialMovementSchema.safeParse({
    type,
    category: String(formData.get("category") ?? ""),
    description: String(formData.get("description") ?? ""),
    amount,
    movementDate: dateRaw ? new Date(`${dateRaw}T12:00:00`) : new Date(),
    cashBoxId: cashBoxRaw ? parseInt(cashBoxRaw, 10) : undefined,
  });
  if (!parsed.success) redirect("/dashboard/financeiro?error=invalid");

  await FinancialService.registerMovement(tenant.id, parsed.data);
  revalidatePath("/dashboard/financeiro");
  redirect("/dashboard/financeiro?ok=1");
}
