"use client";

import { useEffect, useMemo, useState } from "react";
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
import { ControlledSelect } from "@/components/ui/controlled-select";
import { formatCurrency } from "@/lib/validators";
import { contarPendentes } from "@/lib/offline/queue";

type Box = { id: number; name: string; currentBalance: number };

export function CloseCashBoxDialog({
  openBoxes,
  tenantId,
  userId,
}: {
  openBoxes: Box[];
  tenantId: number;
  userId: number;
}) {
  const [selectedId, setSelectedId] = useState<string>(openBoxes[0]?.id.toString() ?? "");
  const [closingRaw, setClosingRaw] = useState("");
  const [pending, setPending] = useState(false);

  /**
   * Vendas na fila deste aparelho (Fase 3.1 — ADR-006 §7).
   *
   * Aviso, não bloqueio: fechar o caixa é decisão do operador e acontece todo
   * dia, mesmo com pendência. Bloquear aqui transformaria um recurso de
   * emergência em rotina.
   *
   * Avisar importa porque o saldo do sistema vai divergeir do contado: a venda
   * existe no aparelho mas ainda não entrou no caixa, e o operador que contar
   * sem saber disso vai registrar uma diferença que não é dele.
   *
   * Lido em `useEffect`, e não durante o render: `localStorage` não existe no
   * servidor, então ler no corpo do componente faria o HTML do servidor dizer
   * "0 vendas" e o cliente dizer "3" — hydration mismatch.
   */
  const [pendentes, setPendentes] = useState(0);
  useEffect(() => {
    setPendentes(contarPendentes(tenantId, userId));
  }, [tenantId, userId]);

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
            <ControlledSelect
              name="cashBoxId"
              required
              value={selectedId}
              onValueChange={setSelectedId}
              options={openBoxes.map((b) => ({
                value: String(b.id),
                label: `${b.name} (saldo ${formatCurrency(b.currentBalance)})`,
              }))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Valor contado (R$)*
            <Input name="closingBalance" required inputMode="decimal" placeholder="0,00" value={closingRaw} onChange={(e) => setClosingRaw(e.target.value)} />
          </label>
          {selected && closingCents !== undefined ? (
            <p className={`text-sm ${diff === 0 ? "text-muted-foreground" : diff! > 0 ? "text-[var(--status-success-fg)]" : "text-destructive"}`}>
              Sistema: {formatCurrency(selected.currentBalance)} → Contado: {formatCurrency(closingCents)} — {diffLabel}
            </p>
          ) : null}
          {pendentes > 0 ? (
            <p className="rounded-md border border-border bg-muted px-2 py-1.5 text-xs text-muted-foreground">
              Há <span className="font-semibold">{pendentes}</span> venda{pendentes === 1 ? "" : "s"} deste
              aparelho aguardando sincronização. Elas não entraram no saldo do caixa — a diferença que
              aparecer não é sua. Sincronize antes de fechar, ou anote para conferir depois.
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
