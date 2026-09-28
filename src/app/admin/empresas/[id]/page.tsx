import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCard } from "@/components/shared/TableCard";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Activity,
  ArrowLeft,
  LifeBuoy,
  Package,
  Receipt,
  ShoppingCart,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/validators";
import {
  cicloCobrancaLabel,
  labelDe,
  statusAssinaturaLabel,
  statusAssinaturaTom,
  statusEmpresaLabel,
  statusEmpresaTom,
  statusSaudeLabel,
  statusSaudeTom,
  statusTicketLabel,
  statusTicketTom,
  acaoAuditoriaLabel,
} from "@/lib/labels";
import type { StatusEmpresa } from "@prisma/client";
import { alterarStatusEmpresaAction } from "../actions";
import { MENSAGEM_EMPRESA } from "../mensagens";

/** Ações oferecidas a partir do estado atual, respeitando a máquina de estados. */
const PROXIMOS: Record<StatusEmpresa, { status: StatusEmpresa; rotulo: string; destrutivo?: boolean }[]> = {
  TRIAL: [
    { status: "ATIVA", rotulo: "Ativar agora" },
    { status: "SUSPENSA", rotulo: "Suspender", destrutivo: true },
  ],
  ATIVA: [
    { status: "SUSPENSA", rotulo: "Suspender", destrutivo: true },
    { status: "CANCELADA", rotulo: "Cancelar assinatura", destrutivo: true },
  ],
  SUSPENSA: [
    { status: "ATIVA", rotulo: "Reativar" },
    { status: "CANCELADA", rotulo: "Cancelar assinatura", destrutivo: true },
  ],
  CANCELADA: [
    { status: "ATIVA", rotulo: "Reativar" },
    { status: "ARQUIVADA", rotulo: "Arquivar", destrutivo: true },
  ],
  ARQUIVADA: [],
};

function dataRelativa(d: Date | null): string {
  if (!d) return "Nunca";
  const dias = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (dias <= 0) return "Hoje";
  if (dias === 1) return "Ontem";
  if (dias < 30) return `Há ${dias} dias`;
  const meses = Math.floor(dias / 30);
  return `Há ${meses} ${meses === 1 ? "mês" : "meses"}`;
}

export default async function EmpresaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const empresaId = Number(id);
  if (!Number.isInteger(empresaId) || empresaId <= 0) notFound();

  const empresa = await prisma.tenant.findUnique({
    where: { id: empresaId },
    include: {
      subscription: { include: { plan: true } },
      _count: { select: { users: true, products: true, sales: true, tickets: true } },
    },
  });
  if (!empresa) notFound();

  // Atividade e auditoria são o contexto de um chamado: quem mexeu e quando.
  const [vendas, tickets, auditoria, ultimoLogin] = await Promise.all([
    prisma.sale.findMany({
      where: { tenantId: empresaId, status: "CONCLUIDA" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, total: true, createdAt: true },
    }),
    prisma.ticket.findMany({
      where: { tenantId: empresaId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.platformAuditLog.findMany({
      where: { tenantId: empresaId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.user.findFirst({
      where: { tenantId: empresaId, lastLogin: { not: null } },
      orderBy: { lastLogin: "desc" },
      select: { lastLogin: true },
    }),
  ]);

  const totalVendas = await prisma.sale.aggregate({
    where: { tenantId: empresaId, status: "CONCLUIDA" },
    _sum: { total: true },
  });

  const erro = sp.error ? MENSAGEM_EMPRESA[sp.error as keyof typeof MENSAGEM_EMPRESA] : null;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title={empresa.name}
        badge="Empresa"
        description={empresa.email ?? "Sem email de contato cadastrado."}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/empresas">
              <ArrowLeft aria-hidden="true" className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tom={statusEmpresaTom[empresa.status]}>
          {labelDe(statusEmpresaLabel, empresa.status)}
        </StatusPill>
        <StatusPill tom={statusSaudeTom[empresa.health]}>
          {labelDe(statusSaudeLabel, empresa.health)}
        </StatusPill>
        {empresa.subscription ? (
          <StatusPill tom={statusAssinaturaTom[empresa.subscription.status]}>
            {empresa.subscription.plan.name} · {labelDe(statusAssinaturaLabel, empresa.subscription.status)}
          </StatusPill>
        ) : (
          <StatusPill tom="neutro">Sem plano</StatusPill>
        )}
      </div>

      {erro ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Usuários" value={String(empresa._count.users)} hint="Contas vinculadas" icon={Users} />
        <MetricCard title="Produtos" value={String(empresa._count.products)} hint="Itens no catálogo" icon={Package} />
        <MetricCard
          title="Vendas concluídas"
          value={String(empresa._count.sales)}
          hint={formatCurrency(totalVendas._sum.total ?? 0)}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Tickets"
          value={String(empresa._count.tickets)}
          hint={`Último acesso: ${dataRelativa(ultimoLogin?.lastLogin ?? empresa.lastActivityAt)}`}
          icon={LifeBuoy}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Assinatura */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {empresa.subscription ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plano</span>
                  <span className="font-semibold">{empresa.subscription.plan.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cobrança</span>
                  <span>{cicloCobrancaLabel[empresa.subscription.billingCycle]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Preço</span>
<span className="font-semibold">
                     {formatCurrency(empresa.subscription.plan.monthlyPrice)}/mês
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Renova em</span>
                  <span>
                    {empresa.subscription.renewsAt.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {empresa.subscription.plan.maxUsers ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Limite de usuários</span>
                    <span>{empresa.subscription.plan.maxUsers}</span>
                  </div>
                ) : null}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/admin/assinaturas">Gerenciar assinaturas</Link>
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">
                Esta empresa não tem plano vinculado.{" "}
                <Link href="/admin/planos" className="underline">
                  Ver planos
                </Link>
              </p>
            )}
            {empresa.trialEndsAt ? (
              <p className="rounded-md bg-muted p-2 text-xs">
                Experimentação até{" "}
                {empresa.trialEndsAt.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                .
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Dados e ações de situação */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tipo</span>
              <span>{empresa.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Telefone</span>
              <span>{empresa.phone ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Criada em</span>
              <span>
                {empresa.createdAt.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            {empresa.suspensionReason ? (
              <p className="rounded-md bg-[var(--status-warning-bg)] p-2 text-xs text-[var(--status-warning-fg)] dark:bg-[var(--status-warning-bg)]/40">
                Suspensa: {empresa.suspensionReason}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Ações de ciclo de vida */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Situação da empresa</CardTitle>
          </CardHeader>
          <CardContent>
            {PROXIMOS[empresa.status].length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Empresa arquivada. Não é possível mudar a situação.
              </p>
            ) : (
              <div className="space-y-4">
                {PROXIMOS[empresa.status].map((acao) => (
                  <form key={acao.status} action={alterarStatusEmpresaAction} className="space-y-2">
                    <input type="hidden" name="id" value={empresa.id} />
                    <input type="hidden" name="status" value={acao.status} />
                    <label className="flex flex-col gap-1 text-sm">
                      {acao.destrutivo
                        ? `Motivo para ${acao.rotulo.toLowerCase()}`
                        : `Motivo (opcional para ${acao.rotulo.toLowerCase()})`}
                      <Input
                        name="motivo"
                        required={acao.destrutivo}
                        minLength={3}
                        placeholder="Ex.: inadimplência de 3 meses"
                      />
                    </label>
                    <Button
                      type="submit"
                      size="sm"
                      variant={acao.destrutivo ? "destructive" : "default"}
                    >
                      {acao.rotulo}
                    </Button>
                  </form>
                ))}
                <p className="text-xs text-muted-foreground">
                  Toda mudança de situação fica registrada na auditoria da plataforma.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vendas recentes */}
      <TableCard
        title="Vendas recentes"
        description="Últimas vendas concluídas desta empresa."
        footer={vendas.length > 0 ? `Mostrando as ${vendas.length} mais recentes` : undefined}
      >
        {vendas.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma venda registrada.</p>
        ) : (
          <>
          {/* Mobile: lista compacta — tabela só no desktop */}
          <ul className="flex flex-col gap-2 p-3 md:hidden">
            {vendas.map((v) => (
              <li key={v.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-semibold tabular-nums">#{v.id}</span>
                  <span className="text-xs text-muted-foreground">{v.createdAt.toLocaleString("pt-BR")}</span>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(v.total)}</span>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venda</TableHead>
                <TableHead>Quando</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendas.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="tabular-nums">#{v.id}</TableCell>
                  <TableCell>{v.createdAt.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCurrency(v.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          </>
        )}
      </TableCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tickets */}
        <TableCard
          title="Tickets"
          description="Chamados desta empresa."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/suporte">Abrir suporte</Link>
            </Button>
          }
        >
          {tickets.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Nenhum ticket aberto.</p>
          ) : (
            <ul className="divide-y">
              {tickets.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.createdAt.toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <StatusPill tom={statusTicketTom[t.status]}>
                    {labelDe(statusTicketLabel, t.status)}
                  </StatusPill>
                </li>
              ))}
            </ul>
          )}
        </TableCard>

        {/* Auditoria */}
        <TableCard
          title="Auditoria da plataforma"
          description="Ações administrativas sobre esta empresa."
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/admin/auditoria?empresa=${empresa.id}`}>
                <Receipt aria-hidden="true" className="size-4" />
                Ver tudo
              </Link>
            </Button>
          }
        >
          {auditoria.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma ação registrada.
            </p>
          ) : (
            <ul className="divide-y">
              {auditoria.map((a) => (
                <li key={a.id} className="flex items-start gap-3 p-3 text-sm">
                  <Activity aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {labelDe(acaoAuditoriaLabel, a.action)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.actorEmail} · {a.createdAt.toLocaleString("pt-BR")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TableCard>
      </div>
    </main>
  );
}
