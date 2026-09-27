"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PAYMENT_OPTIONS } from "@/lib/payments";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/validators";
import { createSaleAction } from "./actions";
import { ProductGrid } from "./_components/product-grid";
import { CartSheet } from "./_components/cart-sheet";
import { ControlledSelect } from "@/components/ui/controlled-select";
import { Item, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Package } from "lucide-react";

export type PdvProduct = { id: number; name: string; price: number; stock: number; category?: string | null; wholesalePrice?: number | null; wholesaleMinQuantity?: number | null };
export type PdvCashbox = { id: number; name: string };

const PAYMENTS = PAYMENT_OPTIONS;
const DISCOUNT_PASSWORD = "BoraMais2026"; // Fase 3 — senha de autorização de desconto

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
  user,
}: {
  products: PdvProduct[];
  cashboxes: PdvCashbox[];
  user: { id: number; name: string; email: string };
}) {
  const [cart, setCart] = useState<Record<number, number>>({});
  const [payment, setPayment] = useState("CASH");
  const [cashBoxId, setCashBoxId] = useState("");
  const [discount, setDiscount] = useState("");
  const [customer, setCustomer] = useState("");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [discountPending, setDiscountPending] = useState(false);
  const [discountPassword, setDiscountPassword] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState("");
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

  // Fase 3 — Favoritos: top 6 produtos mais caros como quick-add
  const favorites = useMemo(
    () => [...products].sort((a, b) => b.price - a.price).slice(0, 6),
    [products]
  );

  function addToCart(id: number) {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  }

  async function applyDiscount() {
    if (discountPending) {
      if (discountPassword === DISCOUNT_PASSWORD) {
        setDiscountPending(false);
        setDiscountPassword("");
        setDiscountError("");
        toast.success("Desconto autorizado.");
      } else {
        setDiscountError("Senha incorreta.");
        toast.error("Senha inválida.");
      }
      return;
    }
    const discountValue = parseFloat(discount.replace(/\./g, "").replace(",", ".").trim());
    if (discountValue > 0) {
      setDiscountPending(true);
      setDiscountPassword("");
      setDiscountError("");
    }
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
    <>
      {/* Operador — PIN para troca */}
      <div className="flex items-center justify-between bg-card rounded-lg px-4 py-2 border">
        <span className="text-sm font-medium">👤 {user.name}</span>
        <Button variant="ghost" size="sm" onClick={() => setPinOpen(true)}>
          🔒 Trocar operador
        </Button>
      </div>
      {pinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setPinOpen(false); setPinValue(""); setPinError(""); }}>
          <div className="bg-card rounded-lg p-6 w-80 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <CardTitle className="text-lg mb-4">Trocar operador</CardTitle>
            <Input
              type="password"
              placeholder="PIN do operador"
              value={pinValue}
              onChange={(e) => { setPinValue(e.target.value); setPinError(""); }}
              className="mb-3"
              onKeyDown={(e) => {
                if (e.key === "Enter" && pinValue === "1234") {
                  setPinOpen(false);
                  setPinValue("");
                  toast.success("Operador trocado com sucesso.");
                } else if (e.key === "Enter") {
                  setPinError("PIN inválido.");
                }
              }}
            />
            {pinError && <span className="text-xs text-destructive">{pinError}</span>}
            <p className="text-xs text-muted-foreground mt-2">PIN: 1234 (demo)</p>
          </div>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Catálogo</CardTitle>
          {/* Fase 3 — Favoritos */}
          <div className="flex flex-wrap gap-2 mt-2">
            {favorites.map((p) => (
              <Button
                key={p.id}
                variant="outline"
                size="sm"
                className="text-xs gap-1"
                onClick={() => addToCart(p.id)}
                disabled={p.stock <= 0}
              >
                <Package className="size-3" /> {p.name} — {formatCurrency(p.price)}
              </Button>
            ))}
          </div>
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
                <div className="flex gap-1">
                  <Input value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0,00" disabled={discountPending} />
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={applyDiscount}
                    disabled={!discount || discountPending}
                    className="whitespace-nowrap"
                  >
                    {discountPending ? "🔒" : "🔑"}
                  </Button>
                </div>
              </label>
              {discountPending && (
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs text-muted-foreground">Senha do desconto</span>
                  <Input
                    type="password"
                    placeholder="Senha do desconto"
                    value={discountPassword}
                    onChange={(e) => setDiscountPassword(e.target.value)}
                    className="border-destructive/50 focus-visible:ring-destructive"
                  />
                  {discountError && <span className="text-xs text-destructive">{discountError}</span>}
                </label>
              )}
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
    </>
  );
}
