import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { DailySummary } from "@/components/shared/DailySummary";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { KpiFaixa } from "@/components/shared/MetricCard";
import { Valor } from "@/components/shared/Valor";
import { StatusPill } from "@/components/shared/StatusPill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Building2,
  Clock,
  LifeBuoy,
  Package,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/validators";
import { dataRelativaCurta } from "@/lib/tempo";
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

// `Date.now()` lido uma vez no módulo, não no render: o React Compiler trata
// impureza em render como erro, e o mesmo padrão já é usado em `/admin/saude`.
const AGORA = Date.now();
const USO_RECENTE_MS = 7 * 86_400_000;

export default async function AdminHomePage() {
  await requireSuperAdmin();

  const [
    statusEmpresas,
    empresas,
    usuarios,
    assinaturas,
    ticketsAbertosTotal,
    listaTickets,
    ticketsCriticos,
    empresasComUso,
    auditoria,
  ] = await Promise.all([
    prisma.tenant.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.tenant.count(),
    prisma.user.count(),
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
    // "Com mais uso" = quem usou mais recentemente. Antes esta lista era
    // ordenada por `lastActivityAt` (que nunca era atualizado depois da
    // criação) e exibia a contagem de vendas — duas coisas erradas: a ordem era
    // por data de cadastro e o número expunha o movimento do cliente. Ver
    // `docs/PRIVACIDADE-PLATAFORMA.md`.
    prisma.tenant.findMany({
      where: { status: { in: ["ATIVA", "TRIAL"] } },
      orderBy: { lastActivityAt: "desc" },
      take: 5,
      select: { id: true, name: true, lastActivityAt: true },
    }),
    prisma.platformAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const porStatus = new Map(statusEmpresas.map((e) => [e.status, e._count._all]));
  const ativas = (porStatus.get("ATIVA") ?? 0) + (porStatus.get("TRIAL") ?? 0);
  // "Uso recente" = alguém entrou ou vendeu nos últimos 7 dias. Usa o mesmo
  // sinal da tela de saúde, para os dois painéis contarem a mesma história.
  const ativasComUso = empresasComUso.filter(
    (e) => e.lastActivityAt && AGORA - e.lastActivityAt.getTime() < USO_RECENTE_MS
  ).length;
  const mrr = assinaturas.reduce(
    (s, a) =>
      s + (a.billingCycle === "ANUAL" ? Math.round(a.plan.monthlyPrice / 12) : a.plan.monthlyPrice),
    0
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
        <AdminBreadcrumb items={[{ label: "Início", href: "/admin" }, { label: "Visão geral" }]} />
        <DailySummary />
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
            // Substitui o antigo "Vendas concluídas". A pergunta que um
            // investidor faz é "isso está sendo usado?", e a resposta honesta
            // não é quantas vendas existem — é quantas empresas entram no
            // produto. Vendas são dado do cliente.
            rotulo: "Empresas com uso recente",
            valor: <Valor tom={ativasComUso > 0 ? "positivo" : "neutro"}>{ativasComUso}</Valor>,
            apoio: "Ativas nos últimos 7 dias",
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
              Empresas com uso mais recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {empresasComUso.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma empresa ativa ainda.
              </p>
            ) : (
              <ul className="divide-y">
                {empresasComUso.map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-2.5 text-sm">
                    <Link
                      prefetch={false}
                      href={`/admin/empresas/${e.id}`}
                      className="truncate font-semibold hover:underline"
                    >
                      {e.name}
                    </Link>
                    <span className="flex items-center gap-3 text-xs text-muted-foreground">
                      {/* Quando, não quanto. "Vendeu 340" é dado do cliente;
                          "entrou há 2 horas" é sinal de produto. */}
                      <span className="flex items-center gap-1">
                        <Clock aria-hidden="true" className="size-3" />
                        {e.lastActivityAt ? dataRelativaCurta(e.lastActivityAt) : "sem registro"}
                      </span>
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
        {usuarios.toLocaleString("pt-BR")} usuário(s) cadastrado(s)
      </p>
    </main>
  );
}
