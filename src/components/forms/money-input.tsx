"use client";

import { Input } from "@/components/ui/input";

/**
 * Dinheiro: digita dígitos, exibe máscara R$, guarda centavos.
 * "1299" → mostra "12,99" → onChange(1299).
 */
export function MoneyInput({
  value,
  onChange,
  ...props
}: {
  value: number;
  onChange: (cents: number) => void;
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type">) {
  function handle(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(-9);
    onChange(digits ? parseInt(digits, 10) : 0);
  }
  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      enterKeyHint="next"
      autoComplete="off"
      value={(value / 100).toFixed(2).replace(".", ",")}
      onChange={(e) => handle(e.target.value)}
    />
  );
}
