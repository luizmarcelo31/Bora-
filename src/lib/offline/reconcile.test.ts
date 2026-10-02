import { describe, expect, it } from "vitest";

import {
  ESPERA_BASE_MS,
  ESPERA_MAXIMA_MS,
  MAX_TENTATIVAS,
  esperaParaReenvio,
  reconciliar,
  type Decisao,
} from "./reconcile";
import type { VendaPendente } from "./types";

function venda(over: Partial<VendaPendente> = {}): VendaPendente {
  return {
    idempotencyKey: "key-1",
    occurredAt: 1_757_000_000_000,
    items: [{ productId: 10, quantity: 2 }],
    paymentMethod: "DINHEIRO",
    discount: 0,
    customerName: "",
    tentativas: 0,
    ...over,
  };
}

function soTipo(d: Decisao): string {
  return d.tipo;
}

describe("reconciliar — destino da venda pendente", () => {
  describe("aceita", () => {
    it("remove e devolve o id da venda criada", () => {
      // O servidor gravou a venda: manter na fila reenviaria o mesmo FormData.
      const d = reconciliar(venda(), { tipo: "aceita", saleId: 4211 }, 0);
      expect(d).toEqual({ tipo: "remover", saleId: 4211 });
    });

    it("remove mesmo depois de muitas tentativas", () => {
      // Replay e seguro pelo unique do banco, mas nao ha razao para reprocessar.
      const d = reconciliar(venda(), { tipo: "aceita", saleId: 7 }, MAX_TENTATIVAS + 3);
      expect(soTipo(d)).toBe("remover");
    });
  });

  describe("erro de rede", () => {
    it("reenfileira em vez de perder a venda", () => {
      // A venda foi entregue ao cliente. Desistir aqui e perder dinheiro.
      const d = reconciliar(venda(), { tipo: "erro_de_rede", causa: "Failed to fetch" }, 0);
      expect(soTipo(d)).toBe("reenfileirar");
      if (d.tipo === "reenfileirar") {
        expect(d.esperaMs).toBe(ESPERA_BASE_MS);
        expect(d.erro).toBe("Failed to fetch");
      }
    });

    it("cresce a espera a cada tentativa ate o teto", () => {
      const esperas = [0, 1, 2, 3, 4, 5].map((t) => {
        const d = reconciliar(venda(), { tipo: "erro_de_rede", causa: "x" }, t);
        return d.tipo === "reenfileirar" ? d.esperaMs : -1;
      });

      expect(esperas[0]).toBe(1_000);
      expect(esperas[1]).toBe(2_000);
      expect(esperas[2]).toBe(4_000);
      // Teto de 30s: aparelho sem rede estavel nao ganha com espera maior.
      expect(esperas[5]).toBe(ESPERA_MAXIMA_MS);
      for (const e of esperas) expect(e).toBeLessThanOrEqual(ESPERA_MAXIMA_MS);
    });

    it("bloqueia apos o teto de tentativas em vez de girar para sempre", () => {
      // Insistir contra uma rede que nao volta consome bateria e esconde o
      // problema. A venda continua na fila, visivel para o operador.
      const d = reconciliar(
        venda({ tentativas: MAX_TENTATIVAS }),
        { tipo: "erro_de_rede", causa: "offline" },
        MAX_TENTATIVAS
      );
      expect(soTipo(d)).toBe("bloqueada");
      if (d.tipo === "bloqueada") {
        expect(d.motivo).toContain("varias tentativas");
      }
    });
  });

  describe("sessao expirada", () => {
    it("pausa sem descartar a fila", () => {
      // JWT do Supabase expira em ~1h e a fila pode ficar horas esperando.
      const d = reconciliar(venda(), { tipo: "sessao_expirada" }, 2);
      expect(soTipo(d)).toBe("pausar");
      if (d.tipo === "pausar") {
        expect(d.motivo).toContain("Sessao expirada");
      }
    });

    it("pausa mesmo com muitas tentativas acumuladas", () => {
      const d = reconciliar(
        venda({ tentativas: MAX_TENTATIVAS }),
        { tipo: "sessao_expirada" },
        MAX_TENTATIVAS
      );
      // Nao pode virar "bloqueada": sessao expirada e transitório, e bloquear
      // exigiria intervencao manual para um problema que um login resolve.
      expect(soTipo(d)).toBe("pausar");
    });
  });

  describe("divergencia (estoque / caixa)", () => {
    it("bloqueia com motivo legivel, sem laco de reenvio", () => {
      // Politica do ADR §5: a venda vence o estoque. O servidor deveria ter
      // aceitado e registrado divergencia; recusar significa que algo no
      // caminho nao marcou a venda como offline. Insistir devolve o mesmo erro.
      const d = reconciliar(venda(), { tipo: "rejeitada", erro: "stock" }, 0);
      expect(soTipo(d)).toBe("bloqueada");
      if (d.tipo === "bloqueada") {
        expect(d.erro).toBe("stock");
        expect(d.motivo).toContain("estoque insuficiente");
      }
    });

    it("trata caixa fechado como divergencia tambem", () => {
      const d = reconciliar(venda(), { tipo: "rejeitada", erro: "cashbox" }, 0);
      expect(soTipo(d)).toBe("bloqueada");
      if (d.tipo === "bloqueada") {
        expect(d.motivo).toContain("caixa nao estava aberto");
      }
    });
  });

  describe("erro final de negocio", () => {
    it.each(["invalid", "empty", "discount", "amount", "forbidden"])(
      "%s remove a entrada em vez de repetir para sempre",
      (erro) => {
        // Repetir contra um erro de negocio gasta chamada e, no caso do
        // forbidden, estoura o rate-limit de 60/min do proxy.
        const d = reconciliar(venda(), { tipo: "rejeitada", erro }, 0);
        expect(soTipo(d)).toBe("remover");
      }
    );
  });

  describe("erro desconhecido", () => {
    it("bloqueia em vez de descartar a venda", () => {
      // Nao sabemos o que houve. Descartar seria perder venda; reenfileirar em
      // laco contra erro nao reconhecido consome bateria e esconde o bug.
      const d = reconciliar(venda(), { tipo: "rejeitada", erro: "hydration_mismatch" }, 0);
      expect(soTipo(d)).toBe("bloqueada");
      if (d.tipo === "bloqueada") {
        expect(d.motivo).toContain("hydration_mismatch");
      }
    });
  });

  it("so reenfileira com espera, nunca de imediato", () => {
    // Reenviar no mesmo tique atravessa a fila inteira contra uma rede caída.
    const rede = reconciliar(venda(), { tipo: "erro_de_rede", causa: "x" }, 0);
    if (rede.tipo !== "reenfileirar") {
      throw new Error("erro de rede na primeira tentativa deveria reenfileirar");
    }
    expect(rede.esperaMs).toBeGreaterThan(0);
  });
});

describe("esperaParaReenvio", () => {
  it("e monotonica ate o teto", () => {
    expect(esperaParaReenvio(1)).toBe(1_000);
    expect(esperaParaReenvio(2)).toBe(2_000);
    expect(esperaParaReenvio(10)).toBe(ESPERA_MAXIMA_MS);
    expect(esperaParaReenvio(999)).toBe(ESPERA_MAXIMA_MS);
  });

  it("trata tentativa negativa sem estourar", () => {
    expect(esperaParaReenvio(0)).toBe(ESPERA_BASE_MS);
    expect(esperaParaReenvio(-5)).toBe(ESPERA_BASE_MS);
  });
});
