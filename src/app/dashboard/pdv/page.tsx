import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableCard } from "@/components/shared/TableCard";
import { SearchParamToast } from "@/components/shared/SearchParamToast";
import { paymentLabel } from "@/lib/payments";
import { ShoppingCart } from "lucide-react";
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
  sale: "Não foi possível concluir a venda. Tente novamente.",
};

export default async function PdvPage() {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/pdv");
  try {
    requirePermission(dbUser.role as Role, "sales.create");
  } catch {
    redirect("/unauthorized");
  }
  const { products, cashboxes, todaysSales } = await getPdvPageData(tenant.id);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader title="PDV" badge={tenant.name} description="Ponto de venda da conveniência." />
      <SearchParamToast
        okText="Venda #{v} registrada com sucesso."
        okMap={{ cancel: "Venda cancelada e estoque/financeiro estornados." }}
        errorMap={ERROR_MSG}
      />

      <PdvClient
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          stock: p.inventory?.quantity ?? 0,
          category: (p as { category?: string | null }).category ?? null,
        }))}
        cashboxes={cashboxes.map((c) => ({ id: c.id, name: c.name }))}
      />

      <TableCard
        title="Vendas de hoje"
        description="Últimas vendas registradas no PDV."
        footer={`${todaysSales.length} venda(s) hoje`}
      >
          {todaysSales.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState title="Nenhuma venda hoje" description="Finalize a primeira acima." icon={ShoppingCart} />
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
                    <TableCell className="tabular-nums">{s.id}</TableCell>
                    <TableCell>
                      {new Date(s.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="tabular-nums">{s.items.reduce((n, i) => n + i.quantity, 0)}</TableCell>
                    <TableCell>{paymentLabel(s.paymentMethod)}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(s.total)}</TableCell>
                    <TableCell>
                      <CancelSaleDialog saleId={s.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </TableCard>
    </main>
  );
}
