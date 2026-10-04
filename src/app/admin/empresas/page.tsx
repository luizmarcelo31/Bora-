import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { TableCard } from "@/components/shared/TableCard";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { EmptyState } from "@/components/shared/EmptyState";
import { Valor } from "@/components/shared/Valor";
import { LinhaLista } from "@/components/shared/LinhaLista";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Building2, Users, ShoppingCart, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/validators";
import { dataRelativaCurta } from "@/lib/tempo";
import { calcularMRR } from "@/lib/plataforma";
import {
  LABELS,
  labelDe,
  statusEmpresaLabel,
  statusEmpresaTom,
  statusSaudeLabel,
  statusSaudeTom,
} from "@/lib/labels";
import type { StatusEmpresa, StatusSaude } from "@prisma/client";

const POR_PAGINA = 20;

/** Só aceitos como filtro valores que existem no enum — query string é entrada externa. */
function statusValido(v: string | undefined): StatusEmpresa | undefined {
  return v && v in LABELS.statusEmpresa ? (v as StatusEmpresa) : undefined;
}

function saudeValida(v: string | undefined): StatusSaude | undefined {
  return v && v in LABELS.statusSaude ? (v as StatusSaude) : undefined;
}

const FILTROS: { valor: StatusEmpresa; rotulo: string }[] = [
  { valor: "ATIVA", rotulo: "Ativas" },
  { valor: "TRIAL", rotulo: "Em experimentação" },
  { valor: "SUSPENSA", rotulo: "Suspensas" },
  { valor: "CANCELADA", rotulo: "Canceladas" },
  { valor: "ARQUIVADA", rotulo: "Arquivadas" },
];

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; saude?: string; pagina?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;

  const q = (params.q ?? "").trim();
  const status = statusValido(params.status);
  const saude = saudeValida(params.saude);
  const pagina = Math.max(1, Number(params.pagina ?? 1) || 1);

  const where = {
    ...(status ? { status } : {}),
    ...(saude ? { health: saude } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  // Contagens, página e MRR saem em paralelo: não há dependência entre eles.
  const [total, paginaAtual, contagens, assinaturasAtivas] = await Promise.all([
    prisma.tenant.count({ where }),
    prisma.tenant.findMany({
      where,
      orderBy: [{ status: "asc" }, { name: "asc" }],
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      include: {
        // Só `users` e `tickets`. `sales` e `products` saíram: contagem de venda
        // e tamanho de catálogo são dado do cliente, e a plataforma não precisa
        // deles para decidir nada. `users` continua porque é o que sustenta a
        // cobrança do limite de plano.
        _count: { select: { users: true, tickets: true } },
        subscription: { include: { plan: { select: { name: true, monthlyPrice: true } } } },
      },
    }),
    prisma.tenant.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.subscription.findMany({
      where: { status: { in: ["ATIVA", "EXPERIMENTACAO"] } },
      include: { plan: { select: { monthlyPrice: true } } },
    }),
  ]);

  const porStatus = new Map(contagens.map((c) => [c.status, c._count._all]));
  const totalEmpresas = contagens.reduce((s, c) => s + c._count._all, 0);
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  // MRR normaliza o plano anual para o mês, senão a métrica mente.
  const mrr = calcularMRR(
    assinaturasAtivas.map((a) => ({
      billingCycle: a.billingCycle,
      monthlyPrice: a.plan.monthlyPrice,
    }))
  );

  // Preserva os filtros ativos ao trocar de página.
  const comQuery = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    if (saude) sp.set("saude", saude);
    if (p > 1) sp.set("pagina", String(p));
    const s = sp.toString();
    return s ? `?${s}` : "";
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
      <AdminBreadcrumb items={[{ label: "Início", href: "/admin" }, { label: "Visão geral" }]} />
        <PageHeader
        title="Empresas"
        badge="Plataforma"
        description="Cada empresa é um cliente da plataforma, com dados, usuários e assinatura isolados."
        actions={
          <Button asChild>
            <Link href="/admin/empresas/nova">Nova empresa</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Empresas"
          value={String(totalEmpresas)}
          hint="Todas as situações, sem filtro"
          icon={Building2}
        />
        <MetricCard
          title="Ativas"
          value={String((porStatus.get("ATIVA") ?? 0) + (porStatus.get("TRIAL") ?? 0))}
          hint="Em uso ou em experimentação"
          icon={Users}
        />
        <MetricCard
          title="Precisam de atenção"
          value={
            <Valor tom="negativo">
              {(porStatus.get("SUSPENSA") ?? 0) + (porStatus.get("CANCELADA") ?? 0)}
            </Valor>
          }
          hint="Suspensas ou canceladas"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Receita mensal"
          value={<Valor tom="positivo">{formatCurrency(mrr)}</Valor>}
          hint="Planos ativos e em experimentação"
          icon={ShoppingCart}
        />
      </div>

      <TableCard
        title="Empresas cadastradas"
        description="Clique no nome para abrir o painel completo da empresa."
        footer={
          total === 0
            ? undefined
            : `Mostrando ${(pagina - 1) * POR_PAGINA + 1}–${Math.min(
                pagina * POR_PAGINA,
                total
              )} de ${total}`
        }
      >
        <AdminFilterBar
          placeholder="Buscar por nome ou email…"
          chips={FILTROS.map((f) => ({ valor: f.valor, rotulo: f.rotulo }))}
          chipAtivo={status}
          descricao="Filtrar por situação da empresa"
        />

        {paginaAtual.length === 0 ? (
          <EmptyState
            title="Nenhuma empresa encontrada"
            description="Ajuste os filtros ou cadastre a primeira empresa."
          />
        ) : (
          <>
          {/* Mobile: lista compacta — tabela só no desktop */}
          <ul className="flex flex-col gap-2 p-3 md:hidden">
            {paginaAtual.map((t) => (
              <li key={t.id}>
                <LinhaLista
                  titulo={
                    <Link
                      prefetch={false}
                      href={`/admin/empresas/${t.id}`}
                      className="hover:underline"
                    >
                      {t.name}
                    </Link>
                  }
                  apoio={`${t._count.users} usuário(s) · ${dataRelativaCurta(t.lastActivityAt)}`}
                  badge={
                    <StatusPill tom={statusEmpresaTom[t.status]}>
                      {labelDe(statusEmpresaLabel, t.status)}
                    </StatusPill>
                  }
                  valor={
                    t.subscription ? (
                      <Valor tom="positivo" className="text-xs font-normal">
                        {formatCurrency(t.subscription.plan.monthlyPrice)}/mês
                      </Valor>
                    ) : (
                      <span className="text-xs font-normal text-muted-foreground">Sem plano</span>
                    )
                  }
                />
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Saúde</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="text-right">Usuários</TableHead>
                <TableHead className="text-right">Último uso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginaAtual.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Link
                      prefetch={false}
                      href={`/admin/empresas/${t.id}`}
                      className="font-semibold hover:underline"
                    >
                      {t.name}
                    </Link>
                    {t.email ? (
                      <p className="text-xs text-muted-foreground">{t.email}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <StatusPill tom={statusEmpresaTom[t.status]}>
                      {labelDe(statusEmpresaLabel, t.status)}
                    </StatusPill>
                  </TableCell>
                  <TableCell>
                    <StatusPill tom={statusSaudeTom[t.health]}>
                      {labelDe(statusSaudeLabel, t.health)}
                    </StatusPill>
                  </TableCell>
                  <TableCell>
                    {t.subscription ? (
                      <>
                        {t.subscription.plan.name}
                        <p className="text-xs">
                          <Valor tom="positivo">
                            {formatCurrency(t.subscription.plan.monthlyPrice)}/mês
                          </Valor>
                        </p>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Sem plano</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{t._count.users}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {dataRelativaCurta(t.lastActivityAt)}
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
                <Link href={`/admin/empresas${comQuery(pagina - 1)}`}>Anterior</Link>
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
                <Link href={`/admin/empresas${comQuery(pagina + 1)}`}>Próxima</Link>
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



