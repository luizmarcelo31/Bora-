"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { registrarAuditoriaPlataforma } from "@/lib/platform-audit";
import {
  podeTransicionarAssinatura,
} from "@/lib/plataforma";
import type { MotivoCancelamento, StatusAssinatura } from "@prisma/client";

export async function mudarStatusAssinaturaAction(formData: FormData) {
  const admin = await requireSuperAdmin();

  const id = Number(formData.get("id"));
  const para = String(formData.get("status")) as StatusAssinatura;
  const motivo = String(formData.get("motivo") ?? "").trim();

  if (!Number.isInteger(id) || id <= 0) redirect("/admin/assinaturas?error=naoEncontrada");

  const assinatura = await prisma.subscription.findUnique({
    where: { id },
    include: { plan: { select: { name: true } } },
  });
  if (!assinatura) redirect("/admin/assinaturas?error=naoEncontrada");
  if (!podeTransicionarAssinatura(assinatura.status, para)) {
    redirect("/admin/assinaturas?error=transicaoInvalida");
  }
  if (para === "CANCELADA" && motivo.length < 3) {
    redirect(`/admin/assinaturas?error=motivoObrigatorio`);
  }

  const agora = new Date();
  const cancelando = para === "CANCELADA";

  const atualizada = await prisma.subscription.update({
    where: { id },
    data: {
      status: para,
      cancelledAt: cancelando ? agora : null,
      cancelReason: cancelando ? ((motivo as MotivoCancelamento) ?? null) : null,
      endsAt: cancelando ? assinatura.renewsAt : null,
      // Reativar empurra a renovação para o próximo ciclo, senão a
      // assinatura volta já vencida.
      renewsAt:
        para === "ATIVA" && assinatura.status !== "ATIVA"
          ? new Date(agora.getTime() + 30 * 86_400_000)
          : assinatura.renewsAt,
    },
  });

  await registrarAuditoriaPlataforma({
    atorEmail: admin.email,
    acao: "ASSINATURA_ALTERADA",
    entidade: "Subscription",
    entidadeId: id,
    tenantId: assinatura.tenantId,
    antes: { status: assinatura.status, plano: assinatura.plan.name },
    depois: { status: atualizada.status, plano: assinatura.plan.name },
    metadata: { motivo },
  });

  revalidatePath("/admin/assinaturas");
  redirect("/admin/assinaturas?ok=1");
}
