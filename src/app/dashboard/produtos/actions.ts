"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { ProductService } from "@/services";
import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { createProductSchema, reaisToCents, ValidationError } from "@/lib/validators";

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
  } catch (e) {
    if (e instanceof ValidationError) {
      if (e.type === "DUPLICATE_SKU") redirect("/dashboard/produtos?error=duplicate_sku");
      if (e.type === "DUPLICATE_BARCODE") redirect("/dashboard/produtos?error=duplicate_barcode");
    }
    console.error("[createProductAction] falha inesperada", {
      tenantId: tenant.id,
      cause: e instanceof Error ? e.message : String(e),
    });
    redirect("/dashboard/produtos?error=fail");
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
  try {
    requirePermission(dbUser.role as Role, "products.update");
  } catch {
    redirect("/dashboard/produtos?error=forbidden");
  }

  const productId = parseInt(String(formData.get("productId") ?? "0"), 10);
  if (!productId) redirect("/dashboard/produtos?error=invalid");

  try {
    await ProductService.toggleProduct(tenant.id, productId);
  } catch (e) {
    console.error("[toggleProductAction] falha inesperada", {
      tenantId: tenant.id,
      productId,
      cause: e instanceof Error ? e.message : String(e),
    });
    redirect("/dashboard/produtos?error=fail");
  }
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
  redirect("/dashboard/produtos?ok=1");
}

export async function updateProductAction(formData: FormData) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/produtos");
  try {
    requirePermission(dbUser.role as Role, "products.update");
  } catch {
    redirect("/dashboard/produtos?error=forbidden");
  }

  const productId = parseInt(String(formData.get("productId") ?? "0"), 10);
  if (!productId) redirect("/dashboard/produtos?error=invalid");

  // Pre-validate tenant ownership: getProduct throws if not found / wrong tenant
  try {
    await ProductService.getProduct(tenant.id, productId);
  } catch {
    redirect("/dashboard/produtos?error=not_found");
  }

  const priceRaw = formData.get("price");
  const costRaw = formData.get("cost");
  const price = priceRaw !== null && String(priceRaw).trim() !== "" ? toCents(priceRaw) : undefined;
  const cost = costRaw !== null && String(costRaw).trim() !== "" ? toCents(costRaw) : undefined;

  // Validate at least one editable field present
  const raw: Record<string, unknown> = {
    name: String(formData.get("name") ?? "").trim(),
    sku: String(formData.get("sku") ?? "").trim(),
    barcode: String(formData.get("barcode") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
  };
  if (price !== undefined) raw.price = price;
  if (cost !== undefined) raw.cost = cost;
  // Remove empty strings that would be treated as provided values; let Zod handle via or(z.literal(''))
  // Keep name required for update; if empty, will fail validation and redirect invalid

  const parsed = createProductSchema.partial().safeParse(raw);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    redirect("/dashboard/produtos?error=invalid");
  }

  // Ensure margin is not client-provided; service recomputes from cost/price
  try {
    const updated = await ProductService.updateProduct(tenant.id, productId, parsed.data);
    const { logAudit } = await import("@/lib/audit");
    await logAudit({
      tenantId: tenant.id,
      action: "update",
      entity: "product",
      entityId: productId,
      userId: dbUser.id,
      userEmail: dbUser.email,
      changes: parsed.data,
      details: `Produto ${updated.name} atualizado`,
    });
  } catch (e) {
    if (e instanceof ValidationError) {
      if (e.type === "DUPLICATE_SKU") redirect("/dashboard/produtos?error=duplicate_sku");
      if (e.type === "DUPLICATE_BARCODE") redirect("/dashboard/produtos?error=duplicate_barcode");
    }
    if (e instanceof Error && e.message.includes("SKU")) redirect("/dashboard/produtos?error=duplicate_sku");
    if (e instanceof Error && e.message.includes("barras")) redirect("/dashboard/produtos?error=duplicate_barcode");
    console.error("[updateProductAction] falha inesperada", {
      tenantId: tenant.id,
      productId,
      cause: e instanceof Error ? e.message : String(e),
    });
    redirect("/dashboard/produtos?error=fail");
  }

  revalidatePath("/dashboard/produtos");
  redirect("/dashboard/produtos?ok=1");
}
