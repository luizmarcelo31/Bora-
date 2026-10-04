"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSuperAdmin, assertMutableUser } from "@/lib/admin";
import { createTenantSchema, createUserSchema } from "@/lib/validators";

/**
 * Cria empresa e assinatura juntas.
 *
 * ## Por que uma transação
 *
 * `Subscription.tenantId` é único e obrigatório. Empresa sem assinatura é uma
 * empresa que a plataforma não sabe cobrar — e o admin que criou não teria
 * como anexar um plano depois sem outro caminho na tela. Se a assinatura
 * falhar, a empresa não deve ficar existindo pela metade.
 *
 * ## Trial
 *
 * `trialDays` vem do plano por padrão. Com teste, a empresa nasce em `TRIAL` e
 * a assinatura em `EXPERIMENTACAO`, e `renewsAt` é o fim do teste — que é quando
 * a primeira cobrança cai. Sem teste, nasce `ATIVA` e cobra no primeiro dia.
 */
export async function createTenantAction(formData: FormData) {
  await requireSuperAdmin();

  const parsed = createTenantSchema.safeParse({
    name: String(formData.get('name') ?? ''),
    type: String(formData.get('type') ?? 'CONVENIENCE'),
    email: String(formData.get('email') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    planId: String(formData.get('planId') ?? ''),
    trialDays: String(formData.get('trialDays') ?? ''),
  });
  if (!parsed.success) redirect('/admin/empresas?error=invalid');

  const plano = await prisma.plan.findFirst({
    where: { id: parsed.data.planId, active: true },
  });
  if (!plano) redirect('/admin/empresas?error=plano');

  const agora = new Date();
  const emTeste = parsed.data.trialDays > 0;
  const fimDoTeste = new Date(agora);
  fimDoTeste.setDate(fimDoTeste.getDate() + parsed.data.trialDays);

  // Sem teste: a primeira renovação é um mês à frente. Com teste: é o fim do
  // teste, que é quando o cliente passa a ser cobrado.
  const primeiraRenovacao = new Date(agora);
  if (emTeste) {
    primeiraRenovacao.setTime(fimDoTeste.getTime());
  } else {
    primeiraRenovacao.setMonth(primeiraRenovacao.getMonth() + 1);
  }

  // Transação interativa, não array: a assinatura precisa do `id` da empresa
  // que acabou de ser criada. Conectar por `name` seria frágil — o nome não é
  // único, e duas empresas homônimas uma receberia a assinatura da outra.
  await prisma.$transaction(async (tx) => {
    const empresa = await tx.tenant.create({
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        status: emTeste ? 'TRIAL' : 'ATIVA',
        trialEndsAt: emTeste ? fimDoTeste : null,
        lastActivityAt: agora,
      },
    });

    await tx.subscription.create({
      data: {
        tenantId: empresa.id,
        planId: plano.id,
        status: emTeste ? 'EXPERIMENTACAO' : 'ATIVA',
        startedAt: agora,
        renewsAt: primeiraRenovacao,
      },
    });
  });

  revalidatePath('/admin/empresas');
  redirect('/admin/empresas?ok=1');
}

export async function createUserAction(formData: FormData) {
  await requireSuperAdmin();

  const tenantId = parseInt(String(formData.get("tenantId") ?? "0"), 10);
  if (!tenantId) redirect("/admin/usuarios?error=tenant");

  const parsed = createUserSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    role: String(formData.get("role") ?? "FUNCIONARIO"),
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
