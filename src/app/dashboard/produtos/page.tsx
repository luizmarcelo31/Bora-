import { ProductService } from "@/services";
import { requireSessionTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency } from "@/lib/validators";
import { createProductAction, toggleProductAction } from "./actions";

const ERROR_MSG: Record<string, string> = {
  invalid: "Dados inválidos. Verifique nome e preço.",
  price: "Preço inválido. Use o formato 12,99.",
  duplicate: "SKU ou código de barras já existe.",
};

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { tenant } = await requireSessionTenant("/dashboard/produtos");
  const params = await searchParams;

  const products = await ProductService.listProducts(tenant.id, { active: "all" });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <PageHeader
        title="Produtos"
        badge={tenant.name}
        description="Cadastro e catálogo da conveniência."
      />

      <Card>
        <CardHeader>
          <CardTitle>Novo produto</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProductAction} className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Nome*
              <Input name="name" required placeholder="Coca-Cola 2L" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Categoria
              <Input name="category" placeholder="Bebidas" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Preço de venda (R$)*
              <Input name="price" required inputMode="decimal" placeholder="12,99" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Custo (R$)
              <Input name="cost" inputMode="decimal" placeholder="6,00" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              SKU
              <Input name="sku" placeholder="COCA2L" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Código de barras
              <Input name="barcode" placeholder="7894900020003" />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Descrição
              <Input name="description" placeholder="Opcional" />
            </label>
            {params.error ? (
              <p className="text-sm text-destructive sm:col-span-3">
                {ERROR_MSG[params.error] ?? "Não foi possível criar."}
              </p>
            ) : null}
            {params.ok ? (
              <p className="text-sm text-muted-foreground sm:col-span-3">
                Produto criado com estoque zerado.
              </p>
            ) : null}
            <div className="sm:col-span-3">
              <Button type="submit">Cadastrar produto</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {products.length === 0 ? (
        <EmptyState title="Nenhum produto" description="Cadastre o primeiro acima." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.category ?? "—"}</TableCell>
                <TableCell>{formatCurrency(p.price)}</TableCell>
                <TableCell>{p.inventory?.quantity ?? 0}</TableCell>
                <TableCell>{p.active ? "Ativo" : "Inativo"}</TableCell>
                <TableCell>
                  <form action={toggleProductAction}>
                    <input type="hidden" name="productId" value={p.id} />
                    <Button variant="outline" size="sm" type="submit">
                      {p.active ? "Desativar" : "Ativar"}
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}
