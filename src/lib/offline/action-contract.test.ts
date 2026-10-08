import { describe, expect, it } from "vitest";
import { reconciliar } from "./reconcile";
import type { ResultadoEnvio, VendaPendente } from "./types";

/**
 * `createSaleAction` responde `{ok: id}` OU `{error: string}`. O `error` é
 * lido pelo sync como resposta do servidor, e a distinção que o ADR-006
 * depende é: erro de REDE reenfileira, REJEIÇÃO bloqueia ou remove.
 *
 * `error: "rede"` é o canal que a action usa para falha de infraestrutura, que
 * pode ter ocorrido depois da venda já estar gravada. Sem ele, o catch genérico
 * devolvia `{error: "sale"}` e o reconciliador via isso como erro desconhecido
 * → bloqueava. O dinheiro ficava no banco e a entrada presa na fila, sem o
 * operador ter como saber que syncou.
 *
 * Estes testes travam esse contrato do lado puro. `paraResultado` está
 * replicado aqui de `use-sync.ts` porque o arquivo é `"use client"` e não é
 * importável em ambiente de teste.
 */

const VENDA: VendaPendente = {
  idempotencyKey: "k-1",
  occurredAt: 1_760_000_000_000,
  items: [{ productId: 1, quantity: 1 }],
  paymentMethod: "DINHEIRO",
  discount: 0,
  customerName: "",
  tentativas: 0,
};

/** Réplica de `paraResultado` em use-sync.ts. */
function paraResultado(res: { ok: number } | { error: string }): ResultadoEnvio {
  if ("ok" in res) return { tipo: "aceita", saleId: res.ok };
  if (res.error === "rede") return { tipo: "erro_de_rede", causa: "falha de infraestrutura" };
  return { tipo: "rejeitada", erro: res.error };
}

describe("contrato action → reconciliador", () => {
  it("ok: a venda sai da fila com o id do banco", () => {
    expect(reconciliar(VENDA, paraResultado({ ok: 7 }), 0)).toEqual({
      tipo: "remover",
      saleId: 7,
    });
  });

  it("erro de negócio final: remove (não melhora com repetição)", () => {
    for (const erro of ["invalid", "empty", "discount", "amount", "forbidden"]) {
      expect(reconciliar(VENDA, paraResultado({ error: erro }), 0).tipo, erro).toBe("remover");
    }
  });

  it("divergência: bloqueia para conferência manual", () => {
    for (const erro of ["stock", "cashbox"]) {
      expect(reconciliar(VENDA, paraResultado({ error: erro }), 0).tipo, erro).toBe("bloqueada");
    }
  });

  it('"rede": reenfileira em vez de bloquear — este é o fix', () => {
    // Regressão de 08/10: a venda já estava no banco e a entrada ficava presa
    // na fila. Reenviar é seguro (idempotencyKey) e destrava; bloquear não.
    const resultado = paraResultado({ error: "rede" });
    expect(resultado.tipo).toBe("erro_de_rede");

    const d = reconciliar(VENDA, resultado, 0);
    expect(d.tipo).toBe("reenfileirar");
    expect(d.tipo).not.toBe("bloqueada");
    expect(d.tipo).not.toBe("remover");

    if (d.tipo === "reenfileirar") expect(d.esperaMs).toBeGreaterThan(0);
  });

  it('"rede" no limite de tentativas bloqueia em vez de ficar em loop', () => {
    const d = reconciliar(VENDA, paraResultado({ error: "rede" }), 99);
    expect(d.tipo).toBe("bloqueada");
    expect(d.tipo).not.toBe("remover");
  });

  it("erro desconhecido bloqueia — o erro honesto", () => {
    expect(reconciliar(VENDA, paraResultado({ error: "algo_novo" }), 0).tipo).toBe("bloqueada");
  });

  it("nenhum caminho de falha descarta venda", () => {
    const falhas = [
      { error: "rede" },
      { error: "stock" },
      { error: "cashbox" },
      { error: "algo_novo" },
    ];
    for (const r of falhas) {
      expect(reconciliar(VENDA, paraResultado(r), 0).tipo, r.error).not.toBe("remover");
    }
  });
});