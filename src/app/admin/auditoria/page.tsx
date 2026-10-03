import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableCard } from "@/components/shared/TableCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinhaLista } from "@/components/shared/LinhaLista";
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

/**
 * Tom do selo por ação. Mesma semântica de `auditActionVariant` (que atende o
 * enum de operação, em inglês minúsculo) traduzida para o enum de plataforma:
 * criação e envio abrem, arquivamento e desativação fecham, o resto é neutro.
 */
const VARIANTE: Record<AcaoAuditoria, "default" | "secondary" | "destructive"> = {
  EMPRESA_CRIADA: "default",
  EMPRESA_STATUS_ALTERADO: "secondary",
  EMPRESA_ARQUIVADA: "destructive",
  ASSINATURA_ALTERADA: "secondary",
  PLANO_ALTERADO: "secondary",
  USUARIO_CRIADO: "default",
  USUARIO_ALTERADO: "secondary",
  USUARIO_DESATIVADO: "destructive",
  FUNCAO_ALTERADA: "secondary",
  TICKET_ALTERADO: "secondary",
  COMUNICACAO_ENVIADA: "default",
  CONFIGURACAO_ALTERADA: "secondary",
};

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; acao?: string; empresa?: string; pagina?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;

  const acoes = Object.keys(acaoAuditoriaLabel) as AcaoAuditoria[];
  const q = (params.q ?? "").trim();
  const pagina = Math.max(1, Number(params.pagina ?? 1) || 1);
  const POR_PAGINA = 50;

  const where = {
    ...(params.acao && acoes.includes(params.acao as AcaoAuditoria)
      ? { action: params.acao as AcaoAuditoria }
      : {}),
    ...(params.empresa ? { tenantId: Number(params.empresa) } : {}),
    ...(q
      ? {
          OR: [
            { actorEmail: { contains: q, mode: "insensitive" as const } },
            { metadata: { contains: q, mode: "insensitive" as const } },
            { entity: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.platformAuditLog.count({ where }),
    prisma.platformAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
  ]);
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  const empresas = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const nomeEmpresa = new Map(empresas.map((e) => [e.id, e.name]));

  const comQuery = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (params.acao) sp.set("acao", params.acao);
    if (params.empresa) sp.set("empresa", params.empresa);
    if (p > 1) sp.set("pagina", String(p));
    const s = sp.toString();
    return s ? `?${s}` : "";
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
      <PageHeader
        title="Auditoria da plataforma"
        badge="Rastreabilidade"
        description="Quem mudou o quê na plataforma, e quando. Não guarda dado operacional das empresas."
      />

      <TableCard
        title="Ações administrativas"
        description={
          total === 0
            ? "Nenhum registro no filtro atual."
            : `Página ${pagina} de ${totalPaginas} · ${total} registro(s).`
        }
        footer={
          total === 0
            ? undefined
            : `Mostrando ${(pagina - 1) * POR_PAGINA + 1}–${Math.min(pagina * POR_PAGINA, total)} de ${total}`
        }
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
          <>
          {/* Mobile: lista compacta — tabela só no desktop */}
          <ul className="flex flex-col gap-2 p-3 md:hidden">
            {logs.map((l) => (
              <li key={l.id}>
                <LinhaLista
                  titulo={`${acaoAuditoriaLabel[l.action]} · ${ENTIDADE[l.entity] ?? l.entity}${l.entityId ? ` #${l.entityId}` : ""}`}
                  apoio={`${l.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · ${l.actorEmail}`}
                  badges={
                    <>
                      <Badge variant={VARIANTE[l.action]}>
                        {acaoAuditoriaLabel[l.action]}
                      </Badge>
                      {l.tenantId ? (
                        <Badge variant="outline" asChild>
                          <a href={`/admin/empresas/${l.tenantId}`}>
                            {nomeEmpresa.get(l.tenantId) ?? `Empresa ${l.tenantId}`}
                          </a>
                        </Badge>
                      ) : (
                        <Badge variant="outline">Plataforma</Badge>
                      )}
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
                    {l.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
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
          </div>
          </>
        )}

        {totalPaginas > 1 ? (
          <nav aria-label="Paginação" className="flex items-center justify-end gap-2 px-1">
            {pagina > 1 ? (
              <Button variant="outline" size="sm" asChild>
                <a href={`/admin/auditoria${comQuery(pagina - 1)}`}>Anterior</a>
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
                <a href={`/admin/auditoria${comQuery(pagina + 1)}`}>Próxima</a>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Próxima
              </Button>
            )}
          </nav>
        ) : null}
      </TableCard>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ScrollText aria-hidden="true" className="size-3.5" />
        A retenção vem de <code className="rounded bg-muted px-1">auditRetentionDays</code>, nas
        configurações da plataforma.
      </p>
    </main>
  );
}
