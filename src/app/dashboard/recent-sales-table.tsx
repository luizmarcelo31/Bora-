import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
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
            <TableCell>{s.id}</TableCell>
            <TableCell>{new Date(s.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</TableCell>
            <TableCell>{s.items.reduce((n, i) => n + i.quantity, 0)}</TableCell>
            <TableCell>{s.paymentMethod}</TableCell>
            <TableCell>{formatCurrency(s.total)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
