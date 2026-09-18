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

  let box;
  try {
    box = await CashBoxService.openCashBox(tenant.id, name, openingBalance);
  } catch (e) {
    console.error("[openCashBoxAction] falha inesperada", {
      tenantId: tenant.id,
      cause: e instanceof Error ? e.message : String(e),
    });
    redirect("/dashboard/caixa?error=fail");
    throw e;
  }
  const { logAudit } = await import("@/lib/audit");
  await logAudit({
    tenantId: tenant.id,
    action: "open",
    entity: "cashbox",
    entityId: box.id,
    userId: dbUser.id,
    userEmail: dbUser.email,
    details: `Abrir ${name} ${openingBalance}`,
  });
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
    const result = await CashBoxService.closeCashBox(tenant.id, cashBoxId, closingBalance);
    // Item 4 — diferença no fechamento: sobra/falta como lançamento financeiro
    const { FinancialService } = await import("@/services");
    const diff = closingBalance - result.currentBalance;
    if (diff !== 0) {
      await FinancialService.registerMovement(tenant.id, {
        type: diff > 0 ? "RECEITA" : "DESPESA",
        category: diff > 0 ? "Sobra de caixa" : "Falta de caixa",
        description: `Fechamento ${result.name} — diferença ${diff > 0 ? "sobra" : "falta"}`,
        amount: Math.abs(diff),
        movementDate: new Date(),
        cashBoxId: result.id,
      });
    }
    const { logAudit: logAuditClose } = await import("@/lib/audit");
    await logAuditClose({
      tenantId: tenant.id,
      action: "close",
      entity: "cashbox",
      entityId: result.id,
      userId: dbUser.id,
      userEmail: dbUser.email,
      details: `Fechar ${result.name} diferença ${diff}`,
    });
    // Item 2 — baixa: marcar como pagas as pendências do caixa (opcional p/ consulta)
  } catch (e) {
    console.error("[closeCashBoxAction] falha inesperada", {
      tenantId: tenant.id,
      cashBoxId,
      cause: e instanceof Error ? e.message : String(e),
    });
    redirect("/dashboard/caixa?error=close");
  }
  revalidatePath("/dashboard/caixa");
  redirect("/dashboard/caixa?ok=1");
}
