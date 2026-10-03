import { prisma } from "@/lib/db";
import { SaleService, FinancialService } from "@/services";
import { requireSessionTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/validators";
import { Valor, ValorNum } from "@/components/shared/Valor";
import { DollarSign, TrendingUp, Package, AlertTriangle, ShoppingCart, Wallet } from "lucide-react";
import { DashboardChart } from "./dashboard-chart";
import { RecentSalesTable } from "./recent-sales-table";
import { LowStockTable } from "./low-stock-table";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { OnboardingWelcome } from "@/components/onboarding/OnboardingWelcome";

export default async function DashboardPage() {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard");

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const [products, todaysSales, financialResume, salesResumeMonth, salesWeek, lowStock, cashboxes, vendasTotal] =
    await Promise.all([
      prisma.product.count({ where: { tenantId: tenant.id, active: true } }),
      SaleService.getTodaysSales(tenant.id),
      FinancialService.getFinancialResume(tenant.id, monthStart, now),
      SaleService.getSalesResume(tenant.id, monthStart, now),
      prisma.sale.findMany({
        where: { tenantId: tenant.id, status: "CONCLUIDA", createdAt: { gte: weekStart } },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.inventory.findMany({
        where: { tenantId: tenant.id, product: { active: true } },
        include: { product: { select: { name: true } } },
        orderBy: { quantity: "asc" },
        take: 5,
      }),
      prisma.cashBox.findMany({ where: { tenantId: tenant.id, status: "ABERTO" } }),
      // Histórico, não "hoje": o passo "fazer uma venda" do onboarding já está
      // cumprido para quem vendeu ontem. Contar só o dia reabriria a tarefa
      // todo amanheço para uma loja que opera há meses.
      prisma.sale.count({ where: { tenantId: tenant.id, status: "CONCLUIDA" } }),
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

      <OnboardingWelcome operatorName={dbUser.name} />
      <OnboardingChecklist temProduto={products > 0} fezVenda={vendasTotal > 0} />

      {/* KPIs — strip compacto (2 col no mobile, 4 no desktop).
          Cor semântica: faturamento positivo, saldo do mês negativo em
          vermelho. O dono lê o sinal antes do número — é o saldo que ele
          precisa enxergar primeiro. */}
      <div className="grid grid-cols-2 gap-2 md:gap-4 xl:grid-cols-4">
        <div className="rounded-lg border bg-card p-2 md:p-3">
          <p className="text-[10px] text-muted-foreground">Faturado hoje</p>
          <ValorNum
            valor={faturadoHoje}
            formatar={formatCurrency}
            className="text-base md:text-lg font-semibold"
          />
          <p className="text-[10px] text-muted-foreground">{qtdVendasHoje} vendas</p>
        </div>
        <div className="rounded-lg border bg-card p-2 md:p-3">
          <p className="text-[10px] text-muted-foreground">Vendas no mês</p>
          <p className="text-base md:text-lg font-semibold tabular-nums">
            {salesResumeMonth.totalSales}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Ticket {formatCurrency(Math.round(salesResumeMonth.averageSale || 0))}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-2 md:p-3">
          <p className="text-[10px] text-muted-foreground">Produtos ativos</p>
          <p className="text-base md:text-lg font-semibold tabular-nums">{products}</p>
          <p className="text-[10px] text-muted-foreground">
            {estoqueBaixo > 0 ? (
              <Valor tom="atencao">{estoqueBaixo} em baixo estoque</Valor>
            ) : (
              "Nada em baixo estoque"
            )}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-2 md:p-3">
          <p className="text-[10px] text-muted-foreground">Saldo financeiro</p>
          <ValorNum
            valor={financialResume.saldo}
            formatar={formatCurrency}
            className="text-base md:text-lg font-semibold"
          />
          <p className="text-[10px] text-muted-foreground">
            {financialResume.receitas > 0 || financialResume.despesas > 0 ? (
              <>
                {formatCurrency(financialResume.receitas)} /{" "}
                {formatCurrency(financialResume.despesas)}
              </>
            ) : (
              "Sem lançamentos no mês"
            )}
          </p>
        </div>
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
