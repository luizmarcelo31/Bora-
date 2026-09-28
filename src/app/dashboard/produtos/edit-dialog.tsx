"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { updateProductAction, uploadProductImageAction, removeProductImageAction } from "./actions";
import { centsToReais } from "@/lib/validators";
import { Package } from "lucide-react";
import { SelectField } from "@/components/ui/select-field";

type ProductLike = {
  id: number;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  price: number;
  cost: number | null;
  category: string | null;
  imageUrl: string | null;
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
  // Bottom sheet no phone, painel lateral no desktop (skill §9).
  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="hit-area-44">
          Editar
        </Button>
      </SheetTrigger>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={isMobile ? "max-h-[90dvh] overflow-y-auto rounded-t-2xl" : "sm:max-w-lg"}
      >
        <SheetHeader>
          <SheetTitle>Editar produto</SheetTitle>
          <SheetDescription>Altere os dados e salve. SKU e código de barras são únicos por empresa.</SheetDescription>
        </SheetHeader>
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
              <SelectField
                name="category"
                defaultValue={product.category ?? ""}
                placeholder="Sem categoria"
                options={[{ value: "", label: "Sem categoria" }, ...categories.map((c) => ({ value: c.name, label: c.name }))]}
              />
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
            <Textarea name="description" defaultValue={product.description ?? ""} placeholder="Opcional" rows={2} />
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
        <div className="flex items-center gap-3 rounded-lg border p-3">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview remoto do Storage, sem remotePatterns
            <img
              src={product.imageUrl}
              alt={`Foto de ${product.name}`}
              className="size-14 shrink-0 rounded-lg border object-cover"
            />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Package className="size-5" />
            </div>
          )}
          <form
            action={async (formData: FormData) => {
              setPending(true);
              try {
                await uploadProductImageAction(formData);
              } finally {
                setPending(false);
              }
            }}
            className="flex flex-1 flex-wrap items-center gap-2"
          >
            <input type="hidden" name="productId" value={product.id} />
            <input
              type="file"
              name="imagem"
              accept="image/jpeg,image/png,image/webp"
              required
              disabled={pending}
              className="min-w-0 flex-1 text-xs text-muted-foreground file:mr-2 file:rounded-md file:border file:bg-muted file:px-2 file:py-1 file:text-xs"
            />
            <Button type="submit" size="sm" variant="outline" disabled={pending}>
              {pending ? "Enviando..." : "Enviar foto"}
            </Button>
          </form>
          {product.imageUrl ? (
            <form
              action={async (formData: FormData) => {
                setPending(true);
                try {
                  await removeProductImageAction(formData);
                } finally {
                  setPending(false);
                }
              }}
            >
              <input type="hidden" name="productId" value={product.id} />
              <Button type="submit" size="sm" variant="ghost" disabled={pending}>
                Remover
              </Button>
            </form>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG ou WebP até 2MB.</p>
      </SheetContent>
    </Sheet>
  );
}
