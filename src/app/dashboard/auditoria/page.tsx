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

      {logs.length === 0 ? (
        <EmptyState
          title="Sem registros"
          description="Ações como criar produto, movimentar estoque e vendas aparecerão aqui."
          icon={ShieldCheck}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{new Date(l.createdAt).toLocaleString("pt-BR")}</TableCell>
                <TableCell>{l.action}</TableCell>
                <TableCell>{l.entity}</TableCell>
                <TableCell>{l.entityId}</TableCell>
                <TableCell>{l.userEmail ?? `#${l.userId ?? "—"}`}</TableCell>
                <TableCell className="max-w-xs truncate">{l.details ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}
