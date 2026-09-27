"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { registrarAuditoriaPlataforma } from "@/lib/platform-audit";

/**
 * Valores monetários trafegam em centavos (Int) — nunca float.
 * O formulário envia reais; a conversão fica na borda, para o resto do
 * app só existe inteiro.
 */
const planoSchema = z.object({
  name: z.string().min(2, "Nome do plano é obrigatório").max(80),
  monthlyPriceReais: z.coerce.number().min(0, "Preço não pode ser negativo"),
  annualPriceReais: z.coerce.number().min(0).optional(),
  maxUsers: z.coerce.number().int().min(1).optional(),
  maxProducts: z.coerce.number().int().min(1).optional(),
  maxSalesPerMonth: z.coerce.number().int().min(1).optional(),
  trialDays: z.coerce.number().int().min(0).max(365).default(0),
  features: z.string().optional(),
});

function centavos(v: number | undefined): number | undefined {
  return v === undefined ? undefined : Math.round(v * 100);
}

/** "Plano Básico" -> "plano-basico"; slug único e legível na URL. */
function slugify(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function salvarPlanoAction(formData: FormData) {
  const admin = await requireSuperAdmin();

  const parsed = planoSchema.safeParse({
    name: formData.get("name"),
    monthlyPriceReais: formData.get("monthlyPrice"),
    annualPriceReais: formData.get("annualPrice") || undefined,
    maxUsers: formData.get("maxUsers") || undefined,
    maxProducts: formData.get("maxProducts") || undefined,
    maxSalesPerMonth: formData.get("maxSalesPerMonth") || undefined,
    trialDays: formData.get("trialDays") || 0,
    features: formData.get("features") || undefined,
  });

  if (!parsed.success) redirect("/admin/planos?error=invalid");
  const d = parsed.data;

  const features = (d.features ?? "")
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);

  const dados = {
    name: d.name,
    slug: slugify(d.name),
    monthlyPrice: centavos(d.monthlyPriceReais) ?? 0,
    annualPrice: centavos(d.annualPriceReais) ?? null,
    maxUsers: d.maxUsers ?? null,
    maxProducts: d.maxProducts ?? null,
    maxSalesPerMonth: d.maxSalesPerMonth ?? null,
    trialDays: d.trialDays,
    features,
  };

  const id = Number(formData.get("id") ?? 0);

  if (id) {
    const antes = await prisma.plan.findUnique({ where: { id } });
    if (!antes) redirect("/admin/planos?error=invalid");
    await prisma.plan.update({ where: { id }, data: dados });
    await registrarAuditoriaPlataforma({
      atorEmail: admin.email,
      acao: "PLANO_ALTERADO",
      entidade: "Plan",
      entidadeId: id,
      antes,
      depois: dados,
    });
  } else {
    const criado = await prisma.plan.create({ data: dados });
    await registrarAuditoriaPlataforma({
      atorEmail: admin.email,
      acao: "PLANO_ALTERADO",
      entidade: "Plan",
      entidadeId: criado.id,
      depois: dados,
    });
  }

  revalidatePath("/admin/planos");
  redirect("/admin/planos?ok=1");
}

export async function alternarPlanoAtivoAction(formData: FormData) {
  const admin = await requireSuperAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) redirect("/admin/planos?error=invalid");

  const plano = await prisma.plan.findUnique({ where: { id } });
  if (!plano) redirect("/admin/planos?error=invalid");

  await prisma.plan.update({ where: { id }, data: { active: !plano.active } });
  await registrarAuditoriaPlataforma({
    atorEmail: admin.email,
    acao: "PLANO_ALTERADO",
    entidade: "Plan",
    entidadeId: id,
    antes: { active: plano.active },
    depois: { active: !plano.active },
  });

  revalidatePath("/admin/planos");
  redirect("/admin/planos?ok=1");
}
