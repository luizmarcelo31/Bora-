"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/validators";
import { ShoppingCart } from "lucide-react";

export type CartLine = { id: number; name: string; qty: number; total: number };

export function CartSheet({
  lines,
  subtotal,
  discountRaw,
  pending,
  onConfirm,
}: {
  lines: CartLine[];
  subtotal: number;
  discountRaw: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  function parseDiscount(raw: string): number {
    const n = raw.replace(/\./g, "").replace(",", ".").trim();
    if (!n) return 0;
    const v = Number(n);
    return Number.isFinite(v) && v >= 0 ? Math.round(v * 100) : 0;
  }
  const discountCents = parseDiscount(discountRaw);
  const total = Math.max(0, subtotal - discountCents);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" disabled={lines.length === 0 || pending} className="w-full">
          <ShoppingCart className="size-4" /> Revisar e finalizar ({lines.length})
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Confirmar venda</SheetTitle>
          <SheetDescription>Revise itens e total antes de confirmar. Preço é do cadastro, não do cliente.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-auto py-4 flex flex-col gap-2">
          {lines.map((l) => (
            <div key={l.id} className="flex justify-between text-sm">
              <span>{l.qty}× {l.name}</span>
              <span className="tabular-nums">{formatCurrency(l.total)}</span>
            </div>
          ))}
          {lines.length === 0 ? <p className="text-sm text-muted-foreground">Carrinho vazio.</p> : null}
        </div>
        <Separator />
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between"><span>Desconto</span><span className="tabular-nums">- {formatCurrency(discountCents)}</span></div>
          <div className="flex justify-between font-medium text-base"><span>Total</span><span className="tabular-nums">{formatCurrency(total)}</span></div>
        </div>
        <Button type="button" onClick={onConfirm} disabled={pending || lines.length === 0}>
          {pending ? "Processando..." : "Confirmar venda"}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
