"use client";

import { Area, CartesianGrid, ComposedChart, XAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export function DashboardChart({ data }: { data: { date: string; total: number }[] }) {
  const config = {
    total: { label: "Faturado", color: "var(--chart-1)" },
  };

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="leading-none">Faturamento</CardTitle>
        <CardDescription>Últimos 7 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <ComposedChart data={data} margin={{ top: 0, left: 0, right: 0 }}>
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.36} />
                <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeOpacity={0.5} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v: string) =>
                new Date(v + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
              }
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" labelFormatter={(v) => new Date(String(v) + "T12:00:00").toLocaleDateString("pt-BR")} />}
            />
            <Area
              dataKey="total"
              type="natural"
              fill="url(#fillTotal)"
              stroke="var(--color-total)"
              strokeWidth={1.25}
              dot={false}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
