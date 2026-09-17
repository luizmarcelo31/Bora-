import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SaleService, FinancialService } from "@/services";
import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/relatorios");
  try {
    requirePermission(dbUser.role as Role, "reports.view");
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
      sale: { tenantId: tenant.id, status: "COMPLETED", createdAt: { gte: startDate, lte: endInclusive } },
    },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 10,
  });

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

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Vendas" value={String(salesResume.totalSales)} hint={`Ticket médio ${formatCurrency(Math.round(salesResume.averageSale))}`} />
        <MetricCard title="Faturado (vendas)" value={formatCurrency(salesResume.totalReceived)} hint={`Descontos ${formatCurrency(salesResume.totalDiscount)}`} />
        <MetricCard title="Saldo financeiro" value={formatCurrency(financialResume.saldo)} hint={`Receitas ${formatCurrency(financialResume.receitas)} / Despesas ${formatCurrency(financialResume.despesas)}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top produtos por quantidade</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {topProducts.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">Sem vendas no período.</p>
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
                    <TableCell>{r._sum.quantity ?? 0}</TableCell>
                    <TableCell>{formatCurrency(r._sum.total ?? 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financeiro por categoria</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {Object.keys(financialResume.movementsByCategory).length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">Sem movimentações no período.</p>
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
                    <TableCell>{formatCurrency(v.receita)}</TableCell>
                    <TableCell>{formatCurrency(v.despesa)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
