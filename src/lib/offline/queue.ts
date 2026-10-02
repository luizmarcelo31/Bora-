"use client";

/**
 * Fila de vendas pendentes do PDV (Fase 3.1 — modo offline).
 *
 * ## Por que `localStorage`
 *
 * O repo ja guarda estado de dispositivo assim (`changelog-seen.ts`,
 * `onboarding-seen.ts`), e o payload e pequeno: ~300 B por venda, com teto de
 * 200 entradas fica perto de 60 kB de um limite de 5 MB. `localStorage` e
 * sincrono, o que torna a fila trivialmente consistente — nunca ha "gravou mas
 * ainda nao reflected" no meio de uma leitura.
 *
 * IndexedDB entra como troca se a carga por venda passar de ~1 kB (foto de
 * produto embutida, por exemplo). Como a fila e a unica coisa que fala com
 * storage, a troca fica neste arquivo.
 *
 * ## Por que `userId` na chave
 *
 * O PDV e compartilhado entre operadores: existe PIN de troca em
 * `pdv-client.tsx` para um atendente assumir o caixa sem logout. Sem `userId`
 * na chave, as vendas pendentes de um operador seriam sincronizadas no login do
 * outro — e o `Sale.userId` registra quem recebeu a venda, nao quem a
 * transmitiu.
 */

import type { VendaPendente } from "./types";

/** Teto de entradas. Protege o storage e limita o pior caso de uma fila presa. */
export const MAX_ENTRADAS = 200;

/** Evento interno: muda so nesta aba, que e onde a fila vive. */
export const FILA_EVENT = "boramais:offline:fila-mudou";

function chaveFila(tenantId: number, userId: number): string {
  return `boramais:pdv:fila:${tenantId}:${userId}`;
}

function chaveCatalogo(tenantId: number): string {
  return `boramais:pdv:catalog:${tenantId}`;
}

/**
 * Le a fila crua do storage.
 *
 * Devolve `[]` em qualquer falha — storage bloqueado (modo privado), JSON
 * corrompido por outra versao do app, ou ausencia de `window` durante o render
 * no servidor. Um throw aqui derrubaria a tela do PDV inteira por causa de um
 * recurso opcional; por isso leitura falha e significa sempre "fila vazia".
 */
export function lerFila(tenantId: number, userId: number): VendaPendente[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(chaveFila(tenantId, userId));

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    // Filtro de integridade: uma entrada invalida e removida em vez de derrubar
    // as vizinhas. `reconciliar` precisa de `idempotencyKey`, `items` e
    // `tentativas` para decidir; sem os tres, a entrada nao e sincronizavel.
    return parsed.filter(ehVendaPendenteValida);
  } catch {
    return [];
  }
}

/**
 * Guarda a fila.
 *
 * Retorna `false` quando nao ha espaco — o caller decide o que fazer, e o
 * chamador no PDV mostra "venda nao salva, sem espaco no aparelho". Falhar em
 * silencio aqui seria perder venda sem o operador perceber.
 */
export function gravarFila(
  tenantId: number,
  userId: number,
  vendas: VendaPendente[]
): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(chaveFila(tenantId, userId), JSON.stringify(vendas));
    window.dispatchEvent(new Event(FILA_EVENT));
    return true;
  } catch {
    return false;
  }
}

/**
 * Integridade de uma entrada da fila.
 *
 * Verifica o minimo para a entrada ser sincronizavel. Deliberadamente
 * tolerante nos campos opcionais: uma venda gravada por versao anterior sem
 * `payments` continua valida, porque `paymentMethod` cobre o caso simples.
 */
export function ehVendaPendenteValida(valor: unknown): valor is VendaPendente {
  if (typeof valor !== "object" || valor === null) {
    return false;
  }

  const venda = valor as Partial<VendaPendente>;

  if (typeof venda.idempotencyKey !== "string" || venda.idempotencyKey.length === 0) {
    return false;
  }

  if (typeof venda.occurredAt !== "number" || !Number.isFinite(venda.occurredAt)) {
    return false;
  }

  if (typeof venda.tentativas !== "number") {
    return false;
  }

  if (!Array.isArray(venda.items) || venda.items.length === 0) {
    return false;
  }

  return venda.items.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      Number.isInteger(item.productId) &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0
  );
}

/**
 * Enfileira uma venda, mantendo ordem FIFO.
 *
 * A ordem importa: cada venda decrementa estoque e consome um numero de cupom,
 * entao reordenar muda o resultado da reconciliacao.
 *
 * Deduplica por `idempotencyKey`. Um duplo toque em "confirmar" com a rede
 * caida criaria duas entradas para a mesma venda, e o servidor gravaria as
 * duas — o `idempotencyKey` no banco protege o retry, nao a fila local.
 */
export function enfileirar(
  tenantId: number,
  userId: number,
  venda: VendaPendente
): { ok: boolean; motivo?: "cheia" | "sem-espaco" } {
  const atual = lerFila(tenantId, userId);

  if (atual.some((v) => v.idempotencyKey === venda.idempotencyKey)) {
    return { ok: true };
  }

  if (atual.length >= MAX_ENTRADAS) {
    return { ok: false, motivo: "cheia" };
  }

  const gravado = gravarFila(tenantId, userId, [...atual, venda]);

  if (!gravado) {
    return { ok: false, motivo: "sem-espaco" };
  }

  return { ok: true };
}

/** Remove uma venda ja sincronizada. */
export function remover(tenantId: number, userId: number, idempotencyKey: string): void {
  const atual = lerFila(tenantId, userId);
  const restante = atual.filter((v) => v.idempotencyKey !== idempotencyKey);

  if (restante.length !== atual.length) {
    gravarFila(tenantId, userId, restante);
  }
}

/**
 * Reenfileira no fim da fila com a tentativa contada.
 *
 * Voltar ao fim, e nao ao inicio, porque a ordem das vendas e a ordem em que o
 * cliente foi atendido. Reescrever a posicao mudaria qual venda ganha o estoque
 * restante quando duas disputam o mesmo saldo.
 */
export function reenfileirar(
  tenantId: number,
  userId: number,
  venda: VendaPendente,
  erro: string
): void {
  const atual = lerFila(tenantId, userId).filter(
    (v) => v.idempotencyKey !== venda.idempotencyKey
  );

  gravarFila(tenantId, userId, [
    ...atual,
    { ...venda, tentativas: venda.tentativas + 1, ultimoErro: erro },
  ]);
}

/** Quantas vendas aguardam sincronizacao. */
export function contarPendentes(tenantId: number, userId: number): number {
  return lerFila(tenantId, userId).length;
}

// ============================================================
// CATALOGO (snapshot para o PDV sem rede)
// ============================================================

/** Produto no formato que o PDV consome. */
export interface CatalogoProduto {
  id: number;
  name: string;
  price: number;
  stock: number;
  barcode: string | null;
  category: string | null;
  imageUrl: string | null;
}

/**
 * Le o catalogo em cache do tenant.
 *
 * A chave e por tenant e nao por operador: o catalogo e dado da loja, nao do
 * usuario. Dois operadores no mesmo aparelho veem o mesmo preco — que e o
 * correto, ja que o preco autoritativo vem do servidor de qualquer jeito.
 */
export function lerCatalogo(tenantId: number): CatalogoProduto[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(chaveCatalogo(tenantId));

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (p): p is CatalogoProduto =>
        typeof p === "object" &&
        p !== null &&
        Number.isInteger((p as CatalogoProduto).id) &&
        Number.isInteger((p as CatalogoProduto).price)
    );
  } catch {
    return [];
  }
}

/** Grava o catalogo em cache. `false` quando nao ha espaco no aparelho. */
export function gravarCatalogo(tenantId: number, produtos: CatalogoProduto[]): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(chaveCatalogo(tenantId), JSON.stringify(produtos));
    return true;
  } catch {
    return false;
  }
}
