/**
 * Tipos da fila offline do PDV (Fase 3.1 — modo offline).
 *
 * Sem `"use client"` e sem React de propósito: este arquivo é o dicionário do
 * payload, e é importado tanto pelo client que enfileira quanto pelos testes.
 * A parte que fala com `localStorage` está em `queue.ts`.
 */

/** Item de venda enfileirado. Espelha o FormData de `createSaleAction`. */
export interface FilaItem {
  productId: number;
  quantity: number;
}

export interface FilaParcela {
  method: string;
  amount: number;
}

/**
 * Uma venda confirmada no PDV que ainda não chegou ao servidor.
 *
 * `idempotencyKey` é gerada **no momento da confirmação**, não no retry: é ela
 * que faz o `@@unique([tenantId, idempotencyKey])` do banco transformar replay
 * em no-op. Chave nova a cada retry criaria venda duplicada, que é exatamente o
 * problema que o modo offline existe para não causar.
 *
 * `occurredAt` é ISO com fuso do momento da venda. O servidor usa para cupom e
 * DRE (ver `ADR-006` §8): sem ele, toda venda sincronizada cai no dia do sync
 * e o relatório do dia real fica errado.
 */
export interface VendaPendente {
  /** Chave de idempotência — estável entre retries. */
  idempotencyKey: string;
  /** Epoch ms da venda, como numero. Mais simples de comparar que string. */
  occurredAt: number;
  items: FilaItem[];
  paymentMethod: string;
  /** Split dinheiro+pix. Ausente = pagamento unico via `paymentMethod`. */
  payments?: FilaParcela[];
  cashBoxId?: number;
  /** Centavos. */
  discount: number;
  /** Centavos recebido do cliente; o troco é calculado pelo servidor. */
  receivedAmount?: number;
  customerName: string;
  /** Tentativas de envio ate agora. Alimenta o backoff. */
  tentativas: number;
  /** Ultimo erro visto, para o operador entender por que a venda esta presa. */
  ultimoErro?: string;
}

/**
 * Resultado de uma tentativa de envio, do ponto de vista do reconciliador.
 *
 * A distinção que importa é `erro_de_rede` vs `rejeitada`: a primeira é o
 * sistema fora de ar e a fila espera; a segunda é o servidor respondendo, e
 * repetir a mesma requisição devolve a mesma resposta.
 */
export type ResultadoEnvio =
  | { tipo: "aceita"; saleId: number }
  | { tipo: "rejeitada"; erro: string }
  | { tipo: "erro_de_rede"; causa: string }
  | { tipo: "sessao_expirada" };

/** Divergencias que o servidor pode reportar numa venda vinda da fila. */
export const ERROS_DIVERGENCIA = ["stock", "cashbox"] as const;

/**
 * Erros de negocio que nao melhoram com repeticao.
 *
 * `invalid` inclui produto inexistente ou inativo — nada disso volta a dar certo
 * na proxima tentativa. O `forbidden` e do proxy: sessao valida, permissao
 * negada, e repetir so gasta chamada ate o rate-limit (60/min) estourar.
 */
export const ERROS_FINAIS = [
  "invalid",
  "empty",
  "discount",
  "amount",
  "forbidden",
] as const;

export type ErroDivergencia = (typeof ERROS_DIVERGENCIA)[number];
export type ErroFinal = (typeof ERROS_FINAIS)[number];

/** Rotulo curto para o operador, sem jargao tecnico. */
export const MENSAGEM_DIVERGENCIA: Record<ErroDivergencia, string> = {
  stock: "estoque insuficiente no momento da sincronizacao",
  cashbox: "caixa nao estava aberto na sincronizacao",
};
