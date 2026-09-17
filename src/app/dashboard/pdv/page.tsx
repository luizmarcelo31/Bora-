import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/validators";
import { getPdvPageData } from "./actions";
import { CancelSaleDialog } from "./cancel-dialog";
import { PdvClient } from "./pdv-client";

const ERROR_MSG: Record<string, string> = {
  invalid: "Venda inválida. Confira os itens.",
  empty: "Adicione ao menos um item.",
  stock: "Estoque insuficiente para um ou mais itens.",
  discount: "Desconto acima do permitido ou maior que o subtotal.",
  cashbox: "Caixa selecionado está fechado ou inexistente.",
  forbidden: "Seu role não tem permissão para esta ação.",
  cancel: "Não foi possível cancelar (venda já cancelada ou inexistente).",
};

export default async function PdvPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/pdv");
  try {
    requirePermission(dbUser.role as Role, "sales.create");
  } catch {
    redirect("/unauthorized");
  }
  const params = await searchParams;
  const { products, cashboxes, todaysSales } = await getPdvPageData(tenant.id);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
      <PageHeader title="PDV" badge={tenant.name} description="Ponto de venda da conveniência." />

      {params.error ? (
        <p className="text-sm text-destructive">{ERROR_MSG[params.error] ?? "Erro na venda."}</p>
      ) : null}
      {params.ok === "cancel" ? (
        <p className="text-sm text-muted-foreground">Venda cancelada e estoque/financeiro estornados.</p>
      ) : params.ok ? (
        <p className="text-sm text-muted-foreground">Venda #{params.ok} registrada com sucesso.</p>
      ) : null}

      <PdvClient
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          stock: p.inventory?.quantity ?? 0,
        }))}
        cashboxes={cashboxes.map((c) => ({ id: c.id, name: c.name }))}
      />

      <Card>
        <CardHeader>
          <CardTitle>Vendas de hoje</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {todaysSales.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState title="Nenhuma venda hoje" description="Finalize a primeira acima." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todaysSales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.id}</TableCell>
                    <TableCell>
                      {new Date(s.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell>{s.items.reduce((n, i) => n + i.quantity, 0)}</TableCell>
                    <TableCell>{s.paymentMethod}</TableCell>
                    <TableCell>{formatCurrency(s.total)}</TableCell>
                    <TableCell>
                      <CancelSaleDialog saleId={s.id} />
                    </TableCell>
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
