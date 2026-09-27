import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { registrarAuditoriaPlataforma } from "@/lib/platform-audit";
import type { MotivoCancelamento, StatusAssinatura } from "@prisma/client";

/**
 * Transições de assinatura. Uma assinatura nunca é apagada: cancelar
 * registra o cancelamento e a data, senão o histórico de receita fica
 * sem rastro no dia em que a pessoa mais precisa dele.
 */
const TRANSICOES: Record<StatusAssinatura, StatusAssinatura[]> = {
  EXPERIMENTACAO: ["ATIVA", "SUSPENSA", "CANCELADA"],
  ATIVA: ["PENDENTE_PAGAMENTO", "SUSPENSA", "CANCELADA"],
  PENDENTE_PAGAMENTO: ["ATIVA", "SUSPENSA", "CANCELADA"],
  SUSPENSA: ["ATIVA", "CANCELADA"],
  CANCELADA: ["ATIVA", "ARQUIVADA"],
  ARQUIVADA: [],
};

export function podeTransicionarAssinatura(de: StatusAssinatura, para: StatusAssinatura) {
  return TRANSICOES[de]?.includes(para) ?? false;
}

const ERROS: Record<string, string> = {
  naoEncontrada: "Assinatura não encontrada.",
  transicaoInvalida: "Essa mudança não é permitida a partir do estado atual.",
  motivoObrigatorio: "Informe o motivo.",
};

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

export { ERROS as ERROS_ASSINATURA, TRANSICOES as TRANSICOES_ASSINATURA };
