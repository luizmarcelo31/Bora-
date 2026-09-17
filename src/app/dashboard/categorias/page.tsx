import { prisma } from "@/lib/db";
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
import { createCategoryAction, toggleCategoryAction } from "./actions";

const ERROR_MSG: Record<string, string> = {
  invalid: "Dados inválidos.",
  duplicate: "Já existe uma categoria com esse nome e tipo.",
};

export default async function CategoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { tenant } = await requireSessionTenant("/dashboard/categorias");
  const params = await searchParams;
  const categories = await prisma.category.findMany({
    where: { tenantId: tenant.id },
    orderBy: [{ kind: "asc" }, { name: "asc" }],
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Categorias"
        badge={tenant.name}
        description="Organize produtos e lançamentos financeiros."
      />

      <Card>
        <CardHeader>
          <CardTitle>Nova categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCategoryAction} className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Nome*
              <Input name="name" required placeholder="Ex.: Bebidas, Aluguel" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Tipo*
              <select
                name="kind"
                required
                defaultValue="PRODUCT"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="PRODUCT">Produto</option>
                <option value="FINANCIAL">Financeiro</option>
              </select>
            </label>
            {params.error ? (
              <p className="text-sm text-destructive sm:col-span-3">
                {ERROR_MSG[params.error] ?? "Não foi possível criar."}
              </p>
            ) : null}
            {params.ok ? (
              <p className="text-sm text-muted-foreground sm:col-span-3">Categoria criada.</p>
            ) : null}
            <div className="sm:col-span-3">
              <Button type="submit">Criar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {categories.length === 0 ? (
        <EmptyState title="Nenhuma categoria" description="Crie a primeira acima." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.kind === "PRODUCT" ? "Produto" : "Financeiro"}</TableCell>
                <TableCell>{c.active ? "Ativa" : "Inativa"}</TableCell>
                <TableCell>
                  <form action={toggleCategoryAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <Button variant="outline" size="sm" type="submit">
                      {c.active ? "Desativar" : "Ativar"}
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
