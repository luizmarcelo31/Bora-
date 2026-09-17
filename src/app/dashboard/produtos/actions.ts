"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { ProductService } from "@/services";
import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { createProductSchema, reaisToCents } from "@/lib/validators";

function toCents(raw: FormDataEntryValue | null): number | undefined {
  if (raw === null) return undefined;
  const normalized = String(raw).replace(/\./g, "").replace(",", ".").trim();
  if (!normalized) return undefined;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return undefined;
  return reaisToCents(value);
}

export async function createProductAction(formData: FormData) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/produtos");
  requirePermission(dbUser.role as Role, "products.create");

  const price = toCents(formData.get("price"));
  if (price === undefined) redirect("/dashboard/produtos?error=price");

  const parsed = createProductSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    sku: String(formData.get("sku") ?? ""),
    barcode: String(formData.get("barcode") ?? ""),
    description: String(formData.get("description") ?? ""),
    price,
    cost: toCents(formData.get("cost")),
    category: String(formData.get("category") ?? ""),
  });
  if (!parsed.success) redirect("/dashboard/produtos?error=invalid");

  let productId: number | undefined;
  try {
    const p = await ProductService.createProduct(tenant.id, parsed.data);
    productId = p.id;
  } catch {
    redirect("/dashboard/produtos?error=duplicate");
  }

  const { logAudit } = await import("@/lib/audit");
  await logAudit({
    tenantId: tenant.id,
    action: "create",
    entity: "product",
    entityId: productId!,
    userId: dbUser.id,
    userEmail: dbUser.email,
    changes: parsed.data,
    details: `Produto ${parsed.data.name}`,
  });

  revalidatePath("/dashboard/produtos");
  redirect("/dashboard/produtos?ok=1");
}

export async function toggleProductAction(formData: FormData) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/produtos");
  requirePermission(dbUser.role as Role, "products.update");

  const productId = parseInt(String(formData.get("productId") ?? "0"), 10);
  if (!productId) redirect("/dashboard/produtos?error=invalid");

  await ProductService.toggleProduct(tenant.id, productId);
  const { logAudit: logAudit2 } = await import("@/lib/audit");
  await logAudit2({
    tenantId: tenant.id,
    action: "toggle",
    entity: "product",
    entityId: productId,
    userId: dbUser.id,
    userEmail: dbUser.email,
  });
  revalidatePath("/dashboard/produtos");
}
