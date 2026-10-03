import { redirect } from "next/navigation";
import type { Funcao } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SaleService, FinancialService } from "@/services";
import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableCard } from "@/components/shared/TableCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { LinhaLista } from "@/components/shared/LinhaLista";
import { Valor } from "@/components/shared/Valor";
import { LazyReportActions } from "@/components/shared/LazyReportActions";
import { getCompanyLogoUrl } from "@/lib/get-company-logo";
import { paymentLabel } from "@/lib/payments";
import { BarChart3 } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { OnboardingReportVisit } from "@/components/onboarding/OnboardingReportVisit";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/validators";

function parseDateParam(v: string | undefined, fallback: Date): Date {
  if (!v) return fallback;
  const d = new Date(v + "T12:00:00");
  return isNaN(d.getTime()) ? fallback : d;
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string; vendasPage?: string }>;
}) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/relatorios");
  try {
    requirePermission(dbUser.role as Funcao, "reports.view");
  } catch {
    redirect("/unauthorized");
  }
  const params = await searchParams;

  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultEnd = now;

  const startDate = parseDateParam(params.start, defaultStart);
  const endDate = parseDateParam(params.end, defaultEnd);
  const endInclusive = new Date(endDate);
  endInclusive.setHours(23, 59, 59, 999);

  const [salesResume, financialResume] = await Promise.all([
    SaleService.getSalesResume(tenant.id, startDate, endInclusive),
    FinancialService.getFinancialResume(tenant.id, startDate, endInclusive),
  ]);

  // Ranking de produtos no período
  const topProducts = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: {
      tenantId: tenant.id,
      sale: { tenantId: tenant.id, status: "CONCLUIDA", createdAt: { gte: startDate, lte: endInclusive } },
    },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 10,
  });

  const PAGE_SIZE = 50;
  const vendasPage = Math.max(1, parseInt(params.vendasPage ?? "1", 10) || 1);
  const salesWhere = {
    tenantId: tenant.id,
    status: "CONCLUIDA" as const,
    createdAt: { gte: startDate, lte: endInclusive },
  };
  const [periodSales, printSales] = await Promise.all([
    prisma.sale.findMany({
      where: salesWhere,
      select: {
        id: true,
        createdAt: true,
        paymentMethod: true,
        total: true,
        items: { select: { quantity: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (vendasPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    // Exportação: até 500 linhas do filtro atual (nota no subtitle do PDF).
    prisma.sale.findMany({
      where: salesWhere,
      select: {
        id: true,
        createdAt: true,
        paymentMethod: true,
        total: true,
        items: { select: { quantity: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);
  const salesCount = await prisma.sale.count({ where: salesWhere });
  const totalPages = Math.max(1, Math.ceil(salesCount / PAGE_SIZE));

  const productIds = topProducts.map((r) => r.productId);
  const productsMap = new Map(
    productIds.length
      ? (await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })).map(
          (p) => [p.id, p.name] as const
        )
      : []
  );

  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Relatórios"
        badge={tenant.name}
        description="Vendas, produtos e financeiro no período."
      />

      <OnboardingReportVisit />

      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Início
              <Input type="date" name="start" defaultValue={startStr} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Fim
              <Input type="date" name="end" defaultValue={endStr} />
            </label>
            <Button type="submit">Filtrar</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border bg-card p-2 text-center">
          <p className="text-lg font-semibold tabular-nums">{salesResume.totalSales}</p>
          <p className="text-[10px] text-muted-foreground">Vendas</p>
        </div>
        <div className="rounded-lg border bg-card p-2 text-center">
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(salesResume.totalReceived)}</p>
          <p className="text-[10px] text-muted-foreground">Faturado</p>
        </div>
        <div className="rounded-lg border bg-card p-2 text-center">
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(financialResume.saldo)}</p>
          <p className="text-[10px] text-muted-foreground">Saldo</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendas no período</CardTitle>
          <p className="text-sm text-muted-foreground">
            {salesCount === 0
              ? "Nenhuma venda no intervalo."
              : `Página ${vendasPage} de ${totalPages} · ${salesCount} vendas.`}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <LazyReportActions
            title="Relatório de vendas"
            subtitle={`${tenant.name} — ${startStr} a ${endStr} · ${salesCount} vendas no filtro (exporta até ${printSales.length})`}
            columns={["Data", "#", "Itens", "Pagamento", "Total"]}
            rows={printSales.map((s) => [
              new Date(s.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
              `#${s.id}`,
              String(s.items.reduce((n, i) => n + i.quantity, 0)),
              paymentLabel(s.paymentMethod),
              formatCurrency(s.total),
            ])}
            footer={["", "Total", `${printSales.length} vendas`, "", formatCurrency(printSales.reduce((t, s) => t + s.total, 0))]}
            fileName={`vendas-${tenant.id}-${startStr}_${endStr}`}
            companyLogoUrl={await getCompanyLogoUrl(tenant.id)}
          />
        </CardContent>
        <CardContent className="px-0 pb-0">
          {periodSales.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState
                title="Sem vendas no período"
                description="Ajuste o intervalo acima ou registre a primeira venda."
                icon={BarChart3}
                action={
                  <Button asChild size="sm">
                    <Link href="/dashboard/pdv/express">Registrar venda</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <>
            {/* Mobile: lista compacta (LinhaLista) — tabela só no desktop */}
            <ul className="flex flex-col gap-1.5 p-3 md:hidden">
              {periodSales.map((s) => {
                const itens = s.items.reduce((n, i) => n + i.quantity, 0);
                return (
                  <li key={s.id}>
                    <LinhaLista
                      titulo={`#${s.id} · ${itens} ${itens === 1 ? "item" : "itens"}`}
                      apoio={`${new Date(s.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · ${paymentLabel(s.paymentMethod)}`}
                      valor={<Valor tom="positivo">{formatCurrency(s.total)}</Valor>}
                    />
                  </li>
                );
              })}
            </ul>
            <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>#</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodSales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="tabular-nums">{new Date(s.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</TableCell>
                    <TableCell className="tabular-nums">#{s.id}</TableCell>
                    <TableCell className="tabular-nums">{s.items.reduce((n, i) => n + i.quantity, 0)}</TableCell>
                    <TableCell>{paymentLabel(s.paymentMethod)}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(s.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            </>
          )}
        </CardContent>
        {totalPages > 1 ? (
          <CardContent className="flex items-center justify-between pt-0">
            {vendasPage > 1 ? (
              <a
                href={`/dashboard/relatorios?start=${startStr}&end=${endStr}&vendasPage=${vendasPage - 1}`}
                className="text-sm text-muted-foreground underline"
              >
                ← Anterior
              </a>
            ) : (
              <span />
            )}
            <span className="text-sm text-muted-foreground">
              Página {vendasPage} de {totalPages}
            </span>
            {vendasPage < totalPages ? (
              <a
                href={`/dashboard/relatorios?start=${startStr}&end=${endStr}&vendasPage=${vendasPage + 1}`}
                className="text-sm text-muted-foreground underline"
              >
                Próxima →
              </a>
            ) : (
              <span />
            )}
          </CardContent>
        ) : null}
      </Card>

      <TableCard
        title="Top produtos por quantidade"
        description="Mais vendidos no período."
        footer={`${topProducts.length} produto(s)`}
      >
          {topProducts.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState
                title="Sem vendas no período"
                description="Ajuste o intervalo acima ou registre a primeira venda."
                icon={BarChart3}
                action={
                  <Button asChild size="sm">
                    <Link href="/dashboard/pdv/express">Registrar venda</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Qtd vendida</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((r) => (
                  <TableRow key={r.productId}>
                    <TableCell>{productsMap.get(r.productId) ?? `#${r.productId}`}</TableCell>
                    <TableCell className="tabular-nums">{r._sum.quantity ?? 0}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(r._sum.total ?? 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </TableCard>

      <TableCard
        title="Financeiro por categoria"
        description="Receitas e despesas no período."
        footer={`${Object.keys(financialResume.movementsByCategory).length} categoria(s)`}
      >
          {Object.keys(financialResume.movementsByCategory).length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState title="Sem movimentações no período" description="Ajuste o intervalo acima." icon={BarChart3} />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Receitas</TableHead>
                  <TableHead>Despesas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(financialResume.movementsByCategory).map(([cat, v]) => (
                  <TableRow key={cat}>
                    <TableCell>{cat}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(v.receita)}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(v.despesa)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </TableCard>
    </main>
  );
}
