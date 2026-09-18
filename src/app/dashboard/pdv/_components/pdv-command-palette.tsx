"use client";

import * as React from "react";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { formatCurrency } from "@/lib/validators";

export type PaletteProduct = {
  id: number;
  name: string;
  price: number;
  stock: number;
  category?: string | null;
};

/**
 * Command palette (Ctrl/⌘+K) para busca rápida de produtos no PDV.
 * Selecionar um item adiciona +1 ao carrinho sem fechar a palette.
 */
export function PdvCommandPalette({
  products,
  cart,
  onQty,
}: {
  products: PaletteProduct[];
  cart: Record<number, number>;
  onQty: (id: number, qty: number) => void;
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate text-left">Buscar produto…</span>
        <span className="flex items-center gap-1">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>Buscar produto</DialogTitle>
            <DialogDescription>
              Digite para filtrar e pressione Enter para adicionar ao carrinho.
            </DialogDescription>
          </DialogHeader>
          <Command label="Buscar produto" className="flex flex-col">
            <Command.Input
              placeholder="Nome ou categoria…"
              className="flex h-11 w-full border-b border-input bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Command.List className="max-h-72 overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                Nenhum produto encontrado.
              </Command.Empty>
              <Command.Group
                heading="Produtos"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {products.map((p) => {
                  const qty = cart[p.id] ?? 0;
                  const out = p.stock <= 0;
                  return (
                    <Command.Item
                      key={p.id}
                      value={`${p.name} ${p.category ?? ""} ${p.id}`}
                      disabled={out && qty === 0}
                      onSelect={() => onQty(p.id, qty + 1)}
                      className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">
                          {p.name}
                          {qty > 0 ? (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {qty} no carrinho
                            </span>
                          ) : null}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {p.category ?? "Sem categoria"} · est. {p.stock}
                          {out ? " · sem estoque" : ""}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {formatCurrency(p.price)}
                      </span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
