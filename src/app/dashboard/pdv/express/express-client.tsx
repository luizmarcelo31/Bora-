"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PAYMENT_OPTIONS } from "@/lib/payments";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/validators";
import { createSaleAction } from "../actions";
import { calcChange, calcSplit, calcTotals } from "@/lib/pdv-math";
import { DISCOUNT_PASSWORD } from "../pdv-client";
import { NumericKeypad } from "./_components/numeric-keypad";
import { ControlledSelect } from "@/components/ui/controlled-select";
import { Minus, Plus, X } from "lucide-react";

export type ExpressProduct = { id: number; name: string; price: number; stock: number; barcode: string | null };
export type ExpressCashbox = { id: number; name: string };

const SALE_ERROR_MSG: Record<string, string> = {
  invalid: "Venda inválida. Confira itens e pagamentos.",
  empty: "Adicione ao menos um item.",
  stock: "Estoque insuficiente para um ou mais itens.",
  discount: "Desconto acima do permitido ou maior que o subtotal.",
  amount: "Valores não conferem: soma dos pagamentos ou recebido divergem do total.",
  cashbox: "Caixa selecionado está fechado ou inexistente.",
  sale: "Não foi possível concluir a venda. Tente novamente.",
};

function parseBRLCents(raw: string): number {
  const n = raw.replace(/\./g, "").replace(",", ".").trim();
  if (!n) return 0;
  const v = Number(n);
  return Number.isFinite(v) && v >= 0 ? Math.round(v * 100) : 0;
}

export function ExpressPdvClient({
  products,
  cashboxes,
  feeCredit,
  feeDebit,
  topSellerIds,
}: {
  products: ExpressProduct[];
  cashboxes: ExpressCashbox[];
  feeCredit: number;
  feeDebit: number;
  topSellerIds: number[];
}) {
  const [cart, setCart] = useState<Record<number, number>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [keypadMode, setKeypadMode] = useState<"qty" | "received">("qty");
  const [qtyBuffer, setQtyBuffer] = useState("");
  const [received, setReceived] = useState("");
  const [search, setSearch] = useState("");
  const [payMode, setPayMode] = useState<"single" | "split">("single");
  const [payment, setPayment] = useState("DINHEIRO");
  const [cashAmount, setCashAmount] = useState("");
  const [cashBoxId, setCashBoxId] = useState(cashboxes[0] ? String(cashboxes[0].id) : "");
  const [discount, setDiscount] = useState("");
  const [discountPending, setDiscountPending] = useState(false);
  const [discountPassword, setDiscountPassword] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
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
  const discountCents = parseBRLCents(discount);
  const feeRate = payment === "CREDITO" ? feeCredit : payment === "DEBITO" ? feeDebit : 0;
  const { total, fee: feePreview, customerTotal } = calcTotals({
    subtotal,
    discount: discountCents,
    method: payment,
    single: payMode === "single",
    feeCredit,
    feeDebit,
  });
  const receivedCents = parseBRLCents(received);
  const cashCents = parseBRLCents(cashAmount);
  const pixCents = Math.max(0, calcSplit({ total, cash: cashCents }).pix);
  const trocoBase = payMode === "single" ? customerTotal : cashCents;
  const { change: troco, missing: falta } = calcChange({ received: receivedCents, due: trocoBase });

  function selectLine(id: number) {
    setSelectedId(id);
    setQtyBuffer(String(cart[id] ?? 1));
    setKeypadMode("qty");
  }

  function addToCart(id: number) {
    const q = (cart[id] ?? 0) + 1;
    setCart((c) => ({ ...c, [id]: q }));
    setSelectedId(id);
    setQtyBuffer(String(q));
  }

  function commitQty(id: number, q: number) {
    if (q <= 0 || q > 999) {
      if (q <= 0) {
        setCart((c) => {
          const next = { ...c };
          delete next[id];
          return next;
        });
        if (selectedId === id) {
          setSelectedId(null);
          setQtyBuffer("");
        }
      }
      return;
    }
    setCart((c) => ({ ...c, [id]: q }));
    setQtyBuffer(String(q));
  }

  function onDigit(d: string) {
    if (keypadMode === "received") {
      setReceived((r) => {
        const cents = parseBRLCents(r) * 100 + parseInt(d, 10);
        return (cents / 100).toFixed(2).replace(".", ",");
      });
      return;
    }
    if (selectedId === null) return;
    const nb = (qtyBuffer + d).slice(-3);
    const q = parseInt(nb, 10);
    if (Number.isFinite(q)) {
      if (q === 0) commitQty(selectedId, 0);
      else {
        setCart((c) => ({ ...c, [selectedId]: q }));
        setQtyBuffer(String(q));
      }
    }
  }

  function onBackspace() {
    if (keypadMode === "received") {
      setReceived((r) => {
        const cents = Math.floor(parseBRLCents(r) / 10);
        return cents === 0 ? "" : (cents / 100).toFixed(2).replace(".", ",");
      });
      return;
    }
    if (selectedId === null) return;
    const nb = qtyBuffer.slice(0, -1);
    if (nb === "") {
      setCart((c) => ({ ...c, [selectedId]: 1 }));
      setQtyBuffer("1");
    } else {
      setCart((c) => ({ ...c, [selectedId]: parseInt(nb, 10) }));
      setQtyBuffer(nb);
    }
  }

  function onClear() {
    if (keypadMode === "received") setReceived("");
    else setQtyBuffer("");
  }

  function applyDiscount() {
    setDiscountError("");
    if (discountPending) {
      if (discountPassword === DISCOUNT_PASSWORD) {
        setDiscountPending(false);
        setDiscountPassword("");
        toast.success("Desconto autorizado.");
      } else {
        setDiscountError("Senha incorreta.");
        toast.error("Senha inválida.");
      }
      return;
    }
    if (parseBRLCents(discount) > 0) {
      setDiscountPending(true);
      setDiscountPassword("");
    }
  }

  function clearSale() {
    setCart({});
    setSelectedId(null);
    setQtyBuffer("");
    setReceived("");
    setCashAmount("");
    setDiscount("");
    setDiscountPending(false);
    setDiscountPassword("");
    setDiscountError("");
    idemRef.current = null;
  }

  const canConfirmSingle =
    lines.length > 0 &&
    (payment !== "DINHEIRO" || receivedCents >= customerTotal) &&
    !discountPending;
  const canConfirmSplit =
    lines.length > 0 && cashCents > 0 && pixCents >= 0 && cashCents + pixCents === total && receivedCents >= cashCents && !discountPending;

  async function confirmSale() {
    if (pending || lines.length === 0) return;
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("items", JSON.stringify(lines.map((l) => ({ productId: l.id, quantity: l.qty }))));
      if (payMode === "split") {
        fd.set("paymentMethod", cashCents >= pixCents ? "DINHEIRO" : "PIX");
        fd.set("payments", JSON.stringify([
          { method: "DINHEIRO", amount: cashCents },
          { method: "PIX", amount: pixCents },
        ]));
      } else {
        fd.set("paymentMethod", payment);
      }
      fd.set("cashBoxId", cashBoxId);
      fd.set("discount", discount);
      if (receivedCents > 0) fd.set("received", received);
      fd.set("customerName", "");
      fd.set("idempotencyKey", getIdemKey());
      const res = await createSaleAction(fd);
      if ("ok" in res) {
        toast.success(`Venda #${res.ok} registrada. Troco ${formatCurrency(Math.max(0, troco))}.`, {
          action: {
            label: "Recibo",
            onClick: () => router.push(`/dashboard/pdv/recibo/${res.ok}`),
          },
        });
        clearSale();
      } else {
        toast.error(SALE_ERROR_MSG[res.error] ?? SALE_ERROR_MSG.sale);
      }
    } finally {
      setPending(false);
    }
  }

  const filtered = products.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || (p.barcode ?? "").includes(q);
  });
  const topSellers = useMemo(
    () =>
      topSellerIds
        .flatMap((id) => {
          const p = products.find((x) => x.id === id);
          return p !== undefined && p.stock > 0 ? [p] : [];
        })
        .slice(0, 4),
    [topSellerIds, products]
  );

  function submitSearch() {
    const q = search.trim();
    if (!q) return;
    const exact = products.find((p) => p.barcode === q);
    if (exact && exact.stock > 0) {
      addToCart(exact.id);
      setSearch("");
      toast.success(`${exact.name} adicionado.`);
    }
  }

  const QUICK_BILLS = [1000, 2000, 5000, 10000, 20000];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Catálogo + busca */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar nome ou código de barras..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch();
              }}
              aria-label="Buscar produto"
            />
            <Button type="button" variant="outline" onClick={submitSearch} aria-label="Adicionar por código">
              +
            </Button>
          </div>
          {topSellers.length > 0 && search.trim() === "" && (
            <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Mais vendidos">
              {topSellers.map((p) => (
                <Button
                  key={p.id}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="shrink-0 hit-area-44"
                  disabled={p.stock <= 0}
                  onClick={() => addToCart(p.id)}
                >
                  ★ {p.name}
                </Button>
              ))}
            </div>
          )}
          <ul className="flex max-h-60 flex-col gap-1.5 overflow-y-auto">
            {filtered.slice(0, 50).map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => addToCart(p.id)}
                  disabled={p.stock <= 0}
                  className="flex w-full items-center gap-3 rounded-lg border p-2.5 text-left disabled:opacity-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.name}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatCurrency(p.price)} · est. {p.stock}
                    </span>
                  </span>
                  <Plus className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
          {/* Ticket */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Ticket ({lines.reduce((n, l) => n + l.qty, 0)})</span>
            {lines.length > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={clearSale} className="hit-area-44">
                Limpar
              </Button>
            )}
          </div>
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">Toque num produto para adicionar.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {lines.map((l) => (
                <li
                  key={l.id}
                  aria-current={selectedId === l.id ? "true" : undefined}
                  className={`flex items-center gap-1 rounded-lg border p-2 ${selectedId === l.id ? "border-primary ring-1 ring-primary" : ""}`}
                >
                  <button type="button" onClick={() => selectLine(l.id)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-semibold">
                      {l.qty}× {l.name}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">{formatCurrency(l.total)}</span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="hit-area-44 px-2"
                    onClick={() => {
                      const q = l.qty - 1;
                      if (q <= 0) commitQty(l.id, 0);
                      else {
                        setCart((c) => ({ ...c, [l.id]: q }));
                        if (selectedId === l.id) setQtyBuffer(String(q));
                      }
                    }}
                    aria-label={`Diminuir ${l.name}`}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="hit-area-44 px-2"
                    onClick={() => addToCart(l.id)}
                    aria-label={`Aumentar ${l.name}`}
                  >
                    <Plus className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="hit-area-44 px-2"
                    onClick={() => commitQty(l.id, 0)}
                    aria-label={`Remover ${l.name}`}
                  >
                    <X className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {/* Teclado */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={keypadMode === "qty" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              aria-pressed={keypadMode === "qty"}
              onClick={() => setKeypadMode("qty")}
            >
              QTD
            </Button>
            <Button
              type="button"
              variant={keypadMode === "received" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              aria-pressed={keypadMode === "received"}
              onClick={() => setKeypadMode("received")}
            >
              RECEBIDO
            </Button>
          </div>
          <NumericKeypad onDigit={onDigit} onBackspace={onBackspace} onClear={onClear} />
        </CardContent>
      </Card>

      {/* Pagamento */}
      <Card className="h-fit lg:sticky lg:top-4">
        <CardHeader>
          <CardTitle>Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex rounded-lg bg-muted p-1 text-sm font-semibold">
            <p className="tabular-nums">Subtotal {formatCurrency(subtotal)}</p>
            <p className="ml-auto tabular-nums text-lg">Total {formatCurrency(customerTotal)}</p>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            Caixa
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
          <div className="flex gap-2">
            <Button
              type="button"
              variant={payMode === "single" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              aria-pressed={payMode === "single"}
              onClick={() => setPayMode("single")}
            >
              Único
            </Button>
            <Button
              type="button"
              variant={payMode === "split" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              aria-pressed={payMode === "split"}
              onClick={() => setPayMode("split")}
            >
              Dividido $
            </Button>
          </div>
          {payMode === "single" ? (
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.map((o) => (
                <Button
                  key={o.value}
                  type="button"
                  variant={payment === o.value ? "default" : "outline"}
                  className="min-h-11"
                  onClick={() => setPayment(o.value)}
                >
                  {o.label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => { setCashAmount((total / 100).toFixed(2).replace(".", ",")); }}>
                  Tudo dinheiro
                </Button>
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => { setCashAmount("0,00"); }}>
                  Tudo pix
                </Button>
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => { setCashAmount((Math.floor(total / 2) / 100).toFixed(2).replace(".", ",")); }}>
                  Meio a meio
                </Button>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                Dinheiro (R$)
                <Input
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </label>
              <p className="text-sm tabular-nums text-muted-foreground">
                Pix: {formatCurrency(pixCents)} {cashCents + pixCents !== total && total > 0 ? <span className="text-destructive">(soma ≠ total)</span> : null}
              </p>
            </div>
          )}
          {(payment === "CREDITO" || payment === "DEBITO") && payMode === "single" && feePreview > 0 && (
            <p className="text-sm tabular-nums text-muted-foreground">
              + Taxa maquineta ({feeRate}%) {formatCurrency(feePreview)}
            </p>
          )}
          <details className="rounded-lg border">
            <summary className="flex cursor-pointer list-none items-center justify-between p-2.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              Desconto{discountCents > 0 ? ` ${formatCurrency(discountCents)}` : ""}
              <span className="text-xs font-normal text-muted-foreground">+ Expandir</span>
            </summary>
            <div className="flex flex-col gap-2 px-2.5 pb-2.5">
          <label className="flex flex-col gap-1 text-sm">
            Valor (R$)
            <div className="flex gap-1">
              <Input value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0,00" disabled={discountPending} inputMode="decimal" />
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={applyDiscount}
                disabled={!discount || discountPending}
                className="whitespace-nowrap hit-area-44"
                aria-label={discountPending ? "Desconto aguardando senha" : "Autorizar desconto"}
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
                aria-label="Senha do desconto"
                value={discountPassword}
                onChange={(e) => setDiscountPassword(e.target.value)}
                className="border-destructive/50 focus-visible:ring-destructive"
              />
              {discountError && <span role="alert" className="text-xs text-destructive">{discountError}</span>}
            </label>
          )}
            </div>
          </details>
          {(payment === "DINHEIRO" && payMode === "single") || payMode === "split" ? (
            <>
              <label className="flex flex-col gap-1 text-sm">
                Recebido (R$)
                <Input
                  value={received}
                  onChange={(e) => setReceived(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                  aria-label="Valor recebido"
                />
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_BILLS.map((b) => (
                  <Button
                    key={b}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setReceived((b / 100).toFixed(2).replace(".", ","))}
                  >
                    {formatCurrency(b)}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReceived((trocoBase / 100).toFixed(2).replace(".", ","))}
                >
                  Exato
                </Button>
              </div>
              <p className={`text-lg font-semibold tabular-nums ${troco < 0 ? "text-destructive" : ""}`}>
                {troco < 0 ? `Falta ${formatCurrency(falta)}` : `Troco ${formatCurrency(troco)}`}
              </p>
            </>
          ) : null}
          <Button
            type="button"
            className="min-h-12 w-full text-base font-semibold"
            disabled={pending || !(payMode === "single" ? canConfirmSingle : canConfirmSplit)}
            onClick={confirmSale}
          >
            {pending ? "Processando..." : `CONFIRMAR ${formatCurrency(customerTotal)}`}
          </Button>
        </CardContent>
      </Card>
      {/* Sticky mobile: total + confirmar sempre visíveis */}
      {lines.length > 0 && (
        <div className="fixed inset-x-0 bottom-20 z-40 border-t bg-background/95 px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur md:bottom-0 lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <span className="text-lg font-semibold tabular-nums">{formatCurrency(customerTotal)}</span>
            <Button
              type="button"
              className="ml-auto min-h-11 flex-1 font-semibold sm:flex-none"
              disabled={pending || !(payMode === "single" ? canConfirmSingle : canConfirmSplit)}
              onClick={confirmSale}
            >
              {pending ? "Processando..." : "CONFIRMAR"}
            </Button>
          </div>
        </div>
      )}
      {lines.length > 0 && <div aria-hidden="true" className="h-36 md:h-20 lg:hidden" />}
    </div>
  );
}
