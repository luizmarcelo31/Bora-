import { prisma } from "@/lib/db";
import { SaleService, FinancialService } from "@/services";
import { requireSessionTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/validators";
import { DollarSign, TrendingUp, Package, AlertTriangle, ShoppingCart, Wallet } from "lucide-react";
import { DashboardChart } from "./dashboard-chart";
import { RecentSalesTable } from "./recent-sales-table";
import { LowStockTable } from "./low-stock-table";

export default async function DashboardPage() {
  const { tenant } = await requireSessionTenant("/dashboard");

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const [products, todaysSales, financialResume, salesResumeMonth, salesWeek, lowStock, cashboxes] =
    await Promise.all([
      prisma.product.count({ where: { tenantId: tenant.id, active: true } }),
      SaleService.getTodaysSales(tenant.id),
      FinancialService.getFinancialResume(tenant.id, monthStart, now),
      SaleService.getSalesResume(tenant.id, monthStart, now),
      prisma.sale.findMany({
        where: { tenantId: tenant.id, status: "COMPLETED", createdAt: { gte: weekStart } },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.inventory.findMany({
        where: { tenantId: tenant.id, product: { active: true } },
        include: { product: { select: { name: true } } },
        orderBy: { quantity: "asc" },
        take: 5,
      }),
      prisma.cashBox.findMany({ where: { tenantId: tenant.id, status: "OPEN" } }),
    ]);

  const faturadoHoje = todaysSales.reduce((s, sale) => s + sale.total, 0);
  const qtdVendasHoje = todaysSales.length;
  const estoqueBaixo = lowStock.filter((i) => i.quantity <= i.minimumStock).length;

  // Dados para gráfico: vendas por dia nos últimos 7 dias
  const dailyMap = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, 0);
  }
  for (const sale of salesWeek) {
    const key = sale.createdAt.toISOString().slice(0, 10);
    if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) ?? 0) + sale.total);
  }
  const chartData = Array.from(dailyMap.entries()).map(([date, total]) => ({
    date,
    total: total / 100, // reais para gráfico
  }));

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 p-4 md:p-6">
      <PageHeader
        title="Visão geral"
        badge={tenant.name}
        description="Acompanhe vendas, estoque, caixa e financeiro em tempo real."
      />

      {/* Metric Cards — assinatura BoraMais (MetricCard com ícone + badge) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <MetricCard
          title="Faturado hoje"
          value={formatCurrency(faturadoHoje)}
          hint={`Mês: ${formatCurrency(salesResumeMonth.totalReceived)}`}
          icon={DollarSign}
          badge={<Badge variant={qtdVendasHoje > 0 ? "default" : "secondary"}>{qtdVendasHoje} vendas</Badge>}
        />
        <MetricCard
          title="Vendas no mês"
          value={String(salesResumeMonth.totalSales)}
          hint={`Descontos ${formatCurrency(salesResumeMonth.totalDiscount)}`}
          icon={ShoppingCart}
          badge={
            <Badge>
              <TrendingUp className="size-3" />
              Ticket {formatCurrency(Math.round(salesResumeMonth.averageSale || 0))}
            </Badge>
          }
        />
        <MetricCard
          title="Produtos ativos"
          value={String(products)}
          hint={cashboxes.length > 0 ? `${cashboxes.length} caixa(s) aberto(s)` : "Nenhum caixa aberto"}
          icon={Package}
          badge={<Badge variant="outline">{estoqueBaixo} em baixo estoque</Badge>}
        />
        <MetricCard
          title="Saldo financeiro (mês)"
          value={formatCurrency(financialResume.saldo)}
          hint={`${formatCurrency(financialResume.receitas)} / ${formatCurrency(financialResume.despesas)}`}
          icon={Wallet}
          badge={
            <Badge variant={financialResume.saldo >= 0 ? "default" : "destructive"}>
              {financialResume.saldo >= 0 ? "Positivo" : "Negativo"}
            </Badge>
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardChart data={chartData} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4" />
              Estoque baixo
            </CardTitle>
            <CardDescription>Menor saldo — repor em breve</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <LowStockTable items={lowStock} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendas de hoje</CardTitle>
          <CardDescription>Últimas vendas registradas</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <RecentSalesTable sales={todaysSales} />
        </CardContent>
      </Card>
    </div>
  );
}
