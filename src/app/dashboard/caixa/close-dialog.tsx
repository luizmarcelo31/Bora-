"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { closeCashBoxAction } from "./actions";
import { formatCurrency } from "@/lib/validators";

type Box = { id: number; name: string; currentBalance: number };

export function CloseCashBoxDialog({ openBoxes }: { openBoxes: Box[] }) {
  const [selectedId, setSelectedId] = useState<string>(openBoxes[0]?.id.toString() ?? "");
  const [closingRaw, setClosingRaw] = useState("");
  const [pending, setPending] = useState(false);

  const selected = useMemo(() => openBoxes.find((b) => b.id.toString() === selectedId), [openBoxes, selectedId]);

  function parseBRL(raw: string): number | undefined {
    const normalized = raw.replace(/\./g, "").replace(",", ".").trim();
    if (!normalized) return undefined;
    const v = Number(normalized);
    if (!Number.isFinite(v) || v < 0) return undefined;
    return Math.round(v * 100);
  }

  const closingCents = parseBRL(closingRaw);
  const diff = selected && closingCents !== undefined ? closingCents - selected.currentBalance : undefined;
  const diffLabel =
    diff === undefined ? null : diff === 0 ? "Sem diferença" : diff > 0 ? `Sobra ${formatCurrency(diff)}` : `Falta ${formatCurrency(Math.abs(diff))}`;

  if (openBoxes.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum caixa aberto.</p>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Fechar caixa</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Fechar caixa</DialogTitle>
          <DialogDescription>Valor contado será comparado ao saldo do sistema. Diferença será lançada automaticamente no financeiro.</DialogDescription>
        </DialogHeader>
        <form
          action={async (fd: FormData) => {
            setPending(true);
            try { await closeCashBoxAction(fd); } finally { setPending(false); }
          }}
          className="flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1 text-sm">
            Caixa*
            <select
              name="cashBoxId"
              required
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {openBoxes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (saldo {formatCurrency(b.currentBalance)})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Valor contado (R$)*
            <Input name="closingBalance" required inputMode="decimal" placeholder="0,00" value={closingRaw} onChange={(e) => setClosingRaw(e.target.value)} />
          </label>
          {selected && closingCents !== undefined ? (
            <p className={`text-sm ${diff === 0 ? "text-muted-foreground" : diff! > 0 ? "text-emerald-600" : "text-destructive"}`}>
              Sistema: {formatCurrency(selected.currentBalance)} → Contado: {formatCurrency(closingCents)} — {diffLabel}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={pending}>{pending ? "Fechando..." : "Confirmar fechamento"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
