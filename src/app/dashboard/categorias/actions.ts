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
}
