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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateFinancialAction, deleteFinancialAction } from "./actions";
import { centsToReais } from "@/lib/validators";

export function EditFinancialDialog({
  movement,
  categories,
  cashboxes,
}: {
  movement: { id: number; type: string; category: string; description: string; amount: number; movementDate: string; cashBoxId: number | null };
  categories: { id: number; name: string }[];
  cashboxes: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const dateStr = movement.movementDate.slice(0, 10);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={false}>Editar</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar lançamento</DialogTitle>
          <DialogDescription>Não é possível editar lançamentos já pagos — dê baixa reversa antes.</DialogDescription>
        </DialogHeader>
        <form
          action={async (fd: FormData) => {
            setPending(true);
            try { await updateFinancialAction(fd); } finally { setPending(false); }
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <input type="hidden" name="id" value={movement.id} />
          <label className="flex flex-col gap-1 text-sm">
            Tipo*
            <select name="type" defaultValue={movement.type} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="RECEITA">Receita</option>
              <option value="DESPESA">Despesa</option>
              <option value="TRANSFERENCIA">Transferência</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Categoria*
            {categories.length > 0 ? (
              <select name="category" defaultValue={movement.category} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            ) : (
              <Input name="category" defaultValue={movement.category} required />
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Valor (R$)*
            <Input name="amount" defaultValue={centsToReais(movement.amount).toFixed(2).replace(".", ",")} required inputMode="decimal" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Data*
            <Input name="movementDate" type="date" defaultValue={dateStr} required />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Descrição*
            <Input name="description" defaultValue={movement.description} required />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Caixa (opcional)
            <select name="cashBoxId" defaultValue={movement.cashBoxId ?? ""} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Nenhum</option>
              {cashboxes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteFinancialDialog({ id }: { id: number }) {
  const [pending, setPending] = useState(false);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">Excluir</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
          <AlertDialogDescription>Esta ação não pode ser desfeita. Lançamentos pagos não podem ser excluídos — desmarque o pago antes.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <form
            action={async (fd: FormData) => {
              setPending(true);
              try { await deleteFinancialAction(fd); } finally { setPending(false); }
            }}
          >
            <input type="hidden" name="id" value={id} />
            <AlertDialogAction asChild>
              <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Excluindo..." : "Excluir"}</Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
