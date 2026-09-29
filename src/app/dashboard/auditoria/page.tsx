import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSessionTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableCard } from "@/components/shared/TableCard";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AUDIT_ACTION_LABELS,
  auditActionLabel,
  auditActionVariant,
  auditEntityLabel,
} from "@/lib/audit-labels";
import { ShieldCheck } from "lucide-react";

const POR_PAGINA = 50;

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; acao?: string; pagina?: string }>;
}) {
  const { tenant } = await requireSessionTenant("/dashboard/auditoria");
  const params = await searchParams;

  const q = (params.q ?? "").trim();
  const acao = params.acao && params.acao in AUDIT_ACTION_LABELS ? params.acao : undefined;
  const pagina = Math.max(1, Number(params.pagina ?? 1) || 1);

  const where = {
    tenantId: tenant.id,
    ...(acao ? { action: acao } : {}),
    ...(q
      ? {
          OR: [
            { details: { contains: q, mode: "insensitive" as const } },
            { userEmail: { contains: q, mode: "insensitive" as const } },
            { entity: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  const comQuery = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (acao) sp.set("acao", acao);
    if (p > 1) sp.set("pagina", String(p));
    const s = sp.toString();
    return s ? `?${s}` : "";
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Auditoria"
        badge={tenant.name}
        description={
          total === 0
            ? "Ações registradas da empresa."
            : `${total} ação(ões) no filtro atual.`
        }
      />
      <ReportActions
        title="Relatório de auditoria (LOG)"
        subtitle={`${tenant.name} — gerado em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · página ${pagina} de ${totalPaginas}`}
        columns={["Data", "Ação", "Entidade", "ID", "Usuário", "Detalhes"]}
        rows={logs.map((l) => [
          new Date(l.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
          auditActionLabel(l.action),
          auditEntityLabel(l.entity),
          `#${l.entityId}`,
          l.userEmail ?? `#${l.userId ?? "—"}`,
          l.details ?? "—",
        ])}
        fileName={`auditoria-${tenant.id}-${new Date().toISOString().slice(0, 10)}-p${pagina}`}
        orientation="landscape"
      />

      <TableCard
        title="Ações registradas"
        description="Fonte servidor, com filtro e paginação."
        footer={
          total === 0
            ? undefined
            : `Mostrando ${(pagina - 1) * POR_PAGINA + 1}–${Math.min(pagina * POR_PAGINA, total)} de ${total}`
        }
      >
        <form className="flex flex-wrap items-end gap-3 py-3" action="/dashboard/auditoria" method="get">
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-sm sm:max-w-xs">
            Buscar
            <Input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Usuário, detalhe ou entidade…"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Ação
            <select
              name="acao"
              defaultValue={acao ?? ""}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Todas</option>
              {Object.entries(AUDIT_ACTION_LABELS).map(([v, rotulo]) => (
                <option key={v} value={v}>
                  {rotulo}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">Filtrar</Button>
          {q || acao ? (
            <Button variant="ghost" asChild>
              <Link href="/dashboard/auditoria">Limpar</Link>
            </Button>
          ) : null}
        </form>

        {logs.length === 0 ? (
          <EmptyState
            title="Sem registros"
            description="Ações como criar produto, movimentar estoque e vendas aparecerão aqui."
            icon={ShieldCheck}
          />
        ) : (
          <>
          {/* Mobile: lista compacta (skill §8) — tabela só no desktop */}
          <ul className="flex flex-col gap-2 p-3 md:hidden">
            {logs.map((l) => (
              <li key={l.id} className="flex items-center gap-2 rounded-lg border p-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-sm font-semibold">
                    {auditActionLabel(l.action)} · {auditEntityLabel(l.entity)} #{l.entityId}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {new Date(l.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · {l.userEmail ?? `#${l.userId ?? "—"}`}
                  </span>
                </div>
                <Badge variant={auditActionVariant(l.action)} className="shrink-0">{auditActionLabel(l.action)}</Badge>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
          <Table>
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
                  <TableCell className="tabular-nums">{new Date(l.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</TableCell>
                  <TableCell><Badge variant={auditActionVariant(l.action)}>{auditActionLabel(l.action)}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{auditEntityLabel(l.entity)}</Badge></TableCell>
                  <TableCell className="tabular-nums">#{l.entityId}</TableCell>
                  <TableCell>{l.userEmail ?? `#${l.userId ?? "—"}`}</TableCell>
                  <TableCell className="hidden max-w-xs truncate md:table-cell">{l.details ?? "—"}</TableCell>
                </TableRow>
              ))}
              </TableBody>
          </Table>
          </div>
          </>
        )}

        {totalPaginas > 1 ? (
          <nav aria-label="Paginação" className="flex items-center justify-end gap-2 px-1">
            {pagina > 1 ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/auditoria${comQuery(pagina - 1)}`}>Anterior</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
            )}
            <span className="text-xs text-muted-foreground tabular-nums">
              {pagina} de {totalPaginas}
            </span>
            {pagina < totalPaginas ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/auditoria${comQuery(pagina + 1)}`}>Próxima</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Próxima
              </Button>
            )}
          </nav>
        ) : null}
      </TableCard>
    </main>
  );
}
