import { describe, expect, it } from "vitest";
import { FormaPagamento } from "@prisma/client";
import { PAYMENT_OPTIONS, PAYMENT_LABELS, paymentLabel } from "./payments";

describe("payments", () => {
  it("oferece só os 4 métodos ativos no PDV", () => {
    expect(PAYMENT_OPTIONS.map((o) => o.value)).toEqual([
      "DINHEIRO",
      "PIX",
      "CREDITO",
      "DEBITO",
    ]);
    expect(PAYMENT_OPTIONS.map((o) => o.label)).toEqual([
      "Dinheiro",
      "Pix",
      "Crédito",
      "Débito",
    ]);
  });

  it("rotula ativos e legados em português", () => {
    expect(paymentLabel("DINHEIRO")).toBe("Dinheiro");
    expect(paymentLabel("PIX")).toBe("Pix");
    expect(paymentLabel("CREDITO")).toBe("Crédito");
    expect(paymentLabel("DEBITO")).toBe("Débito");
    expect(paymentLabel("CARTAO")).toBe("Cartão");
    expect(paymentLabel("TRANSFERENCIA")).toBe("Transferência");
    expect(paymentLabel("CHEQUE")).toBe("Cheque");
    expect(paymentLabel("OUTRO")).toBe("Outro");
  });

  it("cobre todos os valores do enum", () => {
    expect(Object.keys(PAYMENT_LABELS).sort()).toEqual(Object.values(FormaPagamento).sort());
  });

  it("valor desconhecido devolve o próprio código, sem quebrar a tela", () => {
    expect(paymentLabel("FIADO")).toBe("FIADO");
  });
});
