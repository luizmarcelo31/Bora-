"use client";

import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";

/**
 * Teclado numérico do PDV Expresso. Teclas 56px+ (min-h-14),
 * alcance do polegar na base da tela.
 */
export function NumericKeypad({
  onDigit,
  onBackspace,
  onClear,
}: {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onClear: () => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 touch-manipulation" role="group" aria-label="Teclado numérico">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
        <Button
          key={d}
          type="button"
          variant="outline"
          className="min-h-14 text-lg font-semibold tabular-nums"
          onClick={() => onDigit(d)}
        >
          {d}
        </Button>
      ))}
      <Button
        type="button"
        variant="outline"
        className="min-h-14 text-lg font-semibold"
        onClick={onClear}
        aria-label="Limpar"
      >
        C
      </Button>
      <Button
        type="button"
        variant="outline"
        className="min-h-14 text-lg font-semibold tabular-nums"
        onClick={() => onDigit("0")}
      >
        0
      </Button>
      <Button
        type="button"
        variant="outline"
        className="min-h-14 text-lg font-semibold tabular-nums"
        onClick={onBackspace}
        aria-label="Apagar dígito"
      >
        <Delete className="size-5" />
      </Button>
    </div>
  );
}
