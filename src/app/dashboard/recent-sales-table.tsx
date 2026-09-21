import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { paymentLabel } from "@/lib/payments";
import { formatCurrency } from "@/lib/validators";

export function RecentSalesTable({
  sales,
}: {
  sales: { id: number; createdAt: Date; paymentMethod: string; total: number; items: { quantity: number }[] }[];
}) {
  if (sales.length === 0) {
    return <EmptyState title="Nenhuma venda hoje" description="As vendas aparecerão aqui ao longo do dia." />;
  }
  return (
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
            <TableCell>{new Date(s.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</TableCell>
            <TableCell className="tabular-nums">{s.items.reduce((n, i) => n + i.quantity, 0)}</TableCell>
            <TableCell>{paymentLabel(s.paymentMethod)}</TableCell>
            <TableCell className="tabular-nums">{formatCurrency(s.total)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
