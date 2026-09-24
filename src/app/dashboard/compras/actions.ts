"use server";

import { prisma } from "@/lib/db";
import { requireSessionTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSupplierAction(formData: FormData) {
  const { tenant } = await requireSessionTenant("/dashboard/compras");

  const name = (formData.get("name") as string)?.trim();
  const document = (formData.get("document") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();

  if (!name) redirect("/dashboard/compras?error=invalid");

  try {
    await prisma.supplier.create({
      data: {
        tenantId: tenant.id,
        name,
        document: document || null,
        phone: phone || null,
        email: email || null,
      },
    });
  } catch (err) {
    console.error("[createSupplierAction]", err);
    redirect("/dashboard/compras?error=fail");
  }

  revalidatePath("/dashboard/compras");
  redirect("/dashboard/compras?ok=1");
}

export async function createPurchaseAction(formData: FormData) {
  const { tenant } = await requireSessionTenant("/dashboard/compras");

  const supplierId = parseInt(formData.get("supplierId") as string, 10);
  const totalRaw = parseFloat(
    (formData.get("total") as string)?.replace(/\./g, "").replace(",", ".") ?? ""
  );
  const total = Math.round(totalRaw * 100);

  if (isNaN(supplierId) || isNaN(total) || total <= 0) redirect("/dashboard/compras?error=invalid");

  try {
    await prisma.purchase.create({
      data: {
        tenantId: tenant.id,
        supplierId,
        total,
        status: "PENDING",
      },
    });
  } catch (err) {
    console.error("[createPurchaseAction]", err);
    redirect("/dashboard/compras?error=fail");
  }

  revalidatePath("/dashboard/compras");
  redirect("/dashboard/compras?ok=1");
}

export async function receivePurchaseAction(formData: FormData) {
  const { tenant } = await requireSessionTenant("/dashboard/compras");
  const purchaseId = parseInt(formData.get("purchaseId") as string, 10);

  if (isNaN(purchaseId)) redirect("/dashboard/compras?error=invalid");

  try {
    await prisma.purchase.update({
      where: { id: purchaseId, tenantId: tenant.id },
      data: { status: "RECEIVED", receivedAt: new Date() },
    });
  } catch (err) {
    console.error("[receivePurchaseAction]", err);
    redirect("/dashboard/compras?error=fail");
  }

  revalidatePath("/dashboard/compras");
  redirect("/dashboard/compras?ok=1");
}
