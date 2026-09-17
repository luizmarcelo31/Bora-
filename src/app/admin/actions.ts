"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSuperAdmin, assertMutableUser } from "@/lib/admin";
import { createTenantSchema, createUserSchema } from "@/lib/validators";

export async function createTenantAction(formData: FormData) {
  await requireSuperAdmin();

  const parsed = createTenantSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    type: String(formData.get("type") ?? "CONVENIENCE"),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });
  if (!parsed.success) redirect("/admin/empresas?error=invalid");

  await prisma.tenant.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
    },
  });

  revalidatePath("/admin/empresas");
  redirect("/admin/empresas?ok=1");
}

export async function createUserAction(formData: FormData) {
  await requireSuperAdmin();

  const tenantId = parseInt(String(formData.get("tenantId") ?? "0"), 10);
  if (!tenantId) redirect("/admin/usuarios?error=tenant");

  const parsed = createUserSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    role: String(formData.get("role") ?? "STAFF"),
  });
  if (!parsed.success) redirect("/admin/usuarios?error=invalid");

  try {
    assertMutableUser(parsed.data.email);
  } catch {
    redirect("/admin/usuarios?error=root");
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) redirect("/admin/usuarios?error=tenant");

  const existing = await prisma.user.findFirst({
    where: { tenantId, email: parsed.data.email },
  });
  if (existing) redirect("/admin/usuarios?error=duplicate");

  await prisma.user.create({
    data: {
      tenantId,
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
    },
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?ok=1");
}
