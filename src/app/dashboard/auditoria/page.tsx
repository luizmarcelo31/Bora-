import { prisma } from "@/lib/db";
import { requireSessionTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { ReportActions } from "@/components/shared/ReportActions";
import { Badge } from "@/components/ui/badge";
import { auditActionLabel, auditActionVariant, auditEntityLabel } from "@/lib/audit-labels";
import { ShieldCheck } from "lucide-react";

export default async function AuditoriaPage() {
  const { tenant } = await requireSessionTenant("/dashboard/auditoria");

  const logs = await prisma.auditLog.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Auditoria"
        badge={tenant.name}
        description="Últimas 100 ações registradas."
      />
      <ReportActions
        title="Relatório de auditoria (LOG)"
        subtitle={`${tenant.name} — gerado em ${new Date().toLocaleString("pt-BR")}`}
        columns={["Data", "Ação", "Entidade", "ID", "Usuário", "Detalhes"]}
        rows={logs.map((l) => [
          new Date(l.createdAt).toLocaleString("pt-BR"),
          auditActionLabel(l.action),
          auditEntityLabel(l.entity),
          `#${l.entityId}`,
          l.userEmail ?? `#${l.userId ?? "—"}`,
          l.details ?? "—",
        ])}
        fileName={`auditoria-${tenant.id}-${new Date().toISOString().slice(0, 10)}`}
        orientation="landscape"
      />

      {logs.length === 0 ? (
        <EmptyState
          title="Sem registros"
          description="Ações como criar produto, movimentar estoque e vendas aparecerão aqui."
          icon={ShieldCheck}
        />
      ) : (
        <div className="overflow-x-auto"><Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Usuário</TableHead>
                <TableHead className="hidden md:table-cell">Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="tabular-nums">{new Date(l.createdAt).toLocaleString("pt-BR")}</TableCell>
                <TableCell><Badge variant={auditActionVariant(l.action)}>{auditActionLabel(l.action)}</Badge></TableCell>
                <TableCell><Badge variant="outline">{auditEntityLabel(l.entity)}</Badge></TableCell>
                <TableCell className="tabular-nums">#{l.entityId}</TableCell>
                <TableCell>{l.userEmail ?? `#${l.userId ?? "—"}`}</TableCell>
                <TableCell className="hidden max-w-xs truncate md:table-cell">{l.details ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      )}
    </main>
  );
}
