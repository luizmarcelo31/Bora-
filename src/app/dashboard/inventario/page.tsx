import { prisma } from "@/lib/db";
import { requireSessionTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { StatusBadge } from "@/components/shared/StatusBadge";
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
import { SearchParamToast } from "@/components/shared/SearchParamToast";
import { ClipboardList } from "lucide-react";
import { createInventoryCountAction, finalizeInventoryCountAction } from "./actions";

const ERROR_MSG: Record<string, string> = {
  invalid: "Dados inválidos.",
  fail: "Não foi possível concluir.",
};

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { tenant } = await requireSessionTenant("/dashboard/inventario");
  const params = await searchParams;

  const counts = await prisma.inventoryCount.findMany({
    where: { tenantId: tenant.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Inventário de Estoque"
        badge={tenant.name}
        description="Contagem de estoque cega e registro de avarias/perdas."
      />
      <SearchParamToast okText="Contagem iniciada." errorMap={ERROR_MSG} />

      <Card>
        <CardHeader>
          <CardTitle>Nova Contagem</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInventoryCountAction} className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col gap-1 text-sm w-48">
              Tipo
              <SelectField
                name="type"
                options={[
                  { value: "FULL", label: "Geral (Todos os produtos)" },
                  { value: "PARTIAL", label: "Parcial (Por categoria)" },
                ]}
              />
            </label>
            <Button type="submit">Iniciar Contagem</Button>
          </form>
        </CardContent>
      </Card>

      {counts.length === 0 ? (
        <EmptyState title="Nenhum inventário" description="Inicie sua primeira contagem de estoque acima." icon={ClipboardList} />
      ) : (
        <TableCard
          title="Histórico de Inventários"
          description="Contagens de estoque realizadas."
          footer={`${counts.length} registro(s)`}
        >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Itens Auditados</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {counts.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.type === "FULL" ? "Geral" : "Parcial"}</TableCell>
                <TableCell>
                  <StatusBadge status={c.status === "COMPLETED" ? "active" : c.status === "OPEN" ? "pending" : "inactive"} label={c.status} />
                </TableCell>
                <TableCell className="tabular-nums">{c.startedAt.toLocaleString('pt-BR')}</TableCell>
                <TableCell>{c.items.length}</TableCell>
                <TableCell>
                  {c.status === "OPEN" && (
                    <form action={finalizeInventoryCountAction}>
                      <input type="hidden" name="countId" value={c.id} />
                      <Button variant="outline" size="sm" type="submit">Finalizar</Button>
                    </form>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TableCard>
      )}
    </main>
  );
}
