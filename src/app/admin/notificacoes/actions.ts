import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { registrarAuditoriaPlataforma } from "@/lib/platform-audit";
import type { AlvoNotificacao } from "@prisma/client";

const comunicacaoSchema = z.object({
  subject: z.string().min(3, "Assunto é obrigatório").max(150),
  body: z.string().min(10, "Escreva a mensagem").max(5000),
  target: z.enum(["TODAS_EMPRESAS", "POR_PLANO", "POR_EMPRESA", "POR_FUNCAO"]).default("TODAS_EMPRESAS"),
  targetRef: z.string().optional(),
  enviarAgora: z.coerce.boolean().default(false),
});

const ERROS: Record<string, string> = {
  dadosInvalidos: "Verifique assunto, mensagem e o público-alvo.",
  alvoInvalido: "Escolha um público-alvo válido.",
  naoEncontrado: "Comunicação não encontrada.",
};

export async function salvarComunicacaoAction(formData: FormData) {
  const admin = await requireSuperAdmin();

  const parsed = comunicacaoSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
    target: formData.get("target") ?? "TODAS_EMPRESAS",
    targetRef: formData.get("targetRef") || undefined,
    enviarAgora: formData.get("enviarAgora") === "on",
  });
  if (!parsed.success) redirect("/admin/notificacoes?error=dadosInvalidos");

  const d = parsed.data;

  // Segmentar exige escolher *qual* segmento. Sem isso o envio iria para
  // toda a base sem querer.
  if (d.target !== "TODAS_EMPRESAS" && !d.targetRef) {
    redirect("/admin/notificacoes?error=alvoInvalido");
  }

  // Conta o público antes de gravar: o número de destinatários é o que
  // a pessoa precisa ver para decidir se vale enviar.
  const empresas = await prisma.tenant.findMany({
    where: {
      status: { not: "ARQUIVADA" },
      ...(d.target === "POR_EMPRESA"
        ? { id: Number(d.targetRef) }
        : d.target === "POR_PLANO"
          ? { subscription: { planId: Number(d.targetRef) } }
          : {}),
    },
    select: { id: true, users: { where: { active: true }, select: { email: true } } },
  });

  const destinatarios = empresas.flatMap((e) => e.users.map((u) => u.email));
  if (destinatarios.length === 0) {
    redirect("/admin/notificacoes?error=alvoInvalido");
  }

  const comunicacao = await prisma.broadcast.create({
    data: {
      subject: d.subject,
      body: d.body,
      target: d.target as AlvoNotificacao,
      targetRef: d.targetRef ?? null,
      status: d.enviarAgora ? "ENVIADO" : "RASCUNHO",
      sentAt: d.enviarAgora ? new Date() : null,
      recipients: d.enviarAgora ? destinatarios.length : 0,
    },
  });

  await registrarAuditoriaPlataforma({
    atorEmail: admin.email,
    acao: "COMUNICACAO_ENVIADA",
    entidade: "Broadcast",
    entidadeId: comunicacao.id,
    depois: {
      assunto: comunicacao.subject,
      publico: comunicacao.target,
      destinatarios: destinatarios.length,
      enviada: d.enviarAgora,
    },
  });

  revalidatePath("/admin/notificacoes");
  redirect("/admin/notificacoes?ok=1");
}

export { ERROS as ERROS_COMUNICACAO };
