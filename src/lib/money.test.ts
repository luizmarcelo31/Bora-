import { describe, expect, it } from "vitest";
import { parseBRLToCents } from "./money";

describe("parseBRLToCents", () => {
  it("converte formatos BR (vírgula decimal)", () => {
    expect(parseBRLToCents("12,99")).toBe(1299);
    expect(parseBRLToCents("1.000,50")).toBe(100050);
    expect(parseBRLToCents("12")).toBe(1200);
    expect(parseBRLToCents("0,00")).toBe(0);
  });

  it("ponto é separador de milhar, nunca decimal", () => {
    expect(parseBRLToCents("12.99")).toBe(129900);
  });

  it("retorna undefined para inválidos", () => {
    expect(parseBRLToCents(null)).toBeUndefined();
    expect(parseBRLToCents("")).toBeUndefined();
    expect(parseBRLToCents("   ")).toBeUndefined();
    expect(parseBRLToCents("abc")).toBeUndefined();
    expect(parseBRLToCents("-5,00")).toBeUndefined();
  });
});
