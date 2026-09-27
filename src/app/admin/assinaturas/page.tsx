import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { TableCard } from "@/components/shared/TableCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { CreditCard, TrendingUp, AlertTriangle, PauseCircle } from "lucide-react";
import { formatCurrency } from "@/lib/validators";
import {
  cicloCobrancaLabel,
  labelDe,
  statusAssinaturaLabel,
  statusAssinaturaTom,
  motivoCancelamentoLabel,
} from "@/lib/labels";
import type { StatusAssinatura } from "@prisma/client";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { ERROS_ASSINATURA, mudarStatusAssinaturaAction, TRANSICOES_ASSINATURA } from "./actions";

const FILTROS: { valor: StatusAssinatura; rotulo: string }[] = [
  { valor: "ATIVA", rotulo: "Ativas" },
  { valor: "EXPERIMENTACAO", rotulo: "Em experimentação" },
  { valor: "PENDENTE_PAGAMENTO", rotulo: "Pagamento pendente" },
  { valor: "SUSPENSA", rotulo: "Suspensas" },
  { valor: "CANCELADA", rotulo: "Canceladas" },
  { valor: "ARQUIVADA", rotulo: "Arquivadas" },
];

export default async function AssinaturasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string; ok?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;

  const status = params.status && params.status in Object.fromEntries(
    FILTROS.map((f) => [f.valor, f.valor])
  ) ? (params.status as StatusAssinatura) : undefined;

  const [assinaturas, totais, pendentes] = await Promise.all([
    prisma.subscription.findMany({
      where: status ? { status } : {},
      orderBy: { renewsAt: "asc" },
      include: {
        tenant: { select: { id: true, name: true } },
        plan: { select: { name: true, monthlyPrice: true } },
      },
    }),
    prisma.subscription.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.subscription.findMany({
      where: { status: { in: ["ATIVA", "EXPERIMENTACAO"] } },
      include: { plan: { select: { monthlyPrice: true } } },
    }),
  ]);

  const porStatus = new Map(totais.map((t) => [t.status, t._count._all]));
  const mrr = pendentes.reduce(
    (s, a) =>
      s + (a.billingCycle === "ANUAL" ? Math.round(a.plan.monthlyPrice / 12) : a.plan.monthlyPrice),
    0
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Assinaturas"
        badge="Receita"
        description="Plano contratado por cada empresa. Cancelar nunca apaga o histórico."
      />

      {params.error ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {ERROS_ASSINATURA[params.error] ?? "Não foi possível alterar a assinatura."}
        </p>
      ) : null}
      {params.ok ? (
        <p role="status" className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">
          Assinatura alterada.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Receita mensal" value={formatCurrency(mrr)} hint="Planos ativos e em experimentação" icon={TrendingUp} />
        <MetricCard title="Ativas" value={String(porStatus.get("ATIVA") ?? 0)} hint="Assinaturas em dia" icon={CreditCard} />
        <MetricCard title="Pagamento pendente" value={String(porStatus.get("PENDENTE_PAGAMENTO") ?? 0)} hint="Precisam de cobrança" icon={AlertTriangle} />
        <MetricCard title="Suspensas" value={String(porStatus.get("SUSPENSA") ?? 0)} hint="Acesso restrito" icon={PauseCircle} />
      </div>

      <TableCard
        title="Assinaturas"
        description="Renovação mais próxima primeiro."
        footer={`${assinaturas.length} assinatura(s)`}
      >
        <AdminFilterBar
          placeholder="Filtrar por empresa…"
          chips={FILTROS.map((f) => ({ valor: f.valor, rotulo: f.rotulo }))}
          chipAtivo={status}
          descricao="Filtrar por situação da assinatura"
        />

        {assinaturas.length === 0 ? (
          <EmptyState
            title="Nenhuma assinatura"
            description="Vincule um plano a uma empresa no painel da empresa."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Mensalidade</TableHead>
                <TableHead>Renova</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assinaturas.map((a) => {
                const proximas = TRANSICOES_ASSINATURA[a.status];
                const padrao = proximas[0];
                const alternativa = proximas.find((s) => s !== padrao);
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <a
                        href={`/admin/empresas/${a.tenant.id}`}
                        className="font-medium hover:underline"
                      >
                        {a.tenant.name}
                      </a>
                    </TableCell>
                    <TableCell>{a.plan.name}</TableCell>
                    <TableCell>
                      <StatusPill tom={statusAssinaturaTom[a.status]}>
                        {labelDe(statusAssinaturaLabel, a.status)}
                      </StatusPill>
                      {a.cancelReason ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {labelDe(motivoCancelamentoLabel, a.cancelReason)}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(a.plan.monthlyPrice)}
                      <span className="block text-xs text-muted-foreground">
                        {cicloCobrancaLabel[a.billingCycle]}
                      </span>
                    </TableCell>
                    <TableCell>
                      {a.renewsAt.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      {padrao ? (
                        <form action={mudarStatusAssinaturaAction} className="flex items-center gap-1">
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="status" value={padrao} />
                          <Input
                            name="motivo"
                            placeholder="Motivo"
                            className="h-8 w-28 text-xs"
                            required={padrao === "CANCELADA"}
                            minLength={3}
                          />
                          <Button type="submit" size="sm" variant={padrao === "CANCELADA" ? "destructive" : "outline"}>
                            {rotuloAssinatura(padrao)}
                          </Button>
                          {alternativa ? (
                            <Button
                              type="submit"
                              size="sm"
                              variant="ghost"
                              name="status"
                              value={alternativa}
                              formNoValidate
                            >
                              {rotuloAssinatura(alternativa)}
                            </Button>
                          ) : null}
                        </form>
                      ) : (
                        <span className="text-xs text-muted-foreground">Arquivada</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </TableCard>
    </main>
  );
}

function rotuloAssinatura(s: StatusAssinatura): string {
  switch (s) {
    case "ATIVA":
      return "Reativar";
    case "SUSPENSA":
      return "Suspender";
    case "CANCELADA":
      return "Cancelar";
    case "PENDENTE_PAGAMENTO":
      return "Marcar pendente";
    case "ARQUIVADA":
      return "Arquivar";
    default:
      return "Alterar";
  }
}
