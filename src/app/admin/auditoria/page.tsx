import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableCard } from "@/components/shared/TableCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ScrollText } from "lucide-react";
import { acaoAuditoriaLabel } from "@/lib/labels";
import type { AcaoAuditoria } from "@prisma/client";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";

/** Nome legível da entidade auditada, em vez do nome do model. */
const ENTIDADE: Record<string, string> = {
  Tenant: "Empresa",
  Subscription: "Assinatura",
  Plan: "Plano",
  User: "Usuário",
  Ticket: "Ticket",
  Broadcast: "Comunicação",
  PlatformSettings: "Configurações",
};

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; acao?: string; empresa?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;

  const acoes = Object.keys(acaoAuditoriaLabel) as AcaoAuditoria[];

  const logs = await prisma.platformAuditLog.findMany({
    where: {
      ...(params.acao && acoes.includes(params.acao as AcaoAuditoria)
        ? { action: params.acao as AcaoAuditoria }
        : {}),
      ...(params.empresa ? { tenantId: Number(params.empresa) } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const empresas = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const nomeEmpresa = new Map(empresas.map((e) => [e.id, e.name]));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Auditoria da plataforma"
        badge="Rastreabilidade"
        description="Quem mudou o quê na plataforma, e quando. Não guarda dado operacional das empresas."
      />

      <TableCard
        title="Ações administrativas"
        description="As 200 mais recentes."
        footer={`${logs.length} registro(s)`}
      >
        <AdminFilterBar
          placeholder="Filtrar por autor ou detalhe…"
          chips={acoes.slice(0, 6).map((a) => ({ valor: a, rotulo: acaoAuditoriaLabel[a] }))}
          chipAtivo={params.acao}
          paramChip="acao"
          descricao="Filtrar por tipo de ação"
        />

        {logs.length === 0 ? (
          <EmptyState
            title="Nada registrado"
            description="As ações administrativas aparecem aqui assim que acontecerem."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Alvo</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Detalhe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {l.createdAt.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{acaoAuditoriaLabel[l.action]}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {ENTIDADE[l.entity] ?? l.entity}
                    {l.entityId ? ` #${l.entityId}` : ""}
                  </TableCell>
                  <TableCell className="text-xs">
                    {l.tenantId ? (
                      <Button variant="link" size="sm" asChild className="h-auto p-0">
                        <a href={`/admin/empresas/${l.tenantId}`}>
                          {nomeEmpresa.get(l.tenantId) ?? `Empresa ${l.tenantId}`}
                        </a>
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">Plataforma</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{l.actorEmail}</TableCell>
                  <TableCell className="max-w-md text-xs text-muted-foreground">
                    {l.metadata ? (
                      <details>
                        <summary className="cursor-pointer">ver</summary>
                        <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-[11px] whitespace-pre-wrap">
                          {l.metadata}
                        </pre>
                      </details>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableCard>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ScrollText aria-hidden="true" className="size-3.5" />
        A retenção vem de <code className="rounded bg-muted px-1">auditRetentionDays</code>, nas
        configurações da plataforma.
      </p>
    </main>
  );
}
