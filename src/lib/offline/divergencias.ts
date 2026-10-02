import { prisma } from "@/lib/db";

/**
 * Relatório de divergências do modo offline (Fase 3.1 — ADR-006 §5, §6).
 *
 * ## Por que a venda vence o estoque, e por que isso precisa de relatório
 *
 * Duas lojas vendem o mesmo estoque offline. No sync, a segunda venda bate em
 * `INSUFFICIENT_STOCK` — e é recusada ou aceita? A política do ADR-006 §5 é
 * aceita: o dinheiro foi entregue e a mercadoria saiu da prateleira, então
 * recusar é perda direta. O estoque pode ficar negativo e a contagem de
 * inventário corrige o número depois.
 *
 * Isso só é seguro com registro. Uma venda que vendeu 5 com 2 disponíveis e
 * passou sem deixar rastro vira estoque fantasma que ninguém sabe explicar no
 * fechamento do mês. Este relatório é esse rastro.
 *
 * ## De onde vem a informação
 *
 * Do `AuditLog`, não de uma coluna nova em `Sale`. A divergência é um
 * incidente pontual — uma venda, um momento — e a action já grava isso em
 * `changes` no momento da sincronização, com o estoque real da época. Uma
 * coluna em `Sale` diria *que* a venda foi offline, mas não *o que* divergiu:
 * guardar o saldo disponível no momento seria modelar histórico de inventário
 * para responder a uma pergunta que a auditoria já responde.
 *
 * ## O que este relatório não faz
 *
 * Não corrige nada. A correção é a contagem de inventário, com a diferença
 * explicada; este relatório aponta o que precisa de conferência humana.
 */

export interface DivergenciaItem {
  productId: number;
  disponivel: number;
  vendido: number;
}

export interface DivergenciaVenda {
  saleId: number;
  occurredAt: Date;
  userEmail: string | null;
  estoque: DivergenciaItem[];
  caixa: boolean;
  detalhes: string;
}

/** Resumo para o topo da tela. */
export interface ResumoDivergencias {
  vendas: number;
  itensDeEstoque: number;
  vendasSemCaixa: number;
}

/**
 * Lê as divergências gravadas na auditoria.
 *
 * `changes` é JSON serializado em string (`logAudit` faz `JSON.stringify`), e
 * o filtro de quais vendas têm divergência acontece em JS porque não há coluna
 * indexável para isso. Traz as 200 mais recentes e filtra: um relatório que
 * tenta paginar sobre `JSON.stringify` seria mais lento do que útil e mais
 * código do que a tela precisa.
 */
export async function listarDivergencias(
  tenantId: number,
  limite = 200
): Promise<DivergenciaVenda[]> {
  const logs = await prisma.auditLog.findMany({
    where: { tenantId, entity: "sale", action: "create" },
    orderBy: { createdAt: "desc" },
    take: limite,
    select: {
      entityId: true,
      changes: true,
      details: true,
      createdAt: true,
      userEmail: true,
    },
  });

  const divergencias: DivergenciaVenda[] = [];

  for (const log of logs) {
    if (!log.changes) continue;

    let parsed: {
      offline?: boolean;
      divergenciaEstoque?: DivergenciaItem[];
      divergenciaCaixa?: boolean;
    };

    try {
      parsed = JSON.parse(log.changes) as typeof parsed;
    } catch {
      // `changes` de outro formato (venda normal) não tem esta forma. Não é
      // divergência, e não é erro: seguir filtrando é o comportamento certo.
      continue;
    }

    if (parsed.offline !== true) continue;

    const estoque = Array.isArray(parsed.divergenciaEstoque) ? parsed.divergenciaEstoque : [];
    const caixa = parsed.divergenciaCaixa === true;

    if (estoque.length === 0 && !caixa) continue;

    // A data da venda é a da auditoria do sync, não a da venda: o relatório
    // ordena por quando o problema apareceu, que é quando alguém pode agir
    // sobre ele.
    divergencias.push({
      saleId: log.entityId,
      occurredAt: log.createdAt,
      userEmail: log.userEmail,
      estoque,
      caixa,
      detalhes: log.details ?? "",
    });
  }

  return divergencias;
}

/** Contagens do topo. Derivado da lista, então não custa query extra. */
export function resumirDivergencias(vendas: DivergenciaVenda[]): ResumoDivergencias {
  return {
    vendas: vendas.length,
    itensDeEstoque: vendas.reduce((s, v) => s + v.estoque.length, 0),
    vendasSemCaixa: vendas.filter((v) => v.caixa).length,
  };
}
