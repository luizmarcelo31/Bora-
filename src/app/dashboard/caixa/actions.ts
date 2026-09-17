"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { CashBoxService } from "@/services";
import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { parseBRLToCents } from "@/lib/money";

export async function openCashBoxAction(formData: FormData) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/caixa");
  try {
    requirePermission(dbUser.role as Role, "cashbox.open");
  } catch {
    redirect("/dashboard/caixa?error=forbidden");
  }

  const name = String(formData.get("name") ?? "").trim();
  const openingBalance = parseBRLToCents(formData.get("openingBalance")) ?? 0;
  if (!name) redirect("/dashboard/caixa?error=invalid");

  await CashBoxService.openCashBox(tenant.id, name, openingBalance);
  revalidatePath("/dashboard/caixa");
  redirect("/dashboard/caixa?ok=1");
}

export async function closeCashBoxAction(formData: FormData) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/caixa");
  try {
    requirePermission(dbUser.role as Role, "cashbox.close");
  } catch {
    redirect("/dashboard/caixa?error=forbidden");
  }

  const cashBoxId = parseInt(String(formData.get("cashBoxId") ?? "0"), 10);
  const closingBalance = parseBRLToCents(formData.get("closingBalance"));
  if (!cashBoxId || closingBalance === undefined) redirect("/dashboard/caixa?error=invalid");

  try {
    await CashBoxService.closeCashBox(tenant.id, cashBoxId, closingBalance);
  } catch {
    redirect("/dashboard/caixa?error=close");
  }
  revalidatePath("/dashboard/caixa");
  redirect("/dashboard/caixa?ok=1");
}
