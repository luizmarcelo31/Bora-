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
import { updateInventorySettingsAction } from "./actions";

export function EditInventoryDialog({
  productId,
  productName,
  minimumStock,
  maximumStock,
}: {
  productId: number;
  productName: string;
  minimumStock: number;
  maximumStock: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Limites
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Limites de estoque</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>
        <form
          action={async (fd: FormData) => {
            setPending(true);
            try {
              await updateInventorySettingsAction(fd);
            } finally {
              setPending(false);
            }
          }}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="productId" value={productId} />
          <label className="flex flex-col gap-1 text-sm">
            Mínimo*
            <Input name="minimumStock" type="number" min={0} defaultValue={minimumStock} required />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Máximo (opcional)
            <Input name="maximumStock" type="number" min={1} defaultValue={maximumStock ?? ""} placeholder="Sem limite" />
          </label>
          <p className="text-xs text-muted-foreground">Máximo deve ser maior que o mínimo quando informado. Não altera o saldo atual.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
