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
    discountPending,
    discountPassword,
    setDiscountPassword,
    discountError,
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
    applyDiscount,
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
    <div className="grid gap-4 p-4 md:p-6 lg:grid-cols-2">
      {/* Vendas pendentes de sync (Fase 3.1). Some quando não há nada. */}
      <div className="lg:col-span-2">
        <SyncIndicator tenantId={tenantId} userId={userId} />
      </div>
      {/* Catálogo + busca */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
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
          {/* Ticket */}
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
    </div>
    </ExpressShell>
  );
}
