import { prisma } from "@/lib/db";

/**
 * Registro de uso da plataforma — o sinal que responde "quem ainda usa isto?".
 *
 * ## Por que este arquivo existe
 *
 * `Tenant.lastActivityAt` era gravado em um único lugar do projeto inteiro: o
 * `createTenantAction`. O nome diz "última atividade", o conteúdo era "data de
 * criação". Consequência: o alarme de "empresa dormente há 14 dias" disparava
 * para toda empresa com mais de 14 dias de vida, mesmo as que vendem todo dia,
 * e a lista de "mais ativas" da visão geral estava ordenada por data de criação.
 *
 * Um sinal de churn que nunca muda não é um sinal de churn: é ruído que treina
 * você a ignorar o painel.
 *
 * ## Por que é limited a uma janela
 *
 * O PDV grava uma venda a cada poucos segundos. Um `update` por venda colocaria
 * uma escrita no mesmo banco, na mesma transação, no caminho mais quente que
 * existe no produto — e o custo apareceria como lentidão no balcão.
 *
 * Então o update só acontece quando o valor guardado já envelheceu. O
 * `updateMany` com a janela no `where` resolve isso numa ida só ao banco: quando
 * está fresco, nenhuma linha casa e nada é escrito. Custa uma consulta barata em
 * vez de uma escrita contending.
 *
 * O resultado é preciso a 5 minutos. Para a pergunta que ele responde — "essa
 * empresa está viva?" — cinco minutos não fazem diferença.
 *
 * ## Por que isto não vaza dado do cliente
 *
 * Guarda *quando*, nunca *o quê*. A plataforma precisa saber se o produto está
 * sendo usado para durar; não precisa saber o que foi vendido. Essa separação é
 * a razão de o sinal existir em vez de "soma as vendas do tenant" — ver
 * `docs/PRIVACIDADE-PLATAFORMA.md`.
 */

/** Janela de escrita. Abaixo disso, a atividade já está fresca. */
const JANELA_MS = 5 * 60 * 1000;

export async function marcarAtividade(tenantId: number | null | undefined) {
  if (!tenantId) return;

  const agora = new Date();
  const corte = new Date(agora.getTime() - JANELA_MS);

  try {
    await prisma.tenant.updateMany({
      where: {
        id: tenantId,
        OR: [{ lastActivityAt: null }, { lastActivityAt: { lt: corte } }],
      },
      data: { lastActivityAt: agora },
    });
  } catch {
    // Este sinal alimenta painéis, não transações. Se ele falhar, a venda foi
    // registrada do mesmo jeito — deixá-lo derrubar a operação seria trocar uma
    // métrica quebrada por uma venda perdida.
  }
}