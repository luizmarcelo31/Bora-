"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/validators";
import { createSaleAction } from "./actions";

export type PdvProduct = { id: number; name: string; price: number; stock: number };
export type PdvCashbox = { id: number; name: string };

const PAYMENTS: { value: string; label: string }[] = [
  { value: "CASH", label: "Dinheiro" },
  { value: "PIX", label: "Pix" },
  { value: "CARD", label: "Cartão" },
  { value: "TRANSFER", label: "Transferência" },
  { value: "CHECK", label: "Cheque" },
  { value: "OTHER", label: "Outro" },
];

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

  async function submit(formData: FormData) {
    if (pending) return;
    setPending(true);
    try {
      formData.set("items", JSON.stringify(lines.map((l) => ({ productId: l.id, quantity: l.qty }))));
      formData.set("paymentMethod", payment);
      formData.set("cashBoxId", cashBoxId);
      formData.set("discount", discount);
      formData.set("customerName", customer);
      await createSaleAction(formData);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ul className="flex max-h-96 flex-col gap-2 overflow-auto">
            {filtered.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                <div className="flex-1">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(p.price)} · estoque {p.stock}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={p.stock <= 0}
                  onClick={() => setQty(p.id, (cart[p.id] ?? 0) + 1)}
                >
                  +
                </Button>
                {cart[p.id] ? (
                  <>
                    <span className="w-8 text-center">{cart[p.id]}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => setQty(p.id, cart[p.id] - 1)}
                    >
                      −
                    </Button>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Venda atual</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submit} className="flex flex-col gap-3">
            {lines.length === 0 ? (
              <p className="text-sm text-muted-foreground">Carrinho vazio.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {lines.map((l) => (
                  <li key={l.id} className="flex justify-between gap-2">
                    <span>
                      {l.qty}× {l.name}
                    </span>
                    <span>{formatCurrency(l.total)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-base font-semibold">Subtotal: {formatCurrency(subtotal)}</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Pagamento
                <select
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {PAYMENTS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Caixa (opcional)
                <select
                  value={cashBoxId}
                  onChange={(e) => setCashBoxId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Sem caixa</option>
                  {cashboxes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
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
            <Button type="submit" disabled={lines.length === 0 || pending}>
              {pending ? "Processando..." : "Finalizar venda"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
