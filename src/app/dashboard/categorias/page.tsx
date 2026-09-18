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
import { SearchParamToast } from "@/components/shared/SearchParamToast";
import { Badge } from "@/components/ui/badge";
import { Tags } from "lucide-react";
import { createCategoryAction, toggleCategoryAction } from "./actions";
import { EditCategoryDialog, DeleteCategoryDialog } from "./category-dialogs";
import { SelectField } from "@/components/ui/select-field";

const ERROR_MSG: Record<string, string> = {
  invalid: "Dados inválidos.",
  duplicate: "Já existe uma categoria com esse nome e tipo.",
};

export default async function CategoriasPage() {
  const { tenant } = await requireSessionTenant("/dashboard/categorias");
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
      <SearchParamToast okText="Categoria criada." errorMap={ERROR_MSG} />

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
              <SelectField
                name="kind"
                defaultValue="PRODUCT"
                required
                options={[
                  { value: "PRODUCT", label: "Produto" },
                  { value: "FINANCIAL", label: "Financeiro" },
                ]}
              />
            </label>
            <div className="sm:col-span-3">
              <Button type="submit">Criar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {categories.length === 0 ? (
        <EmptyState title="Nenhuma categoria" description="Crie a primeira acima." icon={Tags} />
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
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell><Badge variant="outline">{c.kind === "PRODUCT" ? "Produto" : "Financeiro"}</Badge></TableCell>
                <TableCell>{c.active ? <Badge>Ativa</Badge> : <Badge variant="secondary">Inativa</Badge>}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <EditCategoryDialog id={c.id} name={c.name} />
                    <form action={toggleCategoryAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button variant="outline" size="sm" type="submit">
                        {c.active ? "Desativar" : "Ativar"}
                      </Button>
                    </form>
                    <DeleteCategoryDialog id={c.id} name={c.name} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}
