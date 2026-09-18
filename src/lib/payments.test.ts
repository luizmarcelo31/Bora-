import { describe, expect, it } from "vitest";
import { PAYMENT_OPTIONS, PAYMENT_LABELS, paymentLabel } from "./payments";

describe("payments", () => {
  it("oferece só os 4 métodos ativos", () => {
    expect(PAYMENT_OPTIONS.map((o) => o.value)).toEqual(["CASH", "PIX", "CREDIT", "DEBIT"]);
    expect(PAYMENT_OPTIONS.map((o) => o.label)).toEqual(["Dinheiro", "Pix", "Crédito", "Débito"]);
  });

  it("rotula ativos e legados", () => {
    expect(paymentLabel("CASH")).toBe("Dinheiro");
    expect(paymentLabel("PIX")).toBe("Pix");
    expect(paymentLabel("CREDIT")).toBe("Crédito");
    expect(paymentLabel("DEBIT")).toBe("Débito");
    expect(paymentLabel("CARD")).toBe("Cartão");
    expect(paymentLabel("TRANSFER")).toBe("Transferência");
    expect(paymentLabel("CHECK")).toBe("Cheque");
    expect(paymentLabel("OTHER")).toBe("Outro");
  });

  it("cobre todos os valores do enum", () => {
    expect(Object.keys(PAYMENT_LABELS).sort()).toEqual(
      ["CASH", "PIX", "CREDIT", "DEBIT", "CARD", "TRANSFER", "CHECK", "OTHER"].sort()
    );
  });

  it("desconhecido retorna o próprio código", () => {
    expect(paymentLabel("FIADO")).toBe("FIADO");
  });
});
