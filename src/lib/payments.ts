import type { PaymentMethod } from "@prisma/client";

/** Métodos oferecidos no PDV (legados seguem válidos no histórico). */
export const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Dinheiro" },
  { value: "PIX", label: "Pix" },
  { value: "CREDIT", label: "Crédito" },
  { value: "DEBIT", label: "Débito" },
];

/** Rótulos PT-BR para exibição (inclui legados fora de linha). */
export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  CREDIT: "Crédito",
  DEBIT: "Débito",
  CARD: "Cartão",
  TRANSFER: "Transferência",
  CHECK: "Cheque",
  OTHER: "Outro",
};

export function paymentLabel(method: string): string {
  return (PAYMENT_LABELS as Record<string, string>)[method] ?? method;
}
