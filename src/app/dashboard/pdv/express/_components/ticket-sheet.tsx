"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus, X } from "lucide-react";
import { formatCurrency } from "@/lib/validators";
import { AppSheet } from "@/components/ui/app-sheet";

export type TicketLine = {
  id: number;
  name: string;
  qty: number;
  total: number;
  price: number;
  stock: number;
  imageUrl: string | null;
};

/**
 * Ticket completo em sheet (spec E3). Tocar no número abre o teclado de quantidade.
 */
export function TicketSheet({
  open,
  onOpenChange,
  lines,
  subtotal,
  onQty,
  onQtyTap,
  onRemove,
  onClear,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lines: TicketLine[];
  subtotal: number;
  onQty: (id: number, qty: number) => void;
  onQtyTap: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
  onClear: () => void;
}) {
  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Ticket"
      description={lines.length === 0 ? "Vazio." : `${lines.length} ${lines.length === 1 ? "item" : "itens"} · ${formatCurrency(subtotal)}`}
    >
      {lines.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum item na venda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lines.map((l) => (
            <li key={l.id} className="flex items-center gap-2 rounded-lg border p-2.5">
              {l.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura remota do Storage
                <img src={l.imageUrl} alt="" loading="lazy" className="size-10 shrink-0 rounded-lg border object-cover" />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-base font-bold text-muted-foreground"
                >
                  {l.name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{l.name}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{formatCurrency(l.total)}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`Quantidade de ${l.name}`}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="hit-area-44 px-2"
                  aria-label={`Diminuir ${l.name}`}
                  onClick={() => onQty(l.id, l.qty - 1)}
                >
                  <Minus className="size-4" />
                </Button>
                <button
                  type="button"
                  onClick={() => onQtyTap(l.id, l.qty)}
                  aria-label={`Editar quantidade de ${l.name}, atual ${l.qty}`}
                  className="w-10 rounded-md border py-1 text-center text-base font-bold tabular-nums"
                >
                  {l.qty}
                </button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="hit-area-44 px-2"
                  aria-label={`Aumentar ${l.name}`}
                  onClick={() => onQty(l.id, l.qty + 1)}
                >
                  <Plus className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="hit-area-44 px-2"
                  aria-label={`Remover ${l.name}`}
                  onClick={() => onRemove(l.id)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {lines.length > 0 ? (
        <Button type="button" variant="outline" className="mt-3 w-full" onClick={onClear}>
          Limpar venda
        </Button>
      ) : null}
    </AppSheet>
  );
}
