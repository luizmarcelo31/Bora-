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
import { updateProductAction } from "./actions";
import { centsToReais } from "@/lib/validators";

type ProductLike = {
  id: number;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  price: number;
  cost: number | null;
  category: string | null;
};

export function EditProductDialog({
  product,
  categories,
}: {
  product: ProductLike;
  categories: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar produto</DialogTitle>
          <DialogDescription>Altere os dados e salve. SKU e código de barras são únicos por empresa.</DialogDescription>
        </DialogHeader>
        <form
          action={async (formData: FormData) => {
            setPending(true);
            try {
              await updateProductAction(formData);
            } finally {
              setPending(false);
            }
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <input type="hidden" name="productId" value={product.id} />
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Nome*
            <Input name="name" defaultValue={product.name} required />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Categoria
            {categories.length > 0 ? (
              <select
                name="category"
                defaultValue={product.category ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <Input name="category" defaultValue={product.category ?? ""} placeholder="Bebidas" />
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Preço (R$)*
            <Input name="price" defaultValue={centsToReais(product.price).toFixed(2).replace(".", ",")} required inputMode="decimal" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Custo (R$)
            <Input
              name="cost"
              defaultValue={product.cost !== null ? centsToReais(product.cost).toFixed(2).replace(".", ",") : ""}
              inputMode="decimal"
              placeholder="6,00"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            SKU
            <Input name="sku" defaultValue={product.sku ?? ""} placeholder="COCA2L" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Código de barras
            <Input name="barcode" defaultValue={product.barcode ?? ""} placeholder="7894900020003" />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Descrição
            <Input name="description" defaultValue={product.description ?? ""} placeholder="Opcional" />
          </label>
          <div className="sm:col-span-2 flex justify-end gap-2">
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
