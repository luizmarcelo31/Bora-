import { describe, expect, it } from "vitest";
import {
  SLA_HORAS,
  calcularMRR,
  calcularVencimentoSla,
  podeTransicionarAssinatura,
  slaVencido,
  transicaoTicketValida,
} from "./plataforma";

describe("plataforma", () => {
  it("SLA por prioridade segue 1h/4h/8h/24h", () => {
    expect(SLA_HORAS).toEqual({ CRITICA: 1, ALTA: 4, MEDIA: 8, BAIXA: 24 });
  });

  it("vencimento soma horas sem mutar base", () => {
    const base = new Date("2026-09-27T10:00:00");
    const original = base.getTime();
    const venc = calcularVencimentoSla(base, "CRITICA");
    expect(venc.getTime() - base.getTime()).toBe(3_600_000);
    expect(base.getTime()).toBe(original);
  });

  it("slaVencido ignora resolvido/fechado e sem prazo", () => {
    const passado = new Date(Date.now() - 60_000);
    const futuro = new Date(Date.now() + 3_600_000);
    expect(slaVencido(null, "ABERTO")).toBe(false);
    expect(slaVencido(passado, "RESOLVIDO")).toBe(false);
    expect(slaVencido(passado, "FECHADO")).toBe(false);
    expect(slaVencido(passado, "ABERTO")).toBe(true);
    expect(slaVencido(futuro, "ABERTO")).toBe(false);
  });

  it("MRR normaliza anual para mês", () => {
    expect(
      calcularMRR([
        { billingCycle: "MENSAL", monthlyPrice: 10000 },
        { billingCycle: "ANUAL", monthlyPrice: 120000 },
      ])
    ).toBe(20000);
    expect(calcularMRR([])).toBe(0);
  });

  it("transição de ticket respeita máquina de estados", () => {
    expect(transicaoTicketValida("ABERTO", "EM_ANALISE")).toBe(true);
    expect(transicaoTicketValida("ABERTO", "RESOLVIDO")).toBe(false);
    expect(transicaoTicketValida("FECHADO", "ABERTO")).toBe(true);
    expect(transicaoTicketValida("FECHADO", "RESOLVIDO")).toBe(false);
  });

  it("assinatura arquivada é terminal", () => {
    expect(podeTransicionarAssinatura("ARQUIVADA", "ATIVA")).toBe(false);
    expect(podeTransicionarAssinatura("CANCELADA", "ARQUIVADA")).toBe(true);
    expect(podeTransicionarAssinatura("ATIVA", "CANCELADA")).toBe(true);
  });
});
