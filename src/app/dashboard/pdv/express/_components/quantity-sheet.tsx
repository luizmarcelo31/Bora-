"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AppSheet } from "@/components/ui/app-sheet";
import { NumericKeypad } from "./numeric-keypad";

/**
 * Teclado de quantidade com atalhos de fardo/caixa (spec E3).
 */
const PRESETS = [2, 3, 6, 12, 24];

export function QuantitySheet({
  open,
  onOpenChange,
  productName,
  initialQty,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  productName: string;
  initialQty: number;
  onConfirm: (qty: number) => void;
}) {
  const [buffer, setBuffer] = useState("");
  const shown = buffer === "" ? initialQty : parseInt(buffer, 10) || 0;

  function digit(d: string) {
    setBuffer((b) => (b + d).slice(-3));
  }
  function backspace() {
    setBuffer((b) => b.slice(0, -1));
  }

  return (
    <AppSheet
      open={open}
      onOpenChange={(o) => {
        if (o) setBuffer("");
        onOpenChange(o);
      }}
      title={`Quantidade — ${productName}`}
      description="Toque num atalho ou digite."
      footer={
        <Button
          type="button"
          className="h-12 w-full text-base font-semibold"
          disabled={shown <= 0 || shown > 999}
          onClick={() => {
            onConfirm(shown);
            onOpenChange(false);
          }}
        >
          Confirmar {shown > 0 ? `${shown} un.` : ""}
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Atalhos de quantidade">
          {PRESETS.map((n) => (
            <Button
              key={n}
              type="button"
              variant={shown === n ? "default" : "outline"}
              aria-pressed={shown === n}
              onClick={() => {
                onConfirm(n);
                onOpenChange(false);
              }}
            >
              {n}
            </Button>
          ))}
        </div>
        <p aria-live="polite" className="text-center text-3xl font-bold tabular-nums">
          {shown}
        </p>
        <NumericKeypad onDigit={digit} onBackspace={backspace} onClear={() => setBuffer("")} />
      </div>
    </AppSheet>
  );
}
