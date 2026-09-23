import { ProductService } from "@/services";
import { prisma } from "@/lib/db";
import { requireSessionTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StatusBadge, getStockStatus, getStockStatusLabel } from "@/components/shared/StatusBadge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableCard } from "@/components/shared/TableCard";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { SearchParamToast } from "@/components/shared/SearchParamToast";
import { Package } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { SelectField } from "@/components/ui/select-field";
import { formatCurrency } from "@/lib/validators";
import { createProductAction, toggleProductAction } from "./actions";
import { EditProductDialog } from "./edit-dialog";

const ERROR_MSG: Record<string, string> = {
  invalid: "Dados inválidos. Verifique nome e preço.",
  price: "Preço inválido. Use o formato 12,99.",
  duplicate: "SKU ou código de barras já existe.",
  duplicate_sku: "SKU já existe nesta empresa.",
  duplicate_barcode: "Código de barras já existe nesta empresa.",
  not_found: "Produto não encontrado.",
  forbidden: "Seu role não tem permissão para esta ação.",
  fail: "Não foi possível concluir. Tente novamente.",
};

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string; q?: string; status?: string; cat?: string }>;
}) {
  const { tenant } = await requireSessionTenant("/dashboard/produtos");
  const params = await searchParams;

  const [allProducts, productCategories] = await Promise.all([
    ProductService.listProducts(tenant.id, { active: "all" }),
    prisma.category.findMany({
      where: { tenantId: tenant.id, kind: "PRODUCT", active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const q = (params.q ?? "").toLowerCase().trim();
  const status = params.status ?? "all";
  const cat = params.cat ?? "all";

  const products = allProducts.filter((p) => {
    if (status === "active" && !p.active) return false;
    if (status === "inactive" && p.active) return false;
    if (cat !== "all" && (p.category ?? "") !== cat) return false;
    if (q && !(`${p.name} ${p.sku ?? ""} ${p.barcode ?? ""}`.toLowerCase().includes(q))) return false;
    return true;
  });

  const total = allProducts.length;
  const ativos = allProducts.filter((p) => p.active).length;
  const baixo = allProducts.filter((p) => (p.inventory?.quantity ?? 0) <= (p.inventory?.minimumStock ?? 0)).length;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Produtos"
        badge={tenant.name}
        description="Catálogo, estoque e status — com filtros e edição inline."
      />
      <SearchParamToast okText="Produto criado com estoque zerado." errorMap={ERROR_MSG} />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Total" value={String(total)} hint={`${ativos} ativos`} />
        <MetricCard title="Ativos" value={String(ativos)} hint={`${total - ativos} inativos`} />
        <MetricCard title="Estoque baixo" value={String(baixo)} hint={baixo > 0 ? "Repor em breve" : "Tudo ok"} />
      </div>

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
              {productCategories.length > 0 ? (
                <SelectField
                  name="category"
                  defaultValue=""
                  placeholder="Sem categoria"
                  options={[{ value: "", label: "Sem categoria" }, ...productCategories.map((c) => ({ value: c.name, label: c.name }))]}
                />
              ) : (
                <Input name="category" placeholder="Bebidas (crie em Categorias)" />
              )}
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
              <Textarea name="description" placeholder="Opcional" rows={2} />
            </label>
            <div className="sm:col-span-3">
              <Button type="submit">Cadastrar produto</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col gap-1 text-sm">
              Buscar
              <Input name="q" defaultValue={params.q ?? ""} placeholder="Nome, SKU ou barras" className="w-56" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Categoria
              <SelectField
                name="cat"
                defaultValue={cat}
                placeholder="Todas"
                options={[{ value: "all", label: "Todas" }, ...productCategories.map((c) => ({ value: c.name, label: c.name })), { value: "", label: "Sem categoria" }]}
              />
            </label>
            <Button type="submit" variant="outline">Filtrar</Button>
            {(q || status !== "all" || cat !== "all") ? <a href="/dashboard/produtos" className="text-sm text-muted-foreground underline">Limpar</a> : null}
          </form>
          <div className="mt-4">
            <FilterTabs
              value={status}
              options={[
                { v: "all", label: "Todos" },
                { v: "active", label: "Ativos" },
                { v: "inactive", label: "Inativos" },
              ].map((t) => ({
                value: t.v,
                label: t.label,
                href: `/dashboard/produtos?status=${t.v}&q=${encodeURIComponent(q)}&cat=${encodeURIComponent(cat)}`,
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {products.length === 0 ? (
        <EmptyState title="Nenhum produto" description={q || cat !== "all" ? "Nenhum resultado para o filtro." : "Cadastre o primeiro acima."} icon={Package} />
      ) : (
        <TableCard
          title="Catálogo"
          description="Preço, estoque e status por produto."
          footer={`${products.length} produto(s)`}
        >
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
            {products.map((p) => {
              const qty = p.inventory?.quantity ?? 0;
              const min = p.inventory?.minimumStock ?? 0;
              const status = getStockStatus(qty, min);
              return (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.category ?? "—"}</TableCell>
                <TableCell className="tabular-nums">{formatCurrency(p.price)}</TableCell>
                <TableCell className="tabular-nums">{qty}</TableCell>
                <TableCell>
                  <StatusBadge status={status} label={getStockStatusLabel(qty, min)} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={p.active ? "active" : "inactive"} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <EditProductDialog
                      product={{
                        id: p.id,
                        name: p.name,
                        sku: p.sku,
                        barcode: p.barcode,
                        description: p.description,
                        price: p.price,
                        cost: p.cost,
                        category: p.category,
                      }}
                      categories={productCategories}
                    />
                    <form action={toggleProductAction}>
                      <input type="hidden" name="productId" value={p.id} />
                      <Button variant="outline" size="sm" type="submit">
                        {p.active ? "Desativar" : "Ativar"}
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
        </TableCard>
      )}
    </main>
  );
}
