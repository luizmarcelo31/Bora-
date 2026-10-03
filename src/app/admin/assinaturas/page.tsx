import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
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
import { calcularMRR, TRANSICOES_ASSINATURA } from "@/lib/plataforma";
import {
  cicloCobrancaLabel,
  labelDe,
  statusAssinaturaLabel,
  statusAssinaturaTom,
  motivoCancelamentoLabel,
} from "@/lib/labels";
import type { StatusAssinatura } from "@prisma/client";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { Valor } from "@/components/shared/Valor";
import type { TomValor } from "@/components/shared/Valor";
import { LinhaLista } from "@/components/shared/LinhaLista";
import { mudarStatusAssinaturaAction } from "./actions";

const ERROS_ASSINATURA: Record<string, string> = {
  naoEncontrada: "Assinatura não encontrada.",
  transicaoInvalida: "Essa mudança não é permitida a partir do estado atual.",
  motivoObrigatorio: "Informe o motivo.",
};

const FILTROS: { valor: StatusAssinatura; rotulo: string }[] = [
  { valor: "ATIVA", rotulo: "Ativas" },
  { valor: "EXPERIMENTACAO", rotulo: "Em experimentação" },
  { valor: "PENDENTE_PAGAMENTO", rotulo: "Pagamento pendente" },
  { valor: "SUSPENSA", rotulo: "Suspensas" },
  { valor: "CANCELADA", rotulo: "Canceladas" },
  { valor: "ARQUIVADA", rotulo: "Arquivadas" },
];

/**
 * Tom da mensalidade: receita viva em verde, dinheiro que já saiu ou não entra
 * mais em vermelho, cobrança em aberto em atenção. Arquivada é neutra — é
 * histórico, não um problema.
 */
function tomMensalidade(status: StatusAssinatura): TomValor {
  switch (status) {
    case "ATIVA":
    case "EXPERIMENTACAO":
      return "positivo";
    case "CANCELADA":
      return "negativo";
    case "PENDENTE_PAGAMENTO":
      return "atencao";
    default:
      return "neutro";
  }
}

export default async function AssinaturasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; pagina?: string; error?: string; ok?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;

  const status = params.status && params.status in Object.fromEntries(
    FILTROS.map((f) => [f.valor, f.valor])
  ) ? (params.status as StatusAssinatura) : undefined;
  const q = (params.q ?? "").trim();
  const pagina = Math.max(1, Number(params.pagina ?? 1) || 1);
  const POR_PAGINA = 20;

  const where = {
    ...(status ? { status } : {}),
    ...(q ? { tenant: { name: { contains: q, mode: "insensitive" as const } } } : {}),
  };

  const comQuery = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    if (p > 1) sp.set("pagina", String(p));
    const s = sp.toString();
    return s ? `?${s}` : "";
  };

  const [total, assinaturas, totais, pendentes] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      orderBy: { renewsAt: "asc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
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
  const mrr = calcularMRR(
    pendentes.map((a) => ({
      billingCycle: a.billingCycle,
      monthlyPrice: a.plan.monthlyPrice,
    }))
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
<AdminBreadcrumb items={[{ label: "Início", href: "/admin" }, { label: "Assinaturas" }]} />
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
        <p role="status" className="rounded-lg border border-[var(--status-success-dot)]/40 bg-[var(--status-success-bg)] p-3 text-sm text-[var(--status-success-fg)]">
          Assinatura alterada.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Receita mensal"
          value={<Valor tom="positivo">{formatCurrency(mrr)}</Valor>}
          hint="Planos ativos e em experimentação"
          icon={TrendingUp}
        />
        <MetricCard title="Ativas" value={String(porStatus.get("ATIVA") ?? 0)} hint="Assinaturas em dia" icon={CreditCard} />
        <MetricCard
          title="Pagamento pendente"
          value={
            <Valor tom={(porStatus.get("PENDENTE_PAGAMENTO") ?? 0) > 0 ? "negativo" : "neutro"}>
              {porStatus.get("PENDENTE_PAGAMENTO") ?? 0}
            </Valor>
          }
          hint="Precisam de cobrança"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Suspensas"
          value={
            <Valor tom={(porStatus.get("SUSPENSA") ?? 0) > 0 ? "atencao" : "neutro"}>
              {porStatus.get("SUSPENSA") ?? 0}
            </Valor>
          }
          hint="Acesso restrito"
          icon={PauseCircle}
        />
      </div>

      <TableCard
        title="Assinaturas"
        description={
          total === 0
            ? "Nenhuma assinatura no filtro atual."
            : `Página ${pagina} de ${Math.max(1, Math.ceil(total / POR_PAGINA))} · ${total} assinatura(s). Renovação mais próxima primeiro.`
        }
        footer={
          total === 0
            ? undefined
            : `Mostrando ${(pagina - 1) * POR_PAGINA + 1}–${Math.min(pagina * POR_PAGINA, total)} de ${total}`
        }
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
          <>
          {/* Mobile: lista compacta — tabela só no desktop */}
          <ul className="flex flex-col gap-2 p-3 md:hidden">
            {assinaturas.map((a) => (
              <li key={a.id}>
                <LinhaLista
                  titulo={
                    <a href={`/admin/empresas/${a.tenant.id}`} className="hover:underline">
                      {a.tenant.name}
                    </a>
                  }
                  apoio={`${a.plan.name} · ${cicloCobrancaLabel[a.billingCycle]}`}
                  badge={
                    <StatusPill tom={statusAssinaturaTom[a.status]}>
                      {labelDe(statusAssinaturaLabel, a.status)}
                    </StatusPill>
                  }
                  valor={
                    <Valor tom={tomMensalidade(a.status)}>
                      {formatCurrency(a.plan.monthlyPrice)}
                    </Valor>
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
                        className="font-semibold hover:underline"
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
                      <Valor tom={tomMensalidade(a.status)}>
                        {formatCurrency(a.plan.monthlyPrice)}
                      </Valor>
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
          </div>
          </>
        )}

        {total > POR_PAGINA ? (
          <nav aria-label="Paginação" className="flex items-center justify-end gap-2 px-1">
            {pagina > 1 ? (
              <Button variant="outline" size="sm" asChild>
                <a href={`/admin/assinaturas${comQuery(pagina - 1)}`}>Anterior</a>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
            )}
            <span className="text-xs text-muted-foreground tabular-nums">
              {pagina} de {Math.max(1, Math.ceil(total / POR_PAGINA))}
            </span>
            {pagina < Math.max(1, Math.ceil(total / POR_PAGINA)) ? (
              <Button variant="outline" size="sm" asChild>
                <a href={`/admin/assinaturas${comQuery(pagina + 1)}`}>Próxima</a>
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

