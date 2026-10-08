import { describe, expect, it, beforeEach } from "vitest";
import { lerFila, gravarFila, contarPendentes, remover } from "./queue";
import { reconciliar } from "./reconcile";
import { ERROS_DIVERGENCIA, ERROS_FINAIS, type VendaPendente } from "./types";

/**
 * O critério de pronto do ADR-006 é "vender offline nunca perde venda e nunca
 * duplica na fila". `reconciliar` decide o destino de cada entrada depois do
 * envio e é função pura — o que dá para travar a decisão aqui, sem navegador.
 *
 * O que este teste NÃO prova é o comportamento com rede caída, que é o que o
 * roteiro manual de `docs/changes/2026-10-02-modo-offline-pdv.md` fecha. Este
 * arquivo trava a decisão, não a rede.
 */

const VENDA: VendaPendente = {
  idempotencyKey: "abc-123",
  occurredAt: 1_760_000_000_000,
  items: [{ productId: 1, quantity: 2 }],
  paymentMethod: "DINHEIRO",
  discount: 0,
  customerName: "",
  tentativas: 0,
};

// Mesma chave que `chaveFila` monta em queue.ts.
const CHAVE = "boramais:pdv:fila:2:5";

beforeEach(() => window.localStorage.clear());

describe("reconciliar — destino da venda na fila", () => {
  it("aceita: remove da fila", () => {
    expect(reconciliar(VENDA, { tipo: "aceita", saleId: 42 }, 0)).toEqual({
      tipo: "remover",
      saleId: 42,
    });
  });

  it("sessão expirada: pausa, nunca descarta", () => {
    const d = reconciliar(VENDA, { tipo: "sessao_expirada" }, 0);
    expect(d.tipo).toBe("pausar");
  });

  it("erro de rede antes do limite: reenfileira com espera", () => {
    const d = reconciliar(VENDA, { tipo: "erro_de_rede", causa: "timeout" }, 0);
    expect(d.tipo).toBe("reenfileirar");
    if (d.tipo === "reenfileirar") expect(d.esperaMs).toBeGreaterThan(0);
  });

  it("erro de rede no limite: bloqueia, não descarta", () => {
    expect(reconciliar(VENDA, { tipo: "erro_de_rede", causa: "timeout" }, 99).tipo).toBe("bloqueada");
  });

  it("toda divergência do servidor bloqueia para o operador resolver", () => {
    // Insistir devolveria o mesmo erro para sempre (ADR-006 §5): o servidor
    // aceita venda offline e registra divergência em vez de recusar.
    for (const erro of ERROS_DIVERGENCIA) {
      const d = reconciliar(VENDA, { tipo: "rejeitada", erro }, 0);
      expect(d.tipo, erro).toBe("bloqueada");
    }
  });

  it("todo erro final remove, porque não melhora com repetição", () => {
    for (const erro of ERROS_FINAIS) {
      const d = reconciliar(VENDA, { tipo: "rejeitada", erro }, 0);
      expect(d.tipo, erro).toBe("remover");
    }
  });

  it("erro desconhecido bloqueia — o erro honesto", () => {
    expect(reconciliar(VENDA, { tipo: "rejeitada", erro: "sei_la" }, 0).tipo).toBe("bloqueada");
  });

  it("INVARIANTE: só resposta conclusiva remove. Falha nunca descarta venda.", () => {
    // É o critério do ADR escrito como asserção: enquanto o servidor não dá
    // resposta conclusiva, a venda fica na fila para o operador recuperar.
    const inconclusivos = [
      { tipo: "sessao_expirada" } as const,
      { tipo: "erro_de_rede", causa: "offline" } as const,
      { tipo: "rejeitada", erro: "stock" } as const,
      { tipo: "rejeitada", erro: "cashbox" } as const,
      { tipo: "rejeitada", erro: "desconhecido" } as const,
    ];
    for (const r of inconclusivos) {
      expect(reconciliar(VENDA, r, 0).tipo, r.tipo).not.toBe("remover");
    }
  });

  it("a chave de idempotência sobrevive ao round-trip pela fila", () => {
    // Reenvio com chave nova criaria venda duplicada. A chave é o que protege,
    // então precisa ser preservada exatamente na leitura e na gravação.
    gravarFila(2, 5, [VENDA]);
    expect(lerFila(2, 5)[0].idempotencyKey).toBe("abc-123");

    const d = reconciliar(lerFila(2, 5)[0], { tipo: "aceita", saleId: 7 }, 0);
    expect(d).toEqual(reconciliar(lerFila(2, 5)[0], { tipo: "aceita", saleId: 7 }, 0));
  });
});

describe("fila no storage", () => {
  it("vazia quando não há nada salvo", () => {
    expect(lerFila(2, 5)).toEqual([]);
  });

  it("grava, lê e conta", () => {
    expect(gravarFila(2, 5, [VENDA])).toBe(true);
    expect(lerFila(2, 5)).toHaveLength(1);
    expect(contarPendentes(2, 5)).toBe(1);
  });

  it("remover tira exatamente uma venda e preserva a outra", () => {
    gravarFila(2, 5, [VENDA, { ...VENDA, idempotencyKey: "def-456" }]);
    expect(contarPendentes(2, 5)).toBe(2);
    remover(2, 5, "abc-123");
    const lida = lerFila(2, 5);
    expect(lida).toHaveLength(1);
    expect(lida[0].idempotencyKey).toBe("def-456");
  });

  it("JSON corrompido devolve fila vazia em vez de quebrar", () => {
    window.localStorage.setItem(CHAVE, "{nao é json");
    expect(lerFila(2, 5)).toEqual([]);
  });

  it("entrada sem idempotencyKey é filtrada e a vizinha sobrevive", () => {
    window.localStorage.setItem(
      CHAVE,
      JSON.stringify([VENDA, { ...VENDA, idempotencyKey: "" }])
    );
    const lida = lerFila(2, 5);
    expect(lida).toHaveLength(1);
    expect(lida[0].idempotencyKey).toBe("abc-123");
  });

  it("entrada sem occurredAt é filtrada", () => {
    const semData = { ...VENDA, occurredAt: undefined } as unknown as VendaPendente;
    window.localStorage.setItem(CHAVE, JSON.stringify([VENDA, semData]));
    expect(lerFila(2, 5)).toHaveLength(1);
  });

  it("fila de um tenant ou usuário não vaza para o outro", () => {
    gravarFila(2, 5, [VENDA]);
    expect(lerFila(99, 5)).toEqual([]);
    expect(lerFila(2, 77)).toEqual([]);
  });
});