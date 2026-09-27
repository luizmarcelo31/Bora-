import type { FormaPagamento } from "@prisma/client";
import { LABELS } from "@/lib/labels";

/** Formas de pagamento oferecidos no PDV (as demais seguem validas no historico). */
export const PAYMENT_OPTIONS: { value: FormaPagamento; label: string }[] = [
  { value: "DINHEIRO", label: LABELS.formaPagamento.DINHEIRO },
  { value: "PIX", label: LABELS.formaPagamento.PIX },
  { value: "CREDITO", label: LABELS.formaPagamento.CREDITO },
  { value: "DEBITO", label: LABELS.formaPagamento.DEBITO },
];

/** Rotulos PT-BR para exibicao. */
export const PAYMENT_LABELS: Record<FormaPagamento, string> = LABELS.formaPagamento;

export function paymentLabel(forma: string): string {
  return (PAYMENT_LABELS as Record<string, string>)[forma] ?? forma;
}
