import type {
  CicloCobranca,
  PrioridadeTicket,
  StatusAssinatura,
  StatusTicket,
} from "@prisma/client";

/**
 * Regras puras da plataforma (sem acesso a banco ou rede).
 *
 * Ficam aqui para teste unitário direto: páginas e actions importam
 * destas funções em vez de duplicar a conta em cada arquivo.
 */

/** Prazo de resposta por prioridade, em horas. */
export const SLA_HORAS: Record<PrioridadeTicket, number> = {
  CRITICA: 1,
  ALTA: 4,
  MEDIA: 8,
  BAIXA: 24,
};

/** Vencimento do SLA a partir de uma base. Não muta a data recebida. */
export function calcularVencimentoSla(
  base: Date,
  prioridade: PrioridadeTicket
): Date {
  const venc = new Date(base.getTime());
  venc.setHours(venc.getHours() + SLA_HORAS[prioridade]);
  return venc;
}

/** Ticket vencido: tem prazo, não está resolvido/fechado, prazo passou. */
export function slaVencido(
  sla: Date | null | undefined,
  status: StatusTicket
): boolean {
  if (!sla) return false;
  if (status === "RESOLVIDO" || status === "FECHADO") return false;
  return sla.getTime() < Date.now();
}

/** MRR: plano anual normaliza para mês, senão métrica mente. Valores em centavos. */
export function calcularMRR(
  itens: { billingCycle: CicloCobranca | string; monthlyPrice: number }[]
): number {
  return itens.reduce(
    (s, a) =>
      s +
      (a.billingCycle === "ANUAL"
        ? Math.round(a.monthlyPrice / 12)
        : a.monthlyPrice),
    0
  );
}

export const TRANSICOES_TICKET: Record<StatusTicket, StatusTicket[]> = {
  ABERTO: ["EM_ANALISE", "AGUARDANDO_CLIENTE", "FECHADO"],
  EM_ANALISE: ["AGUARDANDO_CLIENTE", "RESOLVIDO", "FECHADO"],
  AGUARDANDO_CLIENTE: ["EM_ANALISE", "RESOLVIDO", "FECHADO"],
  RESOLVIDO: ["EM_ANALISE", "FECHADO"],
  FECHADO: ["ABERTO"],
};

export function transicaoTicketValida(
  de: StatusTicket,
  para: StatusTicket
): boolean {
  return TRANSICOES_TICKET[de]?.includes(para) ?? false;
}

export const TRANSICOES_ASSINATURA: Record<
  StatusAssinatura,
  StatusAssinatura[]
> = {
  EXPERIMENTACAO: ["ATIVA", "SUSPENSA", "CANCELADA"],
  ATIVA: ["PENDENTE_PAGAMENTO", "SUSPENSA", "CANCELADA"],
  PENDENTE_PAGAMENTO: ["ATIVA", "SUSPENSA", "CANCELADA"],
  SUSPENSA: ["ATIVA", "CANCELADA"],
  CANCELADA: ["ATIVA", "ARQUIVADA"],
  ARQUIVADA: [],
};

export function podeTransicionarAssinatura(
  de: StatusAssinatura,
  para: StatusAssinatura
): boolean {
  return TRANSICOES_ASSINATURA[de]?.includes(para) ?? false;
}
