"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/validators";

export type StripLine = { id: number; name: string; qty: number; total: number };

/**
 * Último item tocado com stepper + faixa ver ticket (spec E3).
 */
export function LastItemStrip({
  line,
  itemCount,
  subtotal,
  onQty,
  onOpenTicket,
}: {
  line: StripLine | null;
  itemCount: number;
  subtotal: number;
  onQty: (id: number, qty: number) => void;
  onOpenTicket: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border bg-card p-2.5">
      {line ? (
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{line.name}</span>
          <div className="flex items-center gap-1" role="group" aria-label={`Quantidade de ${line.name}`}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hit-area-44 px-2"
              aria-label={`Diminuir ${line.name}`}
              onClick={() => onQty(line.id, line.qty - 1)}
            >
              <Minus className="size-4" />
            </Button>
            <span aria-live="polite" className="w-8 text-center text-base font-bold tabular-nums">
              {line.qty}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hit-area-44 px-2"
              aria-label={`Aumentar ${line.name}`}
              onClick={() => onQty(line.id, line.qty + 1)}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <span className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(line.total)}</span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Toque num produto para começar.</p>
      )}
      <button
        type="button"
        onClick={onOpenTicket}
        disabled={itemCount === 0}
        className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm font-semibold disabled:opacity-50"
      >
        <span>
          ▲ {itemCount} {itemCount === 1 ? "item" : "itens"} · ver ticket
        </span>
        <span className="tabular-nums">{formatCurrency(subtotal)}</span>
      </button>
    </div>
  );
}
