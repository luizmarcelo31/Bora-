"use client";

import { useState } from "react";
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
import { cancelSaleAction } from "./actions";

export function CancelSaleDialog({ saleId }: { saleId: number }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Cancelar</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cancelar venda #{saleId}</DialogTitle>
          <DialogDescription>Informe o motivo. Estoque, caixa e financeiro serão estornados.</DialogDescription>
        </DialogHeader>
        <form
          action={async (fd: FormData) => {
            setPending(true);
            try { await cancelSaleAction(fd); } finally { setPending(false); }
          }}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="saleId" value={saleId} />
          <label className="flex flex-col gap-1 text-sm">
            Motivo*
            <Input name="reason" required maxLength={500} placeholder="Ex.: cliente desistiu" />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Fechar</Button>
            <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Cancelando..." : "Confirmar cancelamento"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
