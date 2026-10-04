import { prisma } from "@/lib/db";

/**
 * Limites do plano — a parte que faz o plano valer alguma coisa.
 *
 * ## O estado anterior
 *
 * `Plan.maxUsers`, `maxProducts` e `maxSalesPerMonth` eram gravados pelo
 * `salvarPlanoAction` e… lidos em um único lugar, para imprimir o número na tela
 * da empresa. Nenhum guard, nenhuma validação, em lugar nenhum. O plano prometia
 * "até 5 usuários" e o código aceitava 500 sem pestanejar.
 *
 * Um plano sem verificação não é uma restrição: é um rótulo de marketing.
 *
 * ## A regra que governa o que pode bloquear
 *
 * Não é uniforme, e a assimetria é deliberada:
 *
 * - **Usuário e produto bloqueiam.** São ações de configuração: o cliente está
 *   parado montando a loja. Recusar com uma mensagem clara é um incômodo
 *   pequeno e um upgrade fácil de entender.
 *
 * - **Venda por mês NUNCA bloqueia.** Bloquear venda significa recusar dinheiro
 *   do cliente em troca da nossa cobrança — o dono do balcão perde a venda, nós
 *   ganhamos a queixa, e o problema continua existindo em trinta dias. Limite de
 *   venda é um sinal para o Super Admin pursue o upgrade, não uma catraca.
 *
 *   Por isso `limiteVendasNoMes` existe como *leitura*, para o painel da
 *   plataforma mostrar quem chegou perto. Nunca como escrita.
 */

export type Recurso = "usuarios" | "produtos";

export type ResultadoLimite =
  | { ok: true }
  | {
      ok: false;
      recurso: Recurso;
      limite: number;
      atual: number;
      mensagem: string;
    };

/** Nome e plural para as mensagens de erro. */
const ROTULOS: Record<Recurso, { singular: string; plural: string }> = {
  usuarios: { singular: "usuário", plural: "usuários" },
  produtos: { singular: "produto", plural: "produtos" },
};

/**
 * Conta o uso atual e compara com o limite.
 *
 * `null` no plano significa "ilimitado" — é assim que o schema representa
 * ausência de teto, e não zero.
 */
export async function verificarLimite(
  tenantId: number,
  recurso: Recurso
): Promise<ResultadoLimite> {
  const assinatura = await prisma.subscription.findFirst({
    where: { tenantId, status: { in: ["ATIVA", "EXPERIMENTACAO"] } },
    include: { plan: { select: { maxUsers: true, maxProducts: true } } },
  });

  // Sem assinatura ativa o produto não cobra limite: pode ser uma empresa em
  // criação, um trial vencido que o admin ainda não regularizou, ou um plano
  // legado. Barrar operação nesses casos transformaria um furo administrativo
  // em indisponibilidade do PDV do cliente.
  if (!assinatura) return { ok: true };

  const max = recurso === "usuarios" ? assinatura.plan.maxUsers : assinatura.plan.maxProducts;
  if (max === null || max === undefined) return { ok: true };

  const atual =
    recurso === "usuarios"
      ? await prisma.user.count({ where: { tenantId } })
      : await prisma.product.count({ where: { tenantId } });

  if (atual < max) return { ok: true };

  const { singular, plural } = ROTULOS[recurso];
  return {
    ok: false,
    recurso,
    limite: max,
    atual,
    mensagem:
      atual === max
        ? `Limite do plano atingido: ${max} ${max === 1 ? singular : plural}. Peça o upgrade ao administrador da plataforma.`
        : `Acima do plano: ${atual} ${plural} para um limite de ${max}. Peça o ajuste ao administrador da plataforma.`,
  };
}

/**
 * Leitura para o painel da plataforma: quem chegou perto do limite.
 *
 * Só de leitura, e é o máximo que venda por mês pode chegar. Ver a regra no
 * topo do arquivo.
 */
export async function limiteVendasNoMes(tenantId: number) {
  const inicioDoMes = new Date();
  inicioDoMes.setDate(1);
  inicioDoMes.setHours(0, 0, 0, 0);

  const assinatura = await prisma.subscription.findFirst({
    where: { tenantId, status: { in: ["ATIVA", "EXPERIMENTACAO"] } },
    include: { plan: { select: { maxSalesPerMonth: true } } },
  });

  const max = assinatura?.plan.maxSalesPerMonth ?? null;
  if (max === null || max === undefined) return null;

  const usadas = await prisma.sale.count({
    where: { tenantId, status: "CONCLUIDA", occurredAt: { gte: inicioDoMes } },
  });

  return { usadas, max, atingiu: usadas >= max, fracao: Math.min(1, usadas / max) };
}