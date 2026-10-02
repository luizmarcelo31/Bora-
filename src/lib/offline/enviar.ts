"use client";

import { createSaleAction } from "@/app/dashboard/pdv/actions";
import { enfileirar } from "./queue";
import type { FilaItem, FilaParcela, ResultadoEnvio, VendaPendente } from "./types";

/**
 * Envia de uma venda ao servidor, caindo na fila local quando não há rede
 * (Fase 3.1 — modo offline, ADR-006 §4).
 *
 * ## A distinção que decide tudo
 *
 * Só **erro de rede** enfileira. Um erro HTTP — inclusive 401 — significa que a
 * requisição chegou e foi recusada; repetir devolve a mesma resposta, e
 * enfileirar ali seria fingir que um erro de permissão é falta de internet.
 *
 * `navigator.onLine` não participa da decisão: ele diz se há interface de rede,
 * não se há rota até a API, e erra em rede captive. A decisão sai do erro que o
 * `fetch` realmente deu, e `onLine` só é consultado depois, para mensagem.
 */
export interface EnvioVenda {
  items: FilaItem[];
  paymentMethod: string;
  payments?: FilaParcela[];
  cashBoxId?: number;
  /** Centavos. */
  discount: number;
  /** Centavos recebidos do cliente, em string BRL como o PDV já usa. */
  received?: string;
  customerName: string;
  tenantId: number;
  userId: number;
}

export type ResultadoVenda =
  | { tipo: "venda"; saleId: number }
  | { tipo: "enfileirada"; motivo?: "cheia" | "sem-espaco" }
  | { tipo: "rejeitada"; erro: string };

/** `createSaleAction` devolve `{ok}` ou `{error}`; rede não chega aqui. */
function classificarResposta(res: { ok: number } | { error: string }): ResultadoEnvio {
  if ("ok" in res) {
    return { tipo: "aceita", saleId: res.ok };
  }
  return { tipo: "rejeitada", erro: res.error };
}

/**
 * O que o `fetch` de uma Server Action lança quando não chega ao servidor.
 *
 * `TypeError` é o caso do Chrome/Firefox para falha de conexão; Safari lança
 * `AbortError` em timeout. Os dois são "não tenho rede" para o operador, mesmo
 * que por motivos técnicos diferentes.
 */
function eErroDeRede(e: unknown): boolean {
  if (e instanceof TypeError) return true;
  if (e instanceof Error && (e.name === "AbortError" || e.name === "TimeoutError")) return true;
  return false;
}

/**
 * Monta a entrada da fila.
 *
 * A `idempotencyKey` é gerada **aqui**, no momento da confirmação, e não no
 * retry: é ela que faz o `@@unique([tenantId, idempotencyKey])` do banco
 * transformar reenvio em no-op. Chave nova a cada tentativa criaria venda
 * duplicada — exatamente o problema que o modo offline existe para evitar.
 */
export function montarVendaPendente(envio: EnvioVenda, idempotencyKey: string): VendaPendente {
  return {
    idempotencyKey,
    occurredAt: Date.now(),
    items: envio.items,
    paymentMethod: envio.paymentMethod,
    ...(envio.payments ? { payments: envio.payments } : {}),
    ...(envio.cashBoxId ? { cashBoxId: envio.cashBoxId } : {}),
    discount: envio.discount,
    ...(envio.received ? { receivedAmount: parseBRL(envio.received) } : {}),
    customerName: envio.customerName,
    tentativas: 0,
  };
}

function parseBRL(value: string): number {
  const n = value.replace(/\./g, "").replace(",", ".").trim();
  const v = Number(n);
  return Number.isFinite(v) && v >= 0 ? Math.round(v * 100) : 0;
}

/**
 * Confirma uma venda: tenta o servidor e, se não houver rede, enfileira.
 *
 * Devolve `venda` quando o banco gravou, `enfileirada` quando a venda ficou
 * garantida no aparelho, e `rejeitada` quando o servidor recusou — os três
 * casos precisam de mensagem diferente na tela, e o operador precisa saber em
 * qual deles a venda está salva.
 */
export async function enviarOuEnfileirar(
  envio: EnvioVenda,
  idempotencyKey: string
): Promise<ResultadoVenda> {
  const formData = new FormData();
  formData.set("items", JSON.stringify(envio.items));
  formData.set("paymentMethod", envio.paymentMethod);
  if (envio.payments) formData.set("payments", JSON.stringify(envio.payments));
  if (envio.cashBoxId) formData.set("cashBoxId", String(envio.cashBoxId));
  formData.set("discount", String(envio.discount));
  if (envio.received) formData.set("received", envio.received);
  formData.set("customerName", envio.customerName);
  formData.set("idempotencyKey", idempotencyKey);

  let resultado: ResultadoEnvio;

  try {
    resultado = classificarResposta(await createSaleAction(formData));
  } catch (e) {
    if (!eErroDeRede(e)) {
      // Erro de programação, não de rede. Fingir que é offline esconderia o bug
      // e enfileiraria uma venda que talvez nem seja válida.
      throw e;
    }
    resultado = { tipo: "erro_de_rede", causa: e instanceof Error ? e.message : "erro de rede" };
  }

  if (resultado.tipo === "aceita") {
    return { tipo: "venda", saleId: resultado.saleId };
  }

  if (resultado.tipo === "sessao_expirada") {
    // Nao deveria chegar aqui: `createSaleAction` redireciona quando a sessao
    // acaba, em vez de devolver erro. Se chegar, e recusa explicita — nunca
    // enfileirar, porque a fila e deste operador e so ele pode sincronizar.
    return { tipo: "rejeitada", erro: "invalid" };
  }

  if (resultado.tipo === "rejeitada") {
    return { tipo: "rejeitada", erro: resultado.erro };
  }

  // Sem rede: a venda fica no aparelho. `offline=1` e `occurredAt` viajam na
  // fila para que o servidor aceite estoque negativo e use a data real
  // (ADR-006 §5 e §8).
  const pendente = montarVendaPendente(envio, idempotencyKey);
  const gravado = enfileirar(envio.tenantId, envio.userId, pendente);

  if (!gravado.ok) {
    return { tipo: "enfileirada", motivo: gravado.motivo };
  }

  return { tipo: "enfileirada" };
}

export { parseBRL };
