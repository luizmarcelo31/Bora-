"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSessionTenant } from "@/lib/tenant";
import { createCategorySchema } from "@/lib/validators";

export async function createCategoryAction(formData: FormData) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/categorias");
  const parsed = createCategorySchema.safeParse({
    name: String(formData.get("name") ?? ""),
    kind: String(formData.get("kind") ?? ""),
  });
  if (!parsed.success) redirect("/dashboard/categorias?error=invalid");

  let catId: number | undefined;
  try {
    const cat = await prisma.category.create({
      data: { tenantId: tenant.id, name: parsed.data.name, kind: parsed.data.kind },
    });
    catId = cat.id;
  } catch {
    redirect("/dashboard/categorias?error=duplicate");
  }
  const { logAudit } = await import("@/lib/audit");
  await logAudit({
    tenantId: tenant.id,
    action: "create",
    entity: "category",
    entityId: catId!,
    userId: dbUser.id,
    userEmail: dbUser.email,
    details: `${parsed.data.kind} ${parsed.data.name}`,
  });
  revalidatePath("/dashboard/categorias");
  redirect("/dashboard/categorias?ok=1");
}

export async function toggleCategoryAction(formData: FormData) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/categorias");
  const id = parseInt(String(formData.get("id") ?? "0"), 10);
  if (!id) redirect("/dashboard/categorias?error=invalid");
  const cat = await prisma.category.findFirst({ where: { id, tenantId: tenant.id } });
  if (!cat) redirect("/dashboard/categorias?error=invalid");
  await prisma.category.update({ where: { id }, data: { active: !cat.active } });
  const { logAudit: logAudit2 } = await import("@/lib/audit");
  await logAudit2({
    tenantId: tenant.id,
    action: "toggle",
    entity: "category",
    entityId: id,
    userId: dbUser.id,
    userEmail: dbUser.email,
  });
  revalidatePath("/dashboard/categorias");
  redirect("/dashboard/categorias?ok=1");
}

export async function updateCategoryAction(formData: FormData) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/categorias");
  const id = parseInt(String(formData.get("id") ?? "0"), 10);
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name || name.length > 100) redirect("/dashboard/categorias?error=invalid");
  const cat = await prisma.category.findFirst({ where: { id, tenantId: tenant.id } });
  if (!cat) redirect("/dashboard/categorias?error=invalid");
  // permission: PRODUCT -> products.update, FINANCIAL -> financial.create
  const { requirePermission: reqPerm } = await import("@/lib/permissions");
  const needed = cat.kind === "PRODUCT" ? "products.update" : "financial.create";
  try {
    reqPerm(dbUser.role as import("@prisma/client").Role, needed as import("@/lib/permissions").Permission);
  } catch {
    redirect("/dashboard/categorias?error=unauthorized");
  }
  // uniqueness excluding self
  const dup = await prisma.category.findFirst({ where: { tenantId: tenant.id, kind: cat.kind, name, NOT: { id } } });
  if (dup) redirect("/dashboard/categorias?error=duplicate");
  await prisma.category.update({ where: { id }, data: { name } });
  const { logAudit } = await import("@/lib/audit");
  await logAudit({
    tenantId: tenant.id,
    action: "update",
    entity: "category",
    entityId: id,
    userId: dbUser.id,
    userEmail: dbUser.email,
    changes: { name },
    details: `${cat.kind} ${cat.name} -> ${name}`,
  });
  revalidatePath("/dashboard/categorias");
  redirect("/dashboard/categorias?ok=1");
}

export async function deleteCategoryAction(formData: FormData) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/categorias");
  const id = parseInt(String(formData.get("id") ?? "0"), 10);
  if (!id) redirect("/dashboard/categorias?error=invalid");
  const cat = await prisma.category.findFirst({ where: { id, tenantId: tenant.id } });
  if (!cat) redirect("/dashboard/categorias?error=invalid");
  const needed = cat.kind === "PRODUCT" ? "products.delete" : "financial.create";
  try {
    const { requirePermission: reqPerm } = await import("@/lib/permissions");
    reqPerm(dbUser.role as import("@prisma/client").Role, needed as import("@/lib/permissions").Permission);
  } catch {
    redirect("/dashboard/categorias?error=unauthorized");
  }
  // Check dependencies: products or financial movements using category string
  const [prodCount, finCount] = await Promise.all([
    prisma.product.count({ where: { tenantId: tenant.id, category: cat.name } }),
    prisma.financialMovement.count({ where: { tenantId: tenant.id, category: cat.name } }),
  ]);
  if (prodCount > 0 || finCount > 0) {
    // Soft-delete: inactivate instead of hard delete to preserve history
    await prisma.category.update({ where: { id }, data: { active: false } });
    const { logAudit } = await import("@/lib/audit");
    await logAudit({
      tenantId: tenant.id,
      action: "soft_delete",
      entity: "category",
      entityId: id,
      userId: dbUser.id,
      userEmail: dbUser.email,
      details: `Inativada por dependências: prod ${prodCount} fin ${finCount}`,
    });
  } else {
    await prisma.category.delete({ where: { id } });
    const { logAudit } = await import("@/lib/audit");
    await logAudit({
      tenantId: tenant.id,
      action: "delete",
      entity: "category",
      entityId: id,
      userId: dbUser.id,
      userEmail: dbUser.email,
      details: `${cat.kind} ${cat.name}`,
    });
  }
  revalidatePath("/dashboard/categorias");
  redirect("/dashboard/categorias?ok=1");
}
