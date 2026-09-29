import { describe, expect, test } from "vitest";
import { calcChange, calcSplit, calcTotals, suggestBills } from "./pdv-math";

describe("pdv-math", () => {
  test("dinheiro com troco", () => {
    expect(calcChange({ received: 5000, due: 4297 })).toEqual({ change: 703, missing: 0 });
  });
  test("dinheiro exato", () => {
    expect(calcChange({ received: 4297, due: 4297 })).toEqual({ change: 0, missing: 0 });
  });
  test("dinheiro insuficiente", () => {
    expect(calcChange({ received: 4000, due: 4297 })).toEqual({ change: -297, missing: 297 });
  });
  test("crédito com taxa 2.5", () => {
    expect(
      calcTotals({ subtotal: 4297, discount: 0, method: "CREDITO", single: true, feeCredit: 2.5, feeDebit: 0 })
    ).toEqual({ total: 4297, fee: 107, customerTotal: 4404 });
  });
  test("débito sem taxa", () => {
    expect(
      calcTotals({ subtotal: 4297, discount: 0, method: "DEBITO", single: true, feeCredit: 2.5, feeDebit: 0 })
    ).toEqual({ total: 4297, fee: 0, customerTotal: 4297 });
  });
  test("split dinheiro+pix sem taxa", () => {
    expect(calcSplit({ total: 4297, cash: 2000 })).toEqual({ cash: 2000, pix: 2297, balanced: true });
    const t = calcTotals({ subtotal: 4297, discount: 0, method: "DINHEIRO", single: false, feeCredit: 2.5, feeDebit: 1 });
    expect(t.fee).toBe(0);
  });
  test("desconto maior que subtotal zera", () => {
    expect(
      calcTotals({ subtotal: 5000, discount: 500, method: "DINHEIRO", single: true, feeCredit: 0, feeDebit: 0 })
    ).toEqual({ total: 4500, fee: 0, customerTotal: 4500 });
    expect(
      calcTotals({ subtotal: 5000, discount: 9000, method: "DINHEIRO", single: true, feeCredit: 0, feeDebit: 0 }).total
    ).toBe(0);
  });
  test("cédulas pequeno", () => {
    expect(suggestBills(4297)).toEqual([4297, 5000, 10000, 20000]);
  });
  test("cédulas nota exata", () => {
    expect(suggestBills(5000)).toEqual([5000, 10000, 20000]);
  });
  test("cédulas grande", () => {
    expect(suggestBills(32000)).toEqual([32000, 35000, 40000]);
  });
});
