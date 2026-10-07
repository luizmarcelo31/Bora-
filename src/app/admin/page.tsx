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

      {/* KPIs: hierarquia clara, valores tabulares, apoio menor e silencioso. */}
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
            rotulo: "Empresas com uso recente",
            valor: <Valor tom={ativasComUso > 0 ? "positivo" : "neutro"}>{ativasComUso}</Valor>,
            apoio: "Ativas nos últimos 7 dias",
          },
        ]}
      />


      {/* Painéis: 2 colunas desktop, 1 coluna mobile. Cards com bordas sutis, sem sombras agressivas. */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Tickets que precisam de ação */}
        <section aria-labelledby="tickets-aria">
          <div className="flex items-center justify-between gap-2">
            <h2 id="tickets-aria" className="flex items-center gap-2 text-base font-semibold">
              <LifeBuoy aria-hidden="true" className="size-4" />
              Ações hoje
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/suporte">Ver todos</Link>
            </Button>
          </div>
          <div className="mt-3 rounded-xl border border-border bg-card p-3 shadow-sm dark:border-border dark:bg-card">
            {listaTickets.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum ticket em aberto. Tudo resolvido.
              </p>
            ) : (
              <ul className="divide-y">
                {listaTickets.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 first:rounded-t-xl" style={{ borderTop: "1px solid var(--border)" }}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{t.subject}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
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
          </div>
        </section>

        {/* Auditoria recente */}
        <section aria-labelledby="auditoria-aria">
          <div className="flex items-center justify-between gap-2">
            <h2 id="auditoria-aria" className="flex items-center gap-2 text-base font-semibold">
              <Activity aria-hidden="true" className="size-4" />
              Ações recentes
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/auditoria">Ver auditoria</Link>
            </Button>
          </div>
          <div className="mt-3 rounded-xl border border-border bg-card p-3 shadow-sm dark:border-border dark:bg-card">
            {auditoria.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma ação registrada ainda.
              </p>
            ) : (
              <ul className="divide-y">
                {auditoria.map((a) => (
                  <li key={a.id} className="py-2.5 first:rounded-t-xl" style={{ borderTop: "1px solid var(--border)" }}>
                    <p className="text-sm font-semibold text-foreground">
                      {labelDe(acaoAuditoriaLabel, a.action)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.actorEmail} · {a.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Clientes: empresas ativas, com uso recente. 2 colunas desktop, 1 coluna mobile. */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Empresas por situação */}
        <section aria-labelledby="situacao-aria">
          <div className="flex items-center justify-between gap-2">
            <h2 id="situacao-aria" className="flex items-center gap-2 text-base font-semibold">
              <Building2 aria-hidden="true" className="size-4" />
              Situação das empresas
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/empresas">Gerenciar</Link>
            </Button>
          </div>
          <div className="mt-3 rounded-xl border border-border bg-card p-3 shadow-sm dark:border-border dark:bg-card">
            <ul className="divide-y">
              {statusEmpresas.map((s) => (
                <li key={s.status} className="flex items-center justify-between py-2.5 first:rounded-t-xl" style={{ borderTop: "1px solid var(--border)" }}>
                  <StatusPill tom={statusEmpresaTom[s.status]}>
                    {labelDe(statusEmpresaLabel, s.status)}
                  </StatusPill>
                  <span className="tabular-nums text-sm text-muted-foreground">
                    {s._count._all} empresa(s)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Empresas com uso mais recente */}
        <section aria-labelledby="uso-aria">
          <div className="flex items-center justify-between gap-2">
            <h2 id="uso-aria" className="flex items-center gap-2 text-base font-semibold">
              <Users aria-hidden="true" className="size-4" />
              Mais recente
            </h2>
          </div>
          <div className="mt-3 rounded-xl border border-border bg-card p-3 shadow-sm dark:border-border dark:bg-card">
            {empresasComUso.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma empresa ativa ainda.
              </p>
            ) : (
              <ul className="divide-y">
                {empresasComUso.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 first:rounded-t-xl" style={{ borderTop: "1px solid var(--border)" }}>
                    <Link
                      prefetch={false}
                      href={`/admin/empresas/${e.id}`}
                      className="min-w-0 truncate text-sm font-semibold text-foreground hover:underline"
                    >
                      {e.name}
                    </Link>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                      <Clock aria-hidden="true" className="size-3" />
                      {e.lastActivityAt ? dataRelativaCurta(e.lastActivityAt) : "sem registro"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
