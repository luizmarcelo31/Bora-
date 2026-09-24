"use server";

import { prisma } from "@/lib/db";
import { requireSessionTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPromotionAction(formData: FormData) {
  const { tenant } = await requireSessionTenant("/dashboard/promocoes");

  const name = (formData.get("name") as string)?.trim();
  const type = formData.get("type") as "PERCENTAGE" | "FIXED_AMOUNT" | "COMBO";
  const raw = parseInt(formData.get("value") as string, 10);
  const productIds = formData.getAll("productIds") as string[];

  if (!name || !type || isNaN(raw)) redirect("/dashboard/promocoes?error=invalid");

  try {
    await prisma.promotion.create({
      data: {
        tenantId: tenant.id,
        name,
        type,
        value: raw,
        items: productIds.length > 0 ? {
          create: productIds.map((id) => ({
            tenantId: tenant.id,
            productId: parseInt(id, 10),
          })),
        } : undefined,
      },
    });
  } catch (err) {
    console.error("[createPromotionAction]", err);
    redirect("/dashboard/promocoes?error=fail");
  }

  revalidatePath("/dashboard/promocoes");
  redirect("/dashboard/promocoes?ok=1");
}

export async function togglePromotionAction(formData: FormData) {
  const { tenant } = await requireSessionTenant("/dashboard/promocoes");
  const promotionId = parseInt(formData.get("promotionId") as string, 10);

  if (isNaN(promotionId)) redirect("/dashboard/promocoes?error=invalid");

  try {
    const promo = await prisma.promotion.findUnique({
      where: { id: promotionId, tenantId: tenant.id },
    });
    if (!promo) redirect("/dashboard/promocoes?error=not_found");

    await prisma.promotion.update({
      where: { id: promotionId },
      data: { active: !promo.active },
    });
  } catch (err) {
    console.error("[togglePromotionAction]", err);
    redirect("/dashboard/promocoes?error=fail");
  }

  revalidatePath("/dashboard/promocoes");
  redirect("/dashboard/promocoes?ok=1");
}
