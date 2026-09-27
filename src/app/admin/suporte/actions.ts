import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { registrarAuditoriaPlataforma } from "@/lib/platform-audit";
import type { PrioridadeTicket, StatusTicket } from "@prisma/client";

/** Prazo de resposta por prioridade, em horas. */
const SLA_HORAS: Record<PrioridadeTicket, number> = {
  CRITICA: 1,
  ALTA: 4,
  MEDIA: 8,
  BAIXA: 24,
};

const ticketSchema = z.object({
  tenantId: z.coerce.number().int().positive("Selecione a empresa"),
  subject: z.string().min(3, "Assunto é obrigatório").max(150),
  description: z.string().min(10, "Descreva o problema com mais detalhes").max(5000),
  priority: z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]).default("MEDIA"),
});

const ERROS: Record<string, string> = {
  tenantInvalida: "Selecione a empresa.",
  dadosInvalidos: "Verifique o assunto, a descrição e a prioridade.",
  naoEncontrado: "Ticket não encontrado.",
  transicaoInvalida: "Essa mudança de situação não é permitida.",
};

export async function abrirTicketAction(formData: FormData) {
  const admin = await requireSuperAdmin();

  const parsed = ticketSchema.safeParse({
    tenantId: formData.get("tenantId"),
    subject: formData.get("subject"),
    description: formData.get("description"),
    priority: formData.get("priority") ?? "MEDIA",
  });
  if (!parsed.success) redirect("/admin/suporte?error=dadosInvalidos");

  const empresa = await prisma.tenant.findUnique({
    where: { id: parsed.data.tenantId },
    select: { id: true, name: true },
  });
  if (!empresa) redirect("/admin/suporte?error=tenantInvalida");

  const sla = new Date();
  sla.setHours(sla.getHours() + SLA_HORAS[parsed.data.priority]);

  const ticket = await prisma.ticket.create({
    data: {
      tenantId: empresa.id,
      subject: parsed.data.subject,
      description: parsed.data.description,
      priority: parsed.data.priority,
      slaDueAt: sla,
      messages: {
        create: {
          authorEmail: admin.email,
          body: parsed.data.description,
        },
      },
    },
  });

  await registrarAuditoriaPlataforma({
    atorEmail: admin.email,
    acao: "TICKET_ALTERADO",
    entidade: "Ticket",
    entidadeId: ticket.id,
    tenantId: empresa.id,
    depois: { assunto: ticket.subject, prioridade: ticket.priority },
  });

  revalidatePath("/admin/suporte");
  redirect("/admin/suporte?ok=1");
}

const TRANSICOES: Record<StatusTicket, StatusTicket[]> = {
  ABERTO: ["EM_ANALISE", "AGUARDANDO_CLIENTE", "FECHADO"],
  EM_ANALISE: ["AGUARDANDO_CLIENTE", "RESOLVIDO", "FECHADO"],
  AGUARDANDO_CLIENTE: ["EM_ANALISE", "RESOLVIDO", "FECHADO"],
  RESOLVIDO: ["EM_ANALISE", "FECHADO"],
  FECHADO: ["ABERTO"],
};

export async function mudarStatusTicketAction(formData: FormData) {
  const admin = await requireSuperAdmin();

  const id = Number(formData.get("id"));
  const para = String(formData.get("status")) as StatusTicket;
  if (!Number.isInteger(id) || id <= 0) redirect("/admin/suporte?error=naoEncontrado");

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) redirect("/admin/suporte?error=naoEncontrado");
  if (!TRANSICOES[ticket.status]?.includes(para)) {
    redirect("/admin/suporte?error=transicaoInvalida");
  }

  await prisma.ticket.update({
    where: { id },
    data: {
      status: para,
      // `resolvedAt` é carimbado uma vez só: reabrir o ticket não deve
      // apagar o histórico de quando ele foi resolvido.
      resolvedAt: para === "RESOLVIDO" ? new Date() : ticket.resolvedAt,
    },
  });

  await registrarAuditoriaPlataforma({
    atorEmail: admin.email,
    acao: "TICKET_ALTERADO",
    entidade: "Ticket",
    entidadeId: id,
    tenantId: ticket.tenantId,
    antes: { status: ticket.status },
    depois: { status: para },
  });

  revalidatePath("/admin/suporte");
  redirect("/admin/suporte?ok=1");
}

export async function responderTicketAction(formData: FormData) {
  const admin = await requireSuperAdmin();

  const id = Number(formData.get("id"));
  const body = String(formData.get("body") ?? "").trim();
  const interna = formData.get("interna") === "on";
  if (!Number.isInteger(id) || id <= 0) redirect("/admin/suporte?error=naoEncontrado");
  if (body.length < 2) redirect("/admin/suporte?error=dadosInvalidos");

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) redirect("/admin/suporte?error=naoEncontrado");

  await prisma.ticketMessage.create({
    data: { ticketId: id, authorEmail: admin.email, body, internal: interna },
  });

  revalidatePath("/admin/suporte");
  redirect("/admin/suporte?ok=1");
}

export { ERROS as ERROS_TICKET, SLA_HORAS, TRANSICOES as TRANSICOES_TICKET };
