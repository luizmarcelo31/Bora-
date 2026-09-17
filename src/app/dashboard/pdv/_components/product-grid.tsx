"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/validators";
import { Package, Plus, Minus } from "lucide-react";

export type GridProduct = { id: number; name: string; price: number; stock: number; category: string | null };

export function ProductGrid({
  products,
  cart,
  onQty,
}: {
  products: GridProduct[];
  cart: Record<number, number>;
  onQty: (id: number, qty: number) => void;
}) {
  if (products.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum produto ativo. Cadastre em Produtos.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {products.map((p) => {
        const qty = cart[p.id] ?? 0;
        const low = p.stock <= 5 && p.stock > 0;
        const out = p.stock <= 0;
        return (
          <Card key={p.id} className="overflow-hidden">
            <CardContent className="p-3 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg border bg-muted text-muted-foreground shrink-0">
                  <Package className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-tight truncate">{p.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.category ? <Badge variant="outline" className="text-[10px] px-1.5 py-0">{p.category}</Badge> : null}
                    {out ? <Badge variant="destructive" className="text-[10px]">Sem estoque</Badge> : low ? <Badge variant="secondary" className="text-[10px]">Baixo</Badge> : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm tabular-nums">{formatCurrency(p.price)}</span>
                <span className="text-xs text-muted-foreground">est. {p.stock}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" type="button" disabled={out && qty === 0} onClick={() => onQty(p.id, qty + 1)}>
                  <Plus className="size-3" /> Adicionar
                </Button>
                {qty > 0 ? (
                  <>
                    <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
                    <Button variant="outline" size="sm" type="button" onClick={() => onQty(p.id, qty - 1)}>
                      <Minus className="size-3" />
                    </Button>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
