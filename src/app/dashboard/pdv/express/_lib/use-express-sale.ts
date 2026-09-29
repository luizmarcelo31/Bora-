"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/validators";
import { createSaleAction } from "../../actions";
import { calcChange, calcSplit, calcTotals } from "@/lib/pdv-math";
import { DISCOUNT_PASSWORD } from "../../pdv-client";
import { buzz } from "@/hooks/use-long-press";

export type ExpressProduct = { id: number; name: string; price: number; stock: number; barcode: string | null; category: string | null; imageUrl: string | null };
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

/**
 * Estado e ações da venda expressa (spec E1). Nenhum JSX aqui.
 * Comportamento idêntico ao anterior — só mudou de endereço.
 */
export function useExpressSale({
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
    buzz(15);
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

  function restoreCart(rec: Record<number, number>) {
    setCart((c) => {
      const next = { ...c };
      for (const [id, qty] of Object.entries(rec)) {
        if (qty > 0) next[Number(id)] = qty;
      }
      return next;
    });
  }

  function clearSale() {    setCart({});
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
        .slice(0, 18),
    [topSellerIds, products]
  );

  function submitSearch(): "added" | "not-found" | "no-stock" | "empty" {
    const q = search.trim();
    if (!q) return "empty";
    const exact = products.find((p) => p.barcode === q);
    if (!exact) return "not-found";
    if (exact.stock <= 0) return "no-stock";
    addToCart(exact.id);
    setSearch("");
    toast.success(`${exact.name} adicionado.`);
    return "added";
  }

  return {
    cart,
    products,
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
    receivedCents,
    cashCents,
    pixCents,
    trocoBase,
    troco,
    falta,
    filtered,
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
  };
}
