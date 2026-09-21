import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";

export function LowStockTable({
  items,
}: {
  items: { id: number; quantity: number; minimumStock: number; product: { name: string } }[];
}) {
  if (items.length === 0) return <EmptyState title="Estoque ok" description="Nenhum item crítico." />;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produto</TableHead>
          <TableHead>Saldo</TableHead>
          <TableHead>Mín</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((i) => (
          <TableRow key={i.id}>
            <TableCell>{i.product.name}</TableCell>
            <TableCell className={i.quantity <= i.minimumStock ? "text-destructive font-medium tabular-nums" : "tabular-nums"}>
              {i.quantity}
            </TableCell>
            <TableCell className="tabular-nums">{i.minimumStock}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
