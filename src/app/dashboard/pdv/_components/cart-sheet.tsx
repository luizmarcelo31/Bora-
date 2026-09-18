"use client";

import { Button } from "@/components/ui/button";
import { Drawer } from "vaul";
import { Separator } from "@/components/ui/separator";
import { Item, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
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
    <Drawer.Root direction="right">
      <Drawer.Trigger asChild>
        <Button type="button" disabled={lines.length === 0 || pending} className="w-full">
          <ShoppingCart className="size-4" /> Revisar e finalizar ({lines.length})
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col gap-4 bg-background p-6 shadow-lg">
          <div className="flex flex-col gap-1.5">
            <Drawer.Title className="font-medium leading-none">Confirmar venda</Drawer.Title>
            <Drawer.Description className="text-sm text-muted-foreground">Revise itens e total antes de confirmar. Preço é do cadastro, não do cliente.</Drawer.Description>
          </div>
          <div className="flex-1 overflow-auto py-2">
            {lines.length === 0 ? (
              <p className="text-sm text-muted-foreground">Carrinho vazio.</p>
            ) : (
              <ItemGroup className="gap-1.5">
                {lines.map((l) => (
                  <Item key={l.id} variant="outline" size="sm">
                    <ItemContent>
                      <ItemTitle>{l.qty}× {l.name}</ItemTitle>
                    </ItemContent>
                    <span className="text-sm tabular-nums">{formatCurrency(l.total)}</span>
                  </Item>
                ))}
              </ItemGroup>
            )}
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
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
