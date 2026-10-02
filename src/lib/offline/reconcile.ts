import {
  ERROS_DIVERGENCIA,
  ERROS_FINAIS,
  MENSAGEM_DIVERGENCIA,
  type ErroDivergencia,
  type ErroFinal,
  type ResultadoEnvio,
  type VendaPendente,
} from "./types";

/**
 * Politica de conflito do modo offline (`ADR-006` §5, §7 e §10).
 *
 * Funcao pura: entrada a saida, sem rede, sem storage, sem relogio. E por isso
 * que a politica fica aqui e nao dentro do botao "sincronizar" — a parte
 * delicate do modo offline (o que fazer quando duas lojas venderam o mesmo
 * estoque) e testavel sem browser, sem banco e sem mock de rede.
 *
 * O desfecho de cada resposta:
 *
 * - aceita        -> remove. A venda existe no banco; o servidor cuidou da
 *                    idempotencia, e repetir seria criar venda duplicada.
 * - erro de rede  -> reenfileira com espera. O sistema esta fora do ar; a venda
 *                    continua pendente e nada se perde.
 * - sessao expirada -> pausa, preservando a fila. JWT do Supabase expira em ~1h
 *                    e uma fila pode ficar horas na espera. Descartar venda por
 *                    isso seria perder dinheiro por um login.
 * - rejeitada final -> remove, e a venda nao existe. Erro de negocio puro:
 *                    repetir devolve a mesma resposta.
 * - divergencia   -> bloqueia a entrada em vez de reenfileirar em laco.
 */

/** Teto de tentativas por entrada antes de parar de tentar sozinho. */
export const MAX_TENTATIVAS = 8;

/** Espera do primeiro retry. Cresce ate o teto. */
export const ESPERA_BASE_MS = 1_000;

/** Teto da espera — passar disso e so desperdicar bateria do aparelho. */
export const ESPERA_MAXIMA_MS = 30_000;

/**
 * Backoff exponencial com teto.
 *
 * O crescimento expoe que o problema e do servidor ou da rede, nao da venda: uma
 * loja sem 4G volta a funcionar em segundos, e so o aparelho sem rede estavel
 * chega a 30s.
 */
export function esperaParaReenvio(tentativas: number): number {
  const bruta = ESPERA_BASE_MS * Math.pow(2, Math.max(0, tentativas - 1));
  return Math.min(ESPERA_MAXIMA_MS, bruta);
}

/**
 * O que fazer com uma venda pendente depois de uma tentativa de envio.
 *
 * `bloqueada` e o estado terminal que nao e sucesso: a venda nao entrou, mas
 * continua na fila para o operador decidir. E o unico caminho em que uma venda
 * pode ficar parada — e e preferivel a descartar dinheiro.
 */
export type Decisao =
  | { tipo: "remover"; saleId: number }
  | { tipo: "reenfileirar"; esperaMs: number; erro: string }
  | { tipo: "pausar"; motivo: string }
  | { tipo: "bloqueada"; erro: string; motivo: string };

function eDivergencia(erro: string): erro is ErroDivergencia {
  return (ERROS_DIVERGENCIA as readonly string[]).includes(erro);
}

function eFinal(erro: string): erro is ErroFinal {
  return (ERROS_FINAIS as readonly string[]).includes(erro);
}

/**
 * Decide o destino de uma venda pendente a partir da resposta do servidor.
 *
 * `tentativas` e a contagem **antes** desta tentativa: quem chama incrementa
 * depois de aplicar a decisao. Assim a espera e a espera da tentativa que falhou,
 * e uma entrada na primeira tentativa ja espera o base em vez de zero.
 */
export function reconciliar(
  venda: VendaPendente,
  resultado: ResultadoEnvio,
  tentativas: number
): Decisao {
  if (resultado.tipo === "aceita") {
    return { tipo: "remover", saleId: resultado.saleId };
  }

  if (resultado.tipo === "sessao_expirada") {
    // A fila e preservada inteira. Pausar, nunca descartar.
    return { tipo: "pausar", motivo: "Sessao expirada. Entre novamente para sincronizar." };
  }

  if (resultado.tipo === "erro_de_rede") {
    if (tentativas >= MAX_TENTATIVAS) {
      return {
        tipo: "bloqueada",
        erro: resultado.causa,
        motivo: "Nao foi possivel sincronizar apos varias tentativas.",
      };
    }

    return {
      tipo: "reenfileirar",
      esperaMs: esperaParaReenvio(tentativas + 1),
      erro: resultado.causa,
    };
  }

  // Rejeitada: o servidor respondeu. Repetir nao muda a resposta.
  if (eDivergencia(resultado.erro)) {
    // O servidor aceita venda offline e registra divergencia em vez de recusar
    // (ADR-006 §5). Se ele recusou mesmo assim, ou se a venda chegou sem a
    // marca de offline, insistir devolve o mesmo erro para sempre — a entrada
    // fica bloqueada para o operador resolver, com o motivo legivel.
    return {
      tipo: "bloqueada",
      erro: resultado.erro,
      motivo: `Venda nao sincronizou: ${MENSAGEM_DIVERGENCIA[resultado.erro]}.`,
    };
  }

  if (eFinal(resultado.erro)) {
    // Erro de negocio: produto inativo, desconto invalido, sem permissao. A
    // venda nao existe no servidor e nao vai passar. Remove para a fila nao
    // crescer com lixo, e o erro fica registrado na venda para conferencia.
    return { tipo: "remover", saleId: -1 };
  }

  // Erro desconhecido: tratar como divergencia e bloquear e o erro honesto.
  // Reenfileirar em laco contra um erro que nao reconhecemos consome bateria e
  // esconde o problema; descartar seria perder venda.
  return {
    tipo: "bloqueada",
    erro: resultado.erro,
    motivo: `Venda nao sincronizou (${resultado.erro}). Requer conferences manual.`,
  };
}
