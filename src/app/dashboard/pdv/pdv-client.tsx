"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PAYMENT_OPTIONS } from "@/lib/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/validators";
import { createSaleAction } from "./actions";
import { ProductGrid } from "./_components/product-grid";
import { CartSheet } from "./_components/cart-sheet";
import { ControlledSelect } from "@/components/ui/controlled-select";
import { Item, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";

export type PdvProduct = { id: number; name: string; price: number; stock: number; category?: string | null; wholesalePrice?: number | null; wholesaleMinQuantity?: number | null };
export type PdvCashbox = { id: number; name: string };

const PAYMENTS = PAYMENT_OPTIONS;

const SALE_ERROR_MSG: Record<string, string> = {
  invalid: "Venda inválida. Confira os itens.",
  empty: "Adicione ao menos um item.",
  stock: "Estoque insuficiente para um ou mais itens.",
  discount: "Desconto acima do permitido ou maior que o subtotal.",
  cashbox: "Caixa selecionado está fechado ou inexistente.",
  sale: "Não foi possível concluir a venda. Tente novamente.",
};

export function PdvClient({
  products,
  cashboxes,
}: {
  products: PdvProduct[];
  cashboxes: PdvCashbox[];
}) {
  const [cart, setCart] = useState<Record<number, number>>({});
  const [payment, setPayment] = useState("CASH");
  const [cashBoxId, setCashBoxId] = useState("");
  const [discount, setDiscount] = useState("");
  const [customer, setCustomer] = useState("");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const idemRef = useRef<string | null>(null);
  function getIdemKey() {
    if (!idemRef.current) idemRef.current = crypto.randomUUID();
    return idemRef.current;
  }

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const p = products.find((x) => x.id === Number(id));
          if (!p || qty <= 0) return null;
          return { ...p, qty, total: p.price * qty };
        })
        .filter((x) => x !== null),
    [cart, products]
  );

  const subtotal = lines.reduce((s, l) => s + l.total, 0);

  function setQty(id: number, qty: number) {
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleSaleResult(res: { ok: number } | { error: string }) {
    if ("ok" in res) {
      toast.success(`Venda #${res.ok} registrada com sucesso.`);
      setCart({});
      setDiscount("");
      setCustomer("");
      setCartOpen(false);
      idemRef.current = null;
    } else {
      toast.error(SALE_ERROR_MSG[res.error] ?? SALE_ERROR_MSG.sale);
    }
  }

  async function submit(formData: FormData) {
    if (pending) return;
    setPending(true);
    try {
      formData.set("items", JSON.stringify(lines.map((l) => ({ productId: l.id, quantity: l.qty }))));
      formData.set("paymentMethod", payment);
      formData.set("cashBoxId", cashBoxId);
      formData.set("discount", discount);
      formData.set("customerName", customer);
      formData.set("idempotencyKey", getIdemKey());
      handleSaleResult(await createSaleAction(formData));
    } finally {
      setPending(false);
    }
  }

  async function confirmSale() {
    if (pending || lines.length === 0) return;
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("items", JSON.stringify(lines.map((l) => ({ productId: l.id, quantity: l.qty }))));
      fd.set("paymentMethod", payment);
      fd.set("cashBoxId", cashBoxId);
      fd.set("discount", discount);
      fd.set("customerName", customer);
      fd.set("idempotencyKey", getIdemKey());
      handleSaleResult(await createSaleAction(fd));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Catálogo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ProductGrid products={filtered.map((p) => ({ id: p.id, name: p.name, price: p.price, stock: p.stock, category: (p as unknown as { category?: string | null }).category ?? null, wholesalePrice: (p as unknown as { wholesalePrice?: number | null }).wholesalePrice ?? null, wholesaleMinQuantity: (p as unknown as { wholesaleMinQuantity?: number | null }).wholesaleMinQuantity ?? null }))} cart={cart} onQty={setQty} />
        </CardContent>
      </Card>

      <Card className="lg:sticky lg:top-4 h-fit">
        <CardHeader>
          <CardTitle>Venda atual</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submit} className="flex flex-col gap-3">
            {lines.length === 0 ? (
              <p className="text-sm text-muted-foreground">Carrinho vazio.</p>
            ) : (
              <ItemGroup className="gap-1.5">
                {lines.map((l) => (
                  <Item key={l.id} variant="outline" size="sm">
                    <ItemContent>
                      <ItemTitle>
                        {l.qty}× {l.name}
                      </ItemTitle>
                    </ItemContent>
                    <span className="text-sm tabular-nums">{formatCurrency(l.total)}</span>
                  </Item>
                ))}
              </ItemGroup>
            )}
            <p className="text-base font-semibold">Subtotal: {formatCurrency(subtotal)}</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Pagamento
                <ControlledSelect
                  value={payment}
                  onValueChange={setPayment}
                  options={PAYMENTS}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Caixa (opcional)
                <ControlledSelect
                  value={cashBoxId}
                  onValueChange={setCashBoxId}
                  placeholder="Sem caixa"
                  options={[
                    { value: "", label: "Sem caixa" },
                    ...cashboxes.map((c) => ({ value: String(c.id), label: c.name })),
                  ]}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Desconto (R$)
                <Input value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0,00" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Cliente (opcional)
                <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nome" />
              </label>
            </div>
            <CartSheet lines={lines.map((l) => ({ id: l.id, name: l.name, qty: l.qty, total: l.total }))} subtotal={subtotal} discountRaw={discount} pending={pending} onConfirm={confirmSale} open={cartOpen} onOpenChange={setCartOpen} />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
