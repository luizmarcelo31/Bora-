import { prisma } from "@/lib/db";
import { requireSessionTenant } from "@/lib/tenant";
import { tipoInventarioLabel } from "@/lib/labels";
import { PageHeader } from "@/components/shared/PageHeader";
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

export default async function InventarioPage() {
  const { tenant } = await requireSessionTenant("/dashboard/inventario");

  const counts = await prisma.inventoryCount.findMany({
    where: { tenantId: tenant.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
      <PageHeader
        title="Inventário de Estoque"
        badge={tenant.name}
        description="Contagem de estoque cega e registro de avarias/perdas."
      />
      <SearchParamToast okText="Contagem iniciada." errorMap={ERROR_MSG} />

      <details className="rounded-xl border border-border/50 bg-card shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          Nova Contagem
          <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">+ Expandir</span>
        </summary>
        <div className="px-4 pb-4">
          <form action={createInventoryCountAction} className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col gap-1 text-sm w-48">
              Tipo
              <SelectField
                name="type"
                options={[
                  { value: "FULL", label: "Geral (Todos os produtos)" },
                  { value: "PARCIAL", label: "Parcial (Por categoria)" },
                ]}
              />
            </label>
            <Button type="submit">Iniciar Contagem</Button>
          </form>
        </div>
      </details>

      {counts.length === 0 ? (
        <EmptyState title="Nenhum inventário" description="Inicie sua primeira contagem de estoque acima." icon={ClipboardList} />
      ) : (
        <TableCard
          title="Histórico de Inventários"
          description="Contagens de estoque realizadas."
          footer={`${counts.length} registro(s)`}
        >
        {/* Mobile: lista compacta (skill §8) — tabela só no desktop */}
        <ul className="flex flex-col gap-2 p-3 md:hidden">
          {counts.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{tipoInventarioLabel[c.type]}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {c.startedAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} · {c.items.length} {c.items.length === 1 ? "item" : "itens"}
                </span>
              </div>
              <StatusBadge status={c.status === "CONCLUIDO" ? "active" : c.status === "ABERTO" ? "pending" : "inactive"} label={c.status} />
              {c.status === "ABERTO" && (
                <form action={finalizeInventoryCountAction} className="shrink-0">
                  <input type="hidden" name="countId" value={c.id} />
                  <Button variant="outline" size="sm" type="submit" className="hit-area-44">Finalizar</Button>
                </form>
              )}
            </li>
          ))}
        </ul>
        <div className="hidden md:block">
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
                <TableCell className="font-semibold">{tipoInventarioLabel[c.type]}</TableCell>
                <TableCell>
                  <StatusBadge status={c.status === "CONCLUIDO" ? "active" : c.status === "ABERTO" ? "pending" : "inactive"} label={c.status} />
                </TableCell>
                <TableCell className="tabular-nums">{c.startedAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</TableCell>
                <TableCell>{c.items.length}</TableCell>
                <TableCell>
                  {c.status === "ABERTO" && (
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
        </div>
        </TableCard>
      )}
    </main>
  );
}
