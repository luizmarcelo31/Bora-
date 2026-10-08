"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PAYMENT_OPTIONS } from "@/lib/payments";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/validators";
import { ProductGrid } from "./_components/product-grid";
import { CartSheet } from "./_components/cart-sheet";
import { ControlledSelect } from "@/components/ui/controlled-select";
import { Item, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Package } from "lucide-react";
import { useCatalogSnapshot } from "@/lib/offline/use-catalog-snapshot";
import { enviarOuEnfileirar, type ResultadoVenda } from "@/lib/offline/enviar";
import { SyncIndicator } from "@/components/offline/SyncIndicator";

export type PdvProduct = { id: number; name: string; price: number; stock: number; category?: string | null; imageUrl?: string | null; wholesalePrice?: number | null; wholesaleMinQuantity?: number | null };
export type PdvCashbox = { id: number; name: string };

const PAYMENTS = PAYMENT_OPTIONS;
// Senha de desconto removida do cliente (decisão Fase 0).
// A validação deve ser feita no servidor, nunca no bundle do navegador.
// TODO: implementar validação no servidor (API de desconto).

const SALE_ERROR_MSG: Record<string, string> = {
  invalid: "Venda inválida. Confira os itens.",
  empty: "Adicione ao menos um item.",
  stock: "Estoque insuficiente para um ou mais itens.",
  discount: "Desconto acima do permitido ou maior que o subtotal.",
  amount: "Valores de pagamento não conferem. Confira e tente de novo.",
  cashbox: "Caixa selecionado está fechado ou inexistente.",
  sale: "Não foi possível concluir a venda. Tente novamente.",
};

export function PdvClient({
  products,
  cashboxes,
  user,
  tenantId,
}: {
  products: PdvProduct[];
  cashboxes: PdvCashbox[];
  user: { id: number; name: string; email: string };
  tenantId: number;
}) {
  const [cart, setCart] = useState<Record<number, number>>({});
  const [payment, setPayment] = useState("DINHEIRO");
  const [cashBoxId, setCashBoxId] = useState("");
  const [discount, setDiscount] = useState("");
  const [customer, setCustomer] = useState("");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  // Desconto: validado no servidor (services/sale.ts → settings.maxDiscount).
  // Sem senha no cliente — o servidor decide se aceita ou não.
  const [pinOpen, setPinOpen] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState("");
  const idemRef = useRef<string | null>(null);
  function getIdemKey() {
    if (!idemRef.current) idemRef.current = crypto.randomUUID();
    return idemRef.current;
  }

  // Snapshot do catálogo para o modo offline (Fase 3.1). `barcode` não vem
  // nesta tela — o leitor de código é do PDV Expresso — então fica nulo em vez
  // de inventado: o modo offline procura por nome, e um código falso faria o
  // operador vender o produto errado.
  useCatalogSnapshot(
    tenantId,
    products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock,
      barcode: null,
      category: p.category ?? null,
      imageUrl: p.imageUrl ?? null,
    }))
  );

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

  // Desconto em centavos. Fica no escopo do componente porque a fila offline
  // precisa do mesmo número que a action recebe — dois lugares convertendo
  // "1,50" divergem em exatamente uma venda.
  const discountCents = useMemo(() => {
    const v = parseFloat(discount.replace(/\./g, "").replace(",", ".").trim());
    return Number.isFinite(v) && v > 0 ? Math.round(v * 100) : 0;
  }, [discount]);

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

  /**
   * Trata o desfecho de `enviarOuEnfileirar` (Fase 3.1).
   *
   * Os três casos pedem mensagens diferentes porque o operador precisa saber
   * em qual deles a venda está salva: no banco, no aparelho, ou em lugar
   * nenhum. "Venda registrada" para uma venda que ficou só na fila seria a
   * mentira mais cara deste feature.
   */
  function handleEnvio(res: ResultadoVenda) {
    if (res.tipo === "venda") {
      handleSaleResult({ ok: res.saleId });
      return;
    }

    if (res.tipo === "rejeitada") {
      toast.error(SALE_ERROR_MSG[res.erro] ?? SALE_ERROR_MSG.sale);
      return;
    }

    // Enfileirada: a venda está garantida no aparelho. O troco já foi dado,
    // então o carrinho pode limpar — a venda existe, só falta o servidor.
    if (res.motivo) {
      toast.error(
        res.motivo === "cheia"
          ? "Sem rede e a fila de vendas está cheia. Esta venda NÃO foi salva — anote o valor e sincronize antes de continuar."
          : "Sem rede e o aparelho está sem espaço para salvar. Esta venda NÃO foi registrada — anote o valor e reconecte."
      );
      return;
    }

    toast.warning("Sem conexão: venda salva no aparelho. Sincroniza sozinha quando a rede voltar.", {
      duration: 6000,
    });
    setCart({});
    setDiscount("");
    setCustomer("");
    setCartOpen(false);
    idemRef.current = null;
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
      handleEnvio(
        await enviarOuEnfileirar(
          {
            items: lines.map((l) => ({ productId: l.id, quantity: l.qty })),
            paymentMethod: payment,
            cashBoxId: cashBoxId ? Number(cashBoxId) : undefined,
            discount: discountCents,
            customerName: customer,
            tenantId,
            userId: user.id,
          },
          getIdemKey()
        )
      );
    } catch {
      toast.error(SALE_ERROR_MSG.sale);
    } finally {
      setPending(false);
    }
  }

  async function confirmSale() {
    if (pending || lines.length === 0) return;
    setPending(true);
    try {
      handleEnvio(
        await enviarOuEnfileirar(
          {
            items: lines.map((l) => ({ productId: l.id, quantity: l.qty })),
            paymentMethod: payment,
            cashBoxId: cashBoxId ? Number(cashBoxId) : undefined,
            discount: discountCents,
            customerName: customer,
            tenantId,
            userId: user.id,
          },
          getIdemKey()
        )
      );
    } catch {
      toast.error(SALE_ERROR_MSG.sale);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {/* Operador — PIN para troca.
          Auditoria mobile: este card ocupava ~90px (y=188..280) com avatar,
          nome e botão, para informar ao operador algo que ele já sabe. Virou
          uma linha compacta acima do catálogo; o nome continua em title para
          o leitor de tela. */}
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm text-muted-foreground" title={user.name}>
          {user.name}
        </span>
        <Button variant="ghost" size="sm" onClick={() => setPinOpen(true)} className="hit-area-44 shrink-0" aria-label="Trocar operador">
          <span aria-hidden="true">🔒</span> Trocar
        </Button>
      </div>
      <Dialog open={pinOpen} onOpenChange={(o) => { setPinOpen(o); if (!o) { setPinValue(""); setPinError(""); } }}>
        <DialogContent className="max-w-sm border-border bg-card shadow-sm dark:border-border dark:bg-card">
          <DialogHeader>
            <DialogTitle>Trocar operador</DialogTitle>
            <DialogDescription>Digite o PIN para trocar de operador.</DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-1.5 text-sm">
            PIN do operador
            <Input
              type="password"
              placeholder="PIN do operador"
              aria-label="PIN do operador"
              aria-invalid={pinError ? true : undefined}
              aria-describedby={pinError ? "pin-error" : undefined}
              value={pinValue}
              onChange={(e) => { setPinValue(e.target.value); setPinError(""); }}
              className="border-border bg-background shadow-sm dark:border-border dark:bg-background"
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
            {pinError && <span id="pin-error" role="alert" className="text-xs text-destructive">{pinError}</span>}
            <p className="text-xs text-muted-foreground mt-1">PIN: 1234 (demo)</p>
          </label>
        </DialogContent>
      </Dialog>
      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
      {/* Vendas pendentes de sync (Fase 3.1). Some quando não há nada. */}
      <div className="lg:col-span-3">
        <SyncIndicator tenantId={tenantId} userId={user.id} />
      </div>
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
          <label className="flex flex-col gap-1 text-sm">
            <span className="sr-only">Buscar produto</span>
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          </label>
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                Pagamento
                <ControlledSelect
                  label="Pagamento"
                  value={payment}
                  onValueChange={setPayment}
                  options={PAYMENTS}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Caixa (opcional)
                <ControlledSelect
                  label="Caixa"
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                Desconto (R$)
                <Input value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0,00" inputMode="decimal" />
                <span className="text-muted-foreground text-xs">Validado no servidor</span>
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
      {/* B — Cobrança fixa. No mobile a coluna "Venda atual" + formulário de
          pagamento fica 1173px abaixo do primeiro produto (medido a 390px), ou
          seja, 1,4 telas antes do operador conseguir cobrar. A barra fixa
          resolve: total e botão de cobrança ficam sempre na mesma altura,
          acima da BottomNav. No desktop a coluna lateral já é visível e o
          layout `lg:sticky` original permanece — por isso `lg:hidden`. */}
      <div className="fixed inset-x-0 bottom-16 z-40 border-t bg-background/95 px-3 pt-1.5 pb-1.5 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <div className="flex min-w-0 flex-col">
            <span className="text-[11px] leading-tight text-muted-foreground">
              {lines.reduce((n, l) => n + l.qty, 0)}{" "}
              {lines.reduce((n, l) => n + l.qty, 0) === 1 ? "item" : "itens"}
            </span>
            <span className="text-base font-semibold leading-tight tabular-nums">
              {formatCurrency(subtotal)}
            </span>
          </div>
          <Button
            type="button"
            className="ml-auto h-11 flex-1 text-sm font-semibold disabled:opacity-60 disabled:text-primary-foreground/70"
            disabled={lines.length === 0 || pending}
            onClick={() => setCartOpen(true)}
          >
            Cobrar
          </Button>
        </div>
      </div>
      {/* Espaçador para a barra fixa não cobrir o fim do catálogo. Só quando há
          itens, porque a barra só aparece nesse caso. */}
      {lines.length > 0 && <div aria-hidden="true" className="h-24 lg:hidden" />}
    </>
  );
}
