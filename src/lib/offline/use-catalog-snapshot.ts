"use client";

import { useEffect } from "react";

import { gravarCatalogo, type CatalogoProduto } from "./queue";

/**
 * Grava o catálogo do PDV em cache sempre que a tela carrega com rede
 * (Fase 3.1 — modo offline, ADR-006 §3).
 *
 * ## Por que um snapshot e não buscar do banco
 *
 * A rota `/dashboard/pdv/offline` é client-side de propósito: com a rede
 * caída, uma Server Component que lê Prisma não renderiza. O aparelho precisa
 * ter os produtos por conta própria, e a única momento em que eles são
 * gratuitos é quando o PDV online acabou de carregar.
 *
 * ## Por que só com rede
 *
 * Gravar durante o offline sobrescreveria o catálogo bom com o que a tela
 * vazia oferece — apagando justamente o dado que o modo offline existe para
 * usar. Por isso a checagem de `navigator.onLine`: sem rede, este hook não
 * toca em nada.
 *
 * ## Por que o preço cacheado não decide nada
 *
 * O snapshot serve para *listar* e *cobrar no caixa*, não para o servidor
 * decidir o preço. `SaleService` sempre relê o preço do banco (ADR-006 §6),
 * então um preço velho aqui vira divergência visível de caixa, nunca uma
 * venda registrada por menos.
 */
export function useCatalogSnapshot(tenantId: number, produtos: CatalogoProduto[]): void {
  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return;
    }

    // `navigator.onLine` é dica, não fato (ADR-006 §4): só o navegador local
    // sabe, e ele erra em rede captive. Aqui a falha é inofensiva — pular a
    // gravação só significa um snapshot mais velho, nunca um apagado.
    if (!navigator.onLine || produtos.length === 0) {
      return;
    }

    gravarCatalogo(tenantId, produtos);
  }, [tenantId, produtos]);
}
