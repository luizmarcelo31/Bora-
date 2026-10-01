"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency } from "@/lib/validators";
import { Package, Plus, Minus } from "lucide-react";
import Link from "next/link";

export type GridProduct = {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string | null;
  imageUrl?: string | null;
  wholesalePrice?: number | null;
  wholesaleMinQuantity?: number | null;
};

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
    return (
      <EmptyState
        title="Nenhum produto"
        description="Nenhum produto ativo. Cadastre em Produtos."
        icon={Package}
        action={
          <Button asChild size="sm">
            <Link href="/dashboard/produtos">Cadastrar produto</Link>
          </Button>
        }
      />
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {products.map((p) => {
        const qty = cart[p.id] ?? 0;
        const low = p.stock <= 5 && p.stock > 0;
        const out = p.stock <= 0;
        const hasWholesale = p.wholesalePrice != null && p.wholesaleMinQuantity != null;
        const isWholesaleActive = hasWholesale && qty >= p.wholesaleMinQuantity!;
        return (
          <Card key={p.id} className="overflow-hidden">
            <CardContent className="p-3 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- thumb remoto do Storage, sem remotePatterns
                  <img
                    src={p.imageUrl}
                    alt={`Foto de ${p.name}`}
                    className="size-9 shrink-0 rounded-lg border object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-lg border bg-muted text-muted-foreground shrink-0">
                    <Package className="size-4" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate">{p.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.category ? <Badge variant="outline" className="text-[10px] px-1.5 py-0">{p.category}</Badge> : null}
                    {out ? <Badge variant="destructive" className="text-[10px]">Sem estoque</Badge> : low ? <Badge variant="secondary" className="text-[10px]">Baixo</Badge> : null}
                    {hasWholesale && !isWholesaleActive ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-[var(--status-brand)] border-[var(--status-brand)]/30">
                        Atacado ≥{p.wholesaleMinQuantity} un
                      </Badge>
                    ) : null}
                    {isWholesaleActive ? (
                      <Badge className="text-[10px] px-1.5 py-0 bg-[var(--status-brand)]">ATACADO ATIVO</Badge>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  {isWholesaleActive ? (
                    <>
                      <span className="text-xs text-muted-foreground line-through tabular-nums">{formatCurrency(p.price)}</span>
                      <span className="font-semibold text-sm tabular-nums text-[var(--status-brand)]">{formatCurrency(p.wholesalePrice!)}</span>
                    </>
                  ) : (
                    <span className="font-semibold text-sm tabular-nums">{formatCurrency(p.price)}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">est. {p.stock}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" type="button" className="hit-area-44" disabled={out && qty === 0} onClick={() => onQty(p.id, qty + 1)}>
                  <Plus className="size-3" /> Adicionar
                </Button>
                {qty > 0 ? (
                  <>
                    <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
                    <Button variant="outline" size="sm" type="button" className="hit-area-44" aria-label={`Remover um ${p.name}`} onClick={() => onQty(p.id, qty - 1)}>
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

