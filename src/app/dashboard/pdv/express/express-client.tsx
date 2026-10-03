"use client";

import { useDeferredValue, useState } from "react";
import { toast } from "sonner";
import { PAYMENT_OPTIONS } from "@/lib/payments";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/validators";
import { NumericKeypad } from "./_components/numeric-keypad";
import { ScanBar } from "./_components/scan-bar";
import { ProductTiles } from "./_components/product-tiles";
import { LastItemStrip } from "./_components/last-item-strip";
import { TicketSheet } from "./_components/ticket-sheet";
import { QuantitySheet } from "./_components/quantity-sheet";
import { ExpressShell } from "./_components/express-shell";
import { ControlledSelect } from "@/components/ui/controlled-select";
import { Minus, Plus, X } from "lucide-react";
import { useExpressSale } from "./_lib/use-express-sale";
import type { ExpressProduct, ExpressCashbox } from "./_lib/use-express-sale";
import { useCatalogSnapshot } from "@/lib/offline/use-catalog-snapshot";
import { SyncIndicator } from "@/components/offline/SyncIndicator";

export type { ExpressProduct, ExpressCashbox };

export function ExpressPdvClient({
  products,
  cashboxes,
  feeCredit,
  feeDebit,
  topSellerIds,
  tenantId,
  userId,
}: {
  products: ExpressProduct[];
  cashboxes: ExpressCashbox[];
  feeCredit: number;
  feeDebit: number;
  topSellerIds: number[];
  tenantId: number;
  userId: number;
}) {
  // Snapshot do catálogo para o modo offline (Fase 3.1). Esta tela é onde o
  // operador passa o expediente inteiro, então é o melhor momento para guardar
  // o catálogo com rede — e é o que permite vender sem conexão depois.
  useCatalogSnapshot(tenantId, products);
  const {
    cart,
    selectedId,
    keypadMode,
    setKeypadMode,
    received,
    setReceived,
    search,
    setSearch,
    payMode,
    setPayMode,
    payment,
    setPayment,
    cashAmount,
    setCashAmount,
    cashBoxId,
    setCashBoxId,
    discount,
    setDiscount,
    pending,
    lines,
    subtotal,
    discountCents,
    total,
    feeRate,
    feePreview,
    customerTotal,
    cashCents,
    pixCents,
    trocoBase,
    troco,
    falta,
    topSellers,
    canConfirmSingle,
    canConfirmSplit,
    selectLine,
    addToCart,
    commitQty,
    onDigit,
    onBackspace,
    onClear,
    clearSale,
    restoreCart,
    confirmSale,
    submitSearch,
  } = useExpressSale({ products, cashboxes, feeCredit, feeDebit, topSellerIds, tenantId, userId });



  const [scanWarning, setScanWarning] = useState<string | null>(null);
  const [scanFocus, setScanFocus] = useState(0);
  const [category, setCategory] = useState("★");
  const [ticketOpen, setTicketOpen] = useState(false);
  const [qtyFor, setQtyFor] = useState<{ id: number; name: string; qty: number } | null>(null);
  const deferredSearch = useDeferredValue(search);

  function handleSubmitSearch() {
    const r = submitSearch();
    if (r === "added") {
      setScanWarning(null);
      setScanFocus((k) => k + 1);
    } else if (r === "not-found") {
      setScanWarning(`Código ${search.trim()} não está cadastrado.`);
    } else if (r === "no-stock") {
      setScanWarning("Sem estoque para este código.");
    }
  }

  function handleRemove(id: number) {
    const l = lines.find((x) => x.id === id);
    if (!l) return;
    commitQty(id, 0);
    toast(`${l.name} removida.`, {
      action: {
        label: "Desfazer",
        onClick: () => {
          restoreCart({ [id]: l.qty });
        },
      },
    });
  }

  function handleAdd(id: number) {
    addToCart(id);
    setScanFocus((k) => k + 1);
  }

  const categories = [...new Set(products.map((p) => p.category).filter((c): c is string => !!c))];
  const qd = deferredSearch.toLowerCase().trim();
  const visible = qd
    ? products.filter((p) => p.name.toLowerCase().includes(qd) || (p.barcode ?? "").includes(qd))
    : category === "★"
      ? topSellers
      : products.filter((p) => p.category === category);

  const QUICK_BILLS = [1000, 2000, 5000, 10000, 20000];

  const cashboxName = cashboxes.find((c) => String(c.id) === cashBoxId)?.name ?? "PDV Expresso";

  return (
    <ExpressShell cashboxName={cashboxName}>
      {/* Layout mobile: 2 zonas fixas — produtos (scroll) + teclado/ticket (fixo) */}
      <div className="flex h-full flex-col overflow-hidden lg:grid lg:grid-cols-2 lg:gap-4 lg:p-4 lg:md:p-6">
        {/* Zona 1: Produtos (scroll interno) */}
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2 pb-4 lg:p-0">
          <SyncIndicator tenantId={tenantId} userId={userId} />
          <ScanBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setScanWarning(null);
            }}
            onEnter={handleSubmitSearch}
            warning={scanWarning}
            focusKey={scanFocus}
          />
          <ProductTiles
            products={visible}
            categories={categories}
            activeCategory={qd ? "" : category}
            onCategory={(c) => setCategory(c)}
            cartQty={(id) => cart[id] ?? 0}
            onAdd={handleAdd}
          />
          {/* Ticket compacto */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Ticket ({lines.reduce((n, l) => n + l.qty, 0)})</span>
            {lines.length > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={clearSale} className="hit-area-44">
                Limpar
              </Button>
            )}
          </div>
          <LastItemStrip
            line={(() => {
              const last = lines[lines.length - 1];
              return last ? { id: last.id, name: last.name, qty: last.qty, total: last.total } : null;
            })()}
            itemCount={lines.reduce((n, l) => n + l.qty, 0)}
            subtotal={subtotal}
            onQty={(id, q) => commitQty(id, q)}
            onOpenTicket={() => setTicketOpen(true)}
          />
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
                    onClick={() => commitQty(l.id, l.qty - 1)}
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
                    onClick={() => handleRemove(l.id)}
                    aria-label={`Remover ${l.name}`}
                  >
                    <X className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Zona 2: Pagamento + Teclado (fixo no mobile) */}
        <div className="flex flex-shrink-0 flex-col gap-1.5 border-t bg-background p-2 lg:border-0 lg:bg-transparent lg:p-0">
          {/* Pagamento compacto */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-1.5 text-sm font-semibold">
              <span className="tabular-nums">Subtotal {formatCurrency(subtotal)}</span>
              <span className="tabular-nums text-base">Total {formatCurrency(customerTotal)}</span>
            </div>
            <div className="flex gap-1.5">
              <div className="flex-1">
                <ControlledSelect
                  value={cashBoxId}
                  onValueChange={setCashBoxId}
                  placeholder="Sem caixa"
                  options={[
                    { value: "", label: "Sem caixa" },
                    ...cashboxes.map((c) => ({ value: String(c.id), label: c.name })),
                  ]}
                />
              </div>
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
                Dividido
              </Button>
            </div>
            {payMode === "single" ? (
              <div className="grid grid-cols-4 gap-1.5">
                {PAYMENT_OPTIONS.map((o) => (
                  <Button
                    key={o.value}
                    type="button"
                    variant={payment === o.value ? "default" : "outline"}
                    className="min-h-10 text-xs"
                    onClick={() => setPayment(o.value)}
                  >
                    {o.label}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1.5">
                  <Button type="button" variant="outline" size="sm" className="flex-1 text-xs" onClick={() => { setCashAmount((total / 100).toFixed(2).replace(".", ",")); }}>
                    Tudo dinheiro
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="flex-1 text-xs" onClick={() => { setCashAmount("0,00"); }}>
                    Tudo pix
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="flex-1 text-xs" onClick={() => { setCashAmount((Math.floor(total / 2) / 100).toFixed(2).replace(".", ",")); }}>
                    Meio a meio
                  </Button>
                </div>
                <Input
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="Dinheiro (R$)"
                  inputMode="decimal"
                />
                <p className="text-xs tabular-nums text-muted-foreground">
                  Pix: {formatCurrency(pixCents)} {cashCents + pixCents !== total && total > 0 ? <span className="text-destructive">(soma ≠ total)</span> : null}
                </p>
              </div>
            )}
            {(payment === "CREDITO" || payment === "DEBITO") && payMode === "single" && feePreview > 0 && (
              <p className="text-xs tabular-nums text-muted-foreground">
                + Taxa maquineta ({feeRate}%) {formatCurrency(feePreview)}
              </p>
            )}
            <details className="rounded-lg border">
              <summary className="flex cursor-pointer list-none items-center justify-between p-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                Desconto{discountCents > 0 ? ` ${formatCurrency(discountCents)}` : ""}
                <span className="text-xs font-normal text-muted-foreground">+ Expandir</span>
              </summary>
              <div className="flex flex-col gap-1.5 px-2 pb-2">
                <Input value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="Valor (R$)" inputMode="decimal" />
                <span className="text-[10px] text-muted-foreground">Validado no servidor</span>
              </div>
            </details>
            {(payment === "DINHEIRO" && payMode === "single") || payMode === "split" ? (
              <>
                <Input
                  value={received}
                  onChange={(e) => setReceived(e.target.value)}
                  placeholder="Recebido (R$)"
                  inputMode="decimal"
                  aria-label="Valor recebido"
                />
                <div className="flex flex-wrap gap-1">
                  {QUICK_BILLS.map((b) => (
                    <Button
                      key={b}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setReceived((b / 100).toFixed(2).replace(".", ","))}
                    >
                      {formatCurrency(b)}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setReceived((trocoBase / 100).toFixed(2).replace(".", ","))}
                  >
                    Exato
                  </Button>
                </div>
                <p className={`text-sm font-semibold tabular-nums ${troco < 0 ? "text-destructive" : ""}`}>
                  {troco < 0 ? `Falta ${formatCurrency(falta)}` : `Troco ${formatCurrency(troco)}`}
                </p>
              </>
            ) : null}
          </div>

          {/* Teclado + Toggle */}
          <div className="flex gap-1.5">
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

          {/* Botão Confirmar */}
          <div className="pb-[env(safe-area-inset-bottom)]">
            <Button
              type="button"
              className="min-h-11 w-full text-sm font-semibold"
              disabled={pending || !(payMode === "single" ? canConfirmSingle : canConfirmSplit)}
              onClick={confirmSale}
            >
              {pending ? "Processando..." : `CONFIRMAR ${formatCurrency(customerTotal)}`}
            </Button>
          </div>
        </div>
      </div>

      <TicketSheet
        open={ticketOpen}
        onOpenChange={setTicketOpen}
        lines={lines}
        subtotal={subtotal}
        onQty={(id, q) => commitQty(id, q)}
        onQtyTap={(id, qty) => {
          const l = lines.find((x) => x.id === id);
          setQtyFor({ id, name: l?.name ?? "", qty });
        }}
        onRemove={(id) => handleRemove(id)}
        onClear={clearSale}
      />
      <QuantitySheet
        open={qtyFor !== null}
        onOpenChange={(o) => {
          if (!o) setQtyFor(null);
        }}
        productName={qtyFor?.name ?? ""}
        initialQty={qtyFor?.qty ?? 1}
        onConfirm={(q) => {
          if (qtyFor) commitQty(qtyFor.id, q);
        }}
      />
    </ExpressShell>
  );
}
