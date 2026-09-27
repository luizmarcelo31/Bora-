import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MotivoCancelamento, StatusEmpresa } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { registrarAuditoriaPlataforma, resumoEmpresa } from "@/lib/platform-audit";

/**
 * Transições permitidas do ciclo de vida da empresa.
 *
 * `ARQUIVADA` é terminal de propósito: sair de lá é uma operação
 * deliberada e rara, não um botão ao lado de "Ativa". Reativar uma
 * empresa suspensa ou cancelada é fluxo normal de suporte; ressuscitar
 * uma arquivada não é.
 */
const TRANSICOES: Record<StatusEmpresa, StatusEmpresa[]> = {
  TRIAL: ["ATIVA", "CANCELADA", "SUSPENSA"],
  ATIVA: ["SUSPENSA", "CANCELADA"],
  SUSPENSA: ["ATIVA", "CANCELADA"],
  CANCELADA: ["ATIVA", "ARQUIVADA"],
  ARQUIVADA: [],
};

export function podeTransicionar(de: StatusEmpresa, para: StatusEmpresa): boolean {
  return TRANSICOES[de]?.includes(para) ?? false;
}

const MENSAGEM: Record<string, string> = {
  naoEncontrada: "Empresa não encontrada.",
  transicaoInvalida: "Essa mudança de situação não é permitida a partir do estado atual.",
  motivoObrigatorio: "Informe o motivo da mudança.",
  empresaArquivada: "Empresa arquivada não pode mais ser alterada.",
};

export async function alterarStatusEmpresaAction(formData: FormData) {
  const admin = await requireSuperAdmin();

  const id = Number(formData.get("id"));
  const para = String(formData.get("status")) as StatusEmpresa;
  const motivo = String(formData.get("motivo") ?? "").trim();

  if (!Number.isInteger(id) || id <= 0) redirect("/admin/empresas?error=naoEncontrada");
  if (!TRANSICOES[para as StatusEmpresa]) redirect("/admin/empresas?error=transicaoInvalida");

  const empresa = await prisma.tenant.findUnique({ where: { id } });
  if (!empresa) redirect("/admin/empresas?error=naoEncontrada");
  if (!podeTransicionar(empresa.status, para)) {
    redirect(`/admin/empresas/${id}?error=transicaoInvalida`);
  }

  // Motivo é obrigatório em toda mudança: a trilha de auditoria só vale
  // se explicar o porquê, não só o quê.
  if (motivo.length < 3) {
    redirect(`/admin/empresas/${id}?error=motivoObrigatorio`);
  }

  const antes = resumoEmpresa(empresa);
  const agora = new Date();

  await prisma.tenant.update({
    where: { id },
    data: {
      status: para,
      // `active` e `suspended` seguem existindo para o resto do app;
      // derivar aqui evita que o status novo e os flags fiquem divergentes.
      active: para !== "CANCELADA" && para !== "ARQUIVADA",
      suspended: para === "SUSPENSA",
      suspendedAt: para === "SUSPENSA" ? agora : null,
      suspensionReason: para === "SUSPENSA" ? motivo : null,
      archivedAt: para === "ARQUIVADA" ? agora : null,
      trialEndsAt: para === "ATIVA" ? null : empresa.trialEndsAt,
    },
  });

  await registrarAuditoriaPlataforma({
    atorEmail: admin.email,
    acao: para === "ARQUIVADA" ? "EMPRESA_ARQUIVADA" : "EMPRESA_STATUS_ALTERADO",
    entidade: "Tenant",
    entidadeId: id,
    tenantId: id,
    antes,
    depois: { ...antes, status: para },
    metadata: { motivo },
  });

  revalidatePath("/admin/empresas");
  revalidatePath(`/admin/empresas/${id}`);
  redirect(`/admin/empresas/${id}?ok=${para}`);
}

export async function definirTrialEmpresaAction(formData: FormData) {
  const admin = await requireSuperAdmin();

  const id = Number(formData.get("id"));
  const dias = Number(formData.get("dias"));
  if (!Number.isInteger(id) || id <= 0) redirect("/admin/empresas?error=naoEncontrada");
  if (!Number.isInteger(dias) || dias < 0) redirect(`/admin/empresas/${id}?error=motivoObrigatorio`);

  const empresa = await prisma.tenant.findUnique({ where: { id } });
  if (!empresa) redirect("/admin/empresas?error=naoEncontrada");

  const fim = new Date();
  fim.setDate(fim.getDate() + dias);

  await prisma.tenant.update({
    where: { id },
    data: { status: "TRIAL", trialEndsAt: dias > 0 ? fim : null },
  });

  await registrarAuditoriaPlataforma({
    atorEmail: admin.email,
    acao: "EMPRESA_STATUS_ALTERADO",
    entidade: "Tenant",
    entidadeId: id,
    tenantId: id,
    antes: resumoEmpresa(empresa),
    depois: { status: "TRIAL", trialEndsAt: fim.toISOString() },
    metadata: { dias },
  });

  revalidatePath(`/admin/empresas/${id}`);
  redirect(`/admin/empresas/${id}?ok=TRIAL`);
}

export { MENSAGEM as MENSAGEM_EMPRESA, MotivoCancelamento };

/** Mensagens do formulário de nova empresa, em português claro. */
export const VOLTAR_EMPRESAS = {
  error: {
    invalid: "Não foi possível criar a empresa. Verifique nome, email e telefone.",
  },
  ok: { created: "Empresa criada. Agora vincule o primeiro usuário a ela." },
} as const;
