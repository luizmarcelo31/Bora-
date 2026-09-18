"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { SelectField } from "@/components/ui/select-field";

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
            <SelectField
              name="type"
              defaultValue={movement.type}
              options={[
                { value: "RECEITA", label: "Receita" },
                { value: "DESPESA", label: "Despesa" },
                { value: "TRANSFERENCIA", label: "Transferência" },
              ]}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Categoria*
            {categories.length > 0 ? (
              <SelectField
                name="category"
                defaultValue={movement.category}
                options={categories.map((c) => ({ value: c.name, label: c.name }))}
              />
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
            <Textarea name="description" defaultValue={movement.description} required rows={2} />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Caixa (opcional)
            <SelectField
              name="cashBoxId"
              defaultValue={movement.cashBoxId ? String(movement.cashBoxId) : ""}
              placeholder="Nenhum"
              options={[{ value: "", label: "Nenhum" }, ...cashboxes.map((c) => ({ value: String(c.id), label: c.name }))]}
            />
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
