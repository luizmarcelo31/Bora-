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

  try {
    await ProductService.createProduct(tenant.id, parsed.data);
  } catch {
    redirect("/dashboard/produtos?error=duplicate");
  }

  revalidatePath("/dashboard/produtos");
  redirect("/dashboard/produtos?ok=1");
}

export async function toggleProductAction(formData: FormData) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/produtos");
  requirePermission(dbUser.role as Role, "products.update");

  const productId = parseInt(String(formData.get("productId") ?? "0"), 10);
  if (!productId) redirect("/dashboard/produtos?error=invalid");

  await ProductService.toggleProduct(tenant.id, productId);
  revalidatePath("/dashboard/produtos");
}
