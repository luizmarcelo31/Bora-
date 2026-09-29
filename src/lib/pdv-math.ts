/**
 * Matemática pura do PDV (centavos inteiros, sem React).
 * Espelha as regras do servidor (`SaleService.createSale`):
 * taxa só em venda única no cartão, sobre o TOTAL (sem circularidade).
 */

export type CardMethod = "CREDITO" | "DEBITO";

export function calcTotals(args: {
  subtotal: number;
  discount: number;
  method: string;
  single: boolean;
  feeCredit: number;
  feeDebit: number;
}): { total: number; fee: number; customerTotal: number } {
  const total = Math.max(0, args.subtotal - args.discount);
  const card: CardMethod | null =
    args.single && (args.method === "CREDITO" || args.method === "DEBITO")
      ? args.method
      : null;
  const rate = card === "CREDITO" ? args.feeCredit : card === "DEBITO" ? args.feeDebit : 0;
  const fee = Math.round((total * rate) / 100);
  return { total, fee, customerTotal: total + fee };
}

export function calcChange(args: { received: number; due: number }): {
  change: number;
  missing: number;
} {
  return { change: args.received - args.due, missing: Math.max(0, args.due - args.received) };
}

export function calcSplit(args: { total: number; cash: number }): {
  cash: number;
  pix: number;
  balanced: boolean;
} {
  const pix = args.total - args.cash;
  return { cash: args.cash, pix, balanced: args.cash > 0 && pix >= 0 && args.cash + pix === args.total };
}

const BILLS = [200, 500, 1000, 2000, 5000, 10000, 20000];

export function suggestBills(totalCents: number): number[] {
  const out = [totalCents];
  const reais = totalCents / 100;
  if (reais <= 200) {
    for (const b of BILLS) {
      if (b > totalCents && out.length < 4) out.push(b);
    }
    return out;
  }
  const m50 = (Math.floor(reais / 50) + 1) * 50 * 100;
  const m100 = (Math.floor(reais / 100) + 1) * 100 * 100;
  out.push(m50);
  if (m100 !== m50) out.push(m100);
  return out;
}
