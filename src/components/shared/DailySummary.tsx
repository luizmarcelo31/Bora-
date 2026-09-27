import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/validators";
import { ShoppingCart, Package, TrendingUp } from "lucide-react";

interface DailySummaryData {
  todaySales: number;
  todayRevenue: number;
  todayProducts: number;
}

export async function DailySummary() {
  const data = await getTodaySummary();

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="flex items-center gap-3 rounded-lg border p-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <TrendingUp className="size-5" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Hoje</p>
          <p className="text-lg font-semibold tabular-nums">{formatCurrency(data.todayRevenue)}</p>
          <p className="text-[11px] text-muted-foreground">{data.todaySales} venda(s)</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg border p-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--status-success-bg)] text-[var(--status-success-fg)]">
          <Package className="size-5" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Produtos</p>
          <p className="text-lg font-semibold tabular-nums">{data.todayProducts}</p>
          <p className="text-[11px] text-muted-foreground">ativos</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg border p-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--status-brand)]/10 text-[var(--status-brand)]">
          <ShoppingCart className="size-5" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Resumo</p>
          <p className="text-base font-semibold">Bom dia!</p>
          <p className="text-[11px] text-muted-foreground">
            Vendeu {formatCurrency(data.todayRevenue)} hoje
          </p>
        </div>
      </div>
    </div>
  );
}

async function getTodaySummary(): Promise<DailySummaryData> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [sales, products] = await Promise.all([
    prisma.sale.count({
      where: { createdAt: { gte: today } },
    }),
    prisma.product.count({
      where: { active: true },
    }),
  ]);

  return {
    todaySales: sales,
    todayRevenue: 0,
    todayProducts: products,
  };
}
