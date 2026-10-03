import { prisma } from "@/lib/db";
import { requireSessionTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableCard } from "@/components/shared/TableCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LinhaLista } from "@/components/shared/LinhaLista";
import { Valor } from "@/components/shared/Valor";
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
import { Tags } from "lucide-react";
import { createCategoryAction, toggleCategoryAction } from "./actions";
import { EditCategoryDialog, DeleteCategoryDialog } from "./category-dialogs";
import { SelectField } from "@/components/ui/select-field";

const ERROR_MSG: Record<string, string> = {
  invalid: "Dados inválidos.",
  duplicate: "Já existe uma categoria com esse nome e tipo.",
  fail: "Não foi possível concluir. Tente novamente.",
};

export default async function CategoriasPage() {
  const { tenant } = await requireSessionTenant("/dashboard/categorias");
  const categories = await prisma.category.findMany({
    where: { tenantId: tenant.id },
    orderBy: [{ kind: "asc" }, { name: "asc" }],
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
      <PageHeader
        title="Categorias"
        badge={tenant.name}
        description="Organize produtos e lançamentos financeiros."
      />
      <SearchParamToast okText="Categoria criada." errorMap={ERROR_MSG} />

      <details className="rounded-xl border border-border/50 bg-card shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          Nova categoria
          <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">+ Expandir</span>
        </summary>
        <div className="px-4 pb-4">
          <form action={createCategoryAction} className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Nome*
              <Input name="name" required placeholder="Ex.: Bebidas, Aluguel" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Tipo*
              <SelectField
                name="kind"
                defaultValue="PRODUTO"
                required
                options={[
                  { value: "PRODUTO", label: "Produto" },
                  { value: "FINANCEIRO", label: "Financeiro" },
                ]}
              />
            </label>
            <div className="sm:col-span-3">
              <Button type="submit">Criar</Button>
            </div>
          </form>
        </div>
      </details>

      {categories.length === 0 ? (
        <EmptyState title="Nenhuma categoria" description="Crie a primeira acima." icon={Tags} />
      ) : (
        <TableCard
          title="Categorias"
          description="Tipo e status por categoria."
          footer={`${categories.length} categoria(s)`}
        >
        <>
        {/* Mobile: lista compacta (skill §8) — tabela só no desktop */}
        <ul className="flex flex-col gap-2 p-3 md:hidden">
          {categories.map((c) => (
            <li key={c.id}>
              <LinhaLista
                /* Categoria inativa é o estado que pede ação: o tom de atenção
                   no título é o que a faz achar na lista sem ler o badge. */
                titulo={<Valor tom={c.active ? "neutro" : "atencao"}>{c.name}</Valor>}
                apoio={c.kind === "PRODUTO" ? "Produto" : "Financeiro"}
                badge={
                  <StatusBadge
                    status={c.active ? "active" : "inactive"}
                    label={c.active ? "Ativa" : "Inativa"}
                  />
                }
                acoes={
                  <>
                    <EditCategoryDialog id={c.id} name={c.name} />
                    <form action={toggleCategoryAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button variant="outline" size="sm" type="submit" className="hit-area-44">
                        {c.active ? "Desativar" : "Ativar"}
                      </Button>
                    </form>
                    <DeleteCategoryDialog id={c.id} name={c.name} />
                  </>
                }
              />
            </li>
          ))}
        </ul>
        <div className="hidden md:block">
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
                <TableCell className="font-semibold">{c.name}</TableCell>
                <TableCell>{c.kind === "PRODUTO" ? "Produto" : "Financeiro"}</TableCell>
                <TableCell>
                  <StatusBadge status={c.active ? "active" : "inactive"} label={c.active ? "Ativa" : "Inativa"} />
                </TableCell>
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
        </div>
        </>
        </TableCard>
      )}
    </main>
  );
}
