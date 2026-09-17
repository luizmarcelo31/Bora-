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
import { updateCategoryAction, deleteCategoryAction } from "./actions";

export function EditCategoryDialog({ id, name }: { id: number; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Editar</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar categoria</DialogTitle>
          <DialogDescription>Nome único por tipo (produto/financeiro).</DialogDescription>
        </DialogHeader>
        <form
          action={async (fd: FormData) => {
            setPending(true);
            try { await updateCategoryAction(fd); } finally { setPending(false); }
          }}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="id" value={id} />
          <Input name="name" defaultValue={name} required maxLength={100} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteCategoryDialog({ id, name }: { id: number; name: string }) {
  const [pending, setPending] = useState(false);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">Excluir</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir "{name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Se houver produtos ou lançamentos usando esta categoria, ela será apenas inativada para preservar o histórico. Caso contrário será removida.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <form
            action={async (fd: FormData) => {
              setPending(true);
              try { await deleteCategoryAction(fd); } finally { setPending(false); }
            }}
          >
            <input type="hidden" name="id" value={id} />
            <AlertDialogAction asChild>
              <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Excluindo..." : "Confirmar"}</Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
