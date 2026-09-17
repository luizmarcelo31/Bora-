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

  const movement = await FinancialService.registerMovement(tenant.id, parsed.data);
  const { logAudit } = await import("@/lib/audit");
  await logAudit({
    tenantId: tenant.id,
    action: "create",
    entity: "financial",
    entityId: movement.id,
    userId: dbUser.id,
    userEmail: dbUser.email,
    changes: parsed.data,
  });
  revalidatePath("/dashboard/financeiro");
  redirect("/dashboard/financeiro?ok=1");
}

export async function updateFinancialAction(formData: FormData) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/financeiro");
  try {
    requirePermission(dbUser.role as Role, "financial.create");
  } catch {
    redirect("/dashboard/financeiro?error=forbidden");
  }
  const id = parseInt(String(formData.get("id") ?? "0"), 10);
  if (!id) redirect("/dashboard/financeiro?error=invalid");
  const existing = await (await import("@/lib/db")).prisma.financialMovement.findFirst({
    where: { id, tenantId: tenant.id },
  });
  if (!existing) redirect("/dashboard/financeiro?error=not_found");
  if (existing.paid) redirect("/dashboard/financeiro?error=paid_locked");

  const type = String(formData.get("type") ?? "");
  if (!TYPES.includes(type as (typeof TYPES)[number])) redirect("/dashboard/financeiro?error=invalid");
  const amount = parseBRLToCents(formData.get("amount"));
  if (amount === undefined || amount <= 0) redirect("/dashboard/financeiro?error=invalid");
  const dateRaw = String(formData.get("movementDate") ?? "");
  const cashBoxRaw = String(formData.get("cashBoxId") ?? "");
  const parsed = createFinancialMovementSchema.safeParse({
    type,
    category: String(formData.get("category") ?? ""),
    description: String(formData.get("description") ?? ""),
    amount,
    movementDate: dateRaw ? new Date(`${dateRaw}T12:00:00`) : existing.movementDate,
    cashBoxId: cashBoxRaw ? parseInt(cashBoxRaw, 10) : undefined,
  });
  if (!parsed.success) redirect("/dashboard/financeiro?error=invalid");

  await (await import("@/lib/db")).prisma.financialMovement.update({
    where: { id },
    data: {
      type: parsed.data.type as import("@prisma/client").FinancialMovementType,
      category: parsed.data.category,
      description: parsed.data.description,
      amount: parsed.data.amount,
      movementDate: parsed.data.movementDate,
      cashBoxId: parsed.data.cashBoxId ?? null,
    },
  });
  const { logAudit } = await import("@/lib/audit");
  await logAudit({
    tenantId: tenant.id,
    action: "update",
    entity: "financial",
    entityId: id,
    userId: dbUser.id,
    userEmail: dbUser.email,
    changes: parsed.data,
  });
  revalidatePath("/dashboard/financeiro");
  redirect("/dashboard/financeiro?ok=1");
}

export async function deleteFinancialAction(formData: FormData) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/financeiro");
  try {
    requirePermission(dbUser.role as Role, "financial.create");
  } catch {
    redirect("/dashboard/financeiro?error=forbidden");
  }
  const id = parseInt(String(formData.get("id") ?? "0"), 10);
  if (!id) redirect("/dashboard/financeiro?error=invalid");
  const existing = await (await import("@/lib/db")).prisma.financialMovement.findFirst({
    where: { id, tenantId: tenant.id },
  });
  if (!existing) redirect("/dashboard/financeiro?error=not_found");
  if (existing.paid) redirect("/dashboard/financeiro?error=paid_locked");
  // Preserve paid history already handled; for unpaid allow hard delete (no active flag exists)
  await (await import("@/lib/db")).prisma.financialMovement.delete({ where: { id } });
  const { logAudit } = await import("@/lib/audit");
  await logAudit({
    tenantId: tenant.id,
    action: "delete",
    entity: "financial",
    entityId: id,
    userId: dbUser.id,
    userEmail: dbUser.email,
    details: `${existing.type} ${existing.category} ${existing.amount}`,
  });
  revalidatePath("/dashboard/financeiro");
  redirect("/dashboard/financeiro?ok=1");
}
