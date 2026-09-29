"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/validators";
import { PressProductButton } from "./press-product-button";
import { cn } from "@/lib/utils";
import type { ExpressProduct } from "../_lib/use-express-sale";

/**
 * Chips de categoria + grade de produtos (spec E2 §4.3).
 * Reconhecer por foto+preço, não ler linha de texto.
 */
export function ProductTiles({
  products,
  categories,
  activeCategory,
  onCategory,
  cartQty,
  onAdd,
}: {
  products: ExpressProduct[];
  categories: string[];
  activeCategory: string;
  onCategory: (c: string) => void;
  cartQty: (id: number) => number;
  onAdd: (id: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Categorias">
        {["★", ...categories].map((c) => (
          <Button
            key={c}
            type="button"
            variant={activeCategory === c ? "default" : "outline"}
            size="sm"
            aria-pressed={activeCategory === c}
            className="shrink-0 hit-area-44"
            onClick={() => onCategory(c)}
          >
            {c === "★" ? "★ Mais vendidos" : c}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2" role="list" aria-label="Produtos">
        {products.slice(0, 60).map((p) => {
          const qty = cartQty(p.id);
          const out = p.stock <= 0;
          return (
            <PressProductButton
              key={p.id}
              id={p.id}
              disabled={out}
              label={`${p.name}, ${formatCurrency(p.price)}${qty ? `, ${qty} no carrinho` : ""}${out ? ", sem estoque" : ""}`}
              className={cn(
                "relative flex min-h-26 flex-col items-center gap-1 rounded-xl border p-2 text-center select-none disabled:opacity-60",
                qty > 0 && "border-primary ring-1 ring-primary"
              )}
              onAdd={onAdd}
            >
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura remota do Storage
                <img
                  src={p.imageUrl}
                  alt=""
                  loading="lazy"
                  className="size-12 rounded-lg border object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-12 items-center justify-center rounded-lg bg-muted text-lg font-bold text-muted-foreground"
                >
                  {p.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="line-clamp-2 w-full text-xs leading-tight font-semibold">{p.name}</span>
              <span className="text-xs font-bold tabular-nums text-primary">{formatCurrency(p.price)}</span>
              {qty > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground tabular-nums"
                >
                  {qty}
                </span>
              ) : null}
              {out ? <span className="text-[11px] text-muted-foreground">Sem estoque</span> : null}
            </PressProductButton>
          );
        })}
      </div>
    </div>
  );
}
