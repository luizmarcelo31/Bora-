import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { paymentLabel } from "@/lib/payments";
import { formatCurrency } from "@/lib/validators";
import Link from "next/link";

export function RecentSalesTable({
  sales,
}: {
  sales: { id: number; createdAt: Date; paymentMethod: string; total: number; items: { quantity: number }[] }[];
}) {
  if (sales.length === 0) {
    return (
      <EmptyState
        title="Nenhuma venda hoje"
        description="As vendas aparecerão aqui ao longo do dia."
        action={
          <Button asChild size="sm">
            <Link href="/dashboard/pdv/express">Registrar venda</Link>
          </Button>
        }
      />
    );
  }
  return (
    <>
      {/* Mobile: lista compacta (skill §8) — tabela só no desktop */}
      <ul className="flex flex-col gap-2 p-3 md:hidden">
        {sales.map((s) => (
          <li key={s.id} className="flex items-center gap-3 rounded-lg border p-3">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold">
                #{s.id} · {s.items.reduce((n, i) => n + i.quantity, 0)} {s.items.reduce((n, i) => n + i.quantity, 0) === 1 ? "item" : "itens"}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(s.createdAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })} · {paymentLabel(s.paymentMethod)}
              </span>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(s.total)}</span>
          </li>
        ))}
      </ul>
      <div className="hidden md:block">
      <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Hora</TableHead>
          <TableHead>Itens</TableHead>
          <TableHead>Pagamento</TableHead>
          <TableHead>Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="tabular-nums">{s.id}</TableCell>
            <TableCell>{new Date(s.createdAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })}</TableCell>
            <TableCell className="tabular-nums">{s.items.reduce((n, i) => n + i.quantity, 0)}</TableCell>
            <TableCell>{paymentLabel(s.paymentMethod)}</TableCell>
            <TableCell className="tabular-nums">{formatCurrency(s.total)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
      </div>
    </>
  );
}
