import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { DailySummary } from "@/components/shared/DailySummary";
import { LowStockTable } from "@/app/dashboard/low-stock-table";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { KpiFaixa } from "@/components/shared/MetricCard";
import { Valor } from "@/components/shared/Valor";
import { StatusPill } from "@/components/shared/StatusPill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Building2,
  LifeBuoy,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/validators";
import {
  acaoAuditoriaLabel,
  labelDe,
  statusEmpresaLabel,
  statusEmpresaTom,
  statusTicketLabel,
  statusTicketTom,
  prioridadeTicketTom,
  prioridadeTicketLabel,
} from "@/lib/labels";

const EM_ABERTO = ["ABERTO", "EM_ANALISE", "AGUARDANDO_CLIENTE"] as const;

export default async function AdminHomePage() {
  await requireSuperAdmin();

  const [
    statusEmpresas,
    empresas,
    usuarios,
    produtos,
    vendas,
    assinaturas,
    ticketsAbertosTotal,
    listaTickets,
    ticketsCriticos,
    empresasComMovimento,
    auditoria,
    lowStockItems,
  ] = await Promise.all([
    prisma.tenant.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.product.count(),
    prisma.sale.count({ where: { status: "CONCLUIDA" } }),
    prisma.subscription.findMany({
      where: { status: { in: ["ATIVA", "EXPERIMENTACAO"] } },
      include: { plan: { select: { monthlyPrice: true } } },
    }),
    prisma.ticket.count({ where: { status: { in: [...EM_ABERTO] } } }),
    prisma.ticket.findMany({
      where: { status: { in: [...EM_ABERTO] } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: { tenant: { select: { name: true } } },
    }),
    prisma.ticket.count({
      where: { priority: "CRITICA", status: { in: [...EM_ABERTO] } },
    }),
    prisma.tenant.findMany({
      where: { status: { in: ["ATIVA", "TRIAL"] } },
      orderBy: { lastActivityAt: "desc" },
      take: 5,
      include: { _count: { select: { sales: true } } },
    }),
    prisma.platformAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.inventory.findMany({
      where: { quantity: { lte: 0 } },
      include: { product: { select: { name: true } } },
      take: 10,
    }),
  ]);

  const porStatus = new Map(statusEmpresas.map((e) => [e.status, e._count._all]));
  const ativas = (porStatus.get("ATIVA") ?? 0) + (porStatus.get("TRIAL") ?? 0);
  const mrr = assinaturas.reduce(
    (s, a) =>
      s + (a.billingCycle === "ANUAL" ? Math.round(a.plan.monthlyPrice / 12) : a.plan.monthlyPrice),
    0
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
        <AdminBreadcrumb items={[{ label: "Início", href: "/admin" }, { label: "Visão geral" }]} />
        <DailySummary />
        {lowStockItems.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-2">⚠️ Estoque Crítico</h2>
            <LowStockTable items={lowStockItems} />
          </section>
        )}
        <PageHeader
          title="Visão geral da plataforma"
          badge="Plataforma"
          description="O número que pede ação vem primeiro; o contexto vem depois."
          actions={
            <Button asChild size="sm">
              <Link href="/admin/empresas/nova">Nova empresa</Link>
            </Button>
          }
        />

      {/* Linha 1: o dinheiro e o cliente. */}
      <KpiFaixa
        colunas={4}
        itens={[
          {
            rotulo: "Receita mensal",
            valor: <Valor tom="positivo">{formatCurrency(mrr)}</Valor>,
            apoio: `${assinaturas.length} assinatura(s) em dia`,
          },
          {
            rotulo: "Empresas ativas",
            valor: <Valor tom={ativas > 0 ? "positivo" : "neutro"}>{ativas}</Valor>,
            apoio: `${empresas} no total`,
          },
          {
            rotulo: "Tickets em aberto",
            valor: (
              <Valor tom={ticketsAbertosTotal > 0 ? "atencao" : "neutro"}>
                {ticketsAbertosTotal}
              </Valor>
            ),
            apoio: ticketsCriticos > 0 ? `${ticketsCriticos} crítico(s)` : "Nenhum crítico",
          },
          {
            rotulo: "Vendas concluídas",
            valor: <Valor tom="neutro">{vendas}</Valor>,
            apoio: "Somadas de todas as empresas",
          },
        ]}
      />

      {/* Linha 2: o que precisa de ação hoje. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <LifeBuoy aria-hidden="true" className="size-4" />
                Tickets que precisam de você
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/suporte">Ver todos</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {listaTickets.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum ticket em aberto. Tudo resolvido.
              </p>
            ) : (
              <ul className="divide-y">
                {listaTickets.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.tenant.name} · {t.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <StatusPill tom={prioridadeTicketTom[t.priority]}>
                        {labelDe(prioridadeTicketLabel, t.priority)}
                      </StatusPill>
                      <StatusPill tom={statusTicketTom[t.status]}>
                        {labelDe(statusTicketLabel, t.status)}
                      </StatusPill>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity aria-hidden="true" className="size-4" />
                Ações administrativas recentes
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/auditoria">Ver auditoria</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditoria.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma ação registrada ainda.
              </p>
            ) : (
              <ul className="divide-y">
                {auditoria.map((a) => (
                  <li key={a.id} className="py-2.5 text-sm">
                    <p className="font-semibold">{labelDe(acaoAuditoriaLabel, a.action)}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.actorEmail} · {a.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linha 3: quem são meus clientes. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 aria-hidden="true" className="size-4" />
                Empresas por situação
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/empresas">Gerenciar</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {statusEmpresas.map((s) => (
                <li key={s.status} className="flex items-center justify-between py-2.5 text-sm">
                  <StatusPill tom={statusEmpresaTom[s.status]}>
                    {labelDe(statusEmpresaLabel, s.status)}
                  </StatusPill>
                  <span className="tabular-nums text-muted-foreground">
                    {s._count._all} empresa(s)
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users aria-hidden="true" className="size-4" />
              Empresas com mais movimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {empresasComMovimento.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma empresa ativa ainda.
              </p>
            ) : (
              <ul className="divide-y">
                {empresasComMovimento.map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-2.5 text-sm">
                    <Link
                      prefetch={false}
                      href={`/admin/empresas/${e.id}`}
                      className="truncate font-semibold hover:underline"
                    >
                      {e.name}
                    </Link>
                    <span className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ShoppingCart aria-hidden="true" className="size-3" />
                        {e._count.sales}
                      </span>
                      <StatusPill tom={statusEmpresaTom[e.status]}>
                        {labelDe(statusEmpresaLabel, e.status)}
                      </StatusPill>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Package aria-hidden="true" className="size-3.5" />
        {produtos.toLocaleString("pt-BR")} produto(s) no catálogo de todas as empresas ·{" "}
        {usuarios.toLocaleString("pt-BR")} usuário(s) cadastrado(s)
      </p>
    </main>
  );
}
