import Link from "next/link";
import { redirect } from "next/navigation";
import type { Funcao } from "@prisma/client";
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
import { Button } from "@/components/ui/button";
import { paymentLabel } from "@/lib/payments";
import { ShoppingCart, Receipt } from "lucide-react";
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
    requirePermission(dbUser.role as Funcao, "sales.create");
  } catch {
    redirect("/unauthorized");
  }
const { products, cashboxes, todaysSales, user } = await getPdvPageData(tenant.id);

    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
        <PageHeader title="PDV" badge={tenant.name} />
        <SearchParamToast
          okText="Venda #{v} registrada com sucesso."
          okMap={{ cancel: "Venda cancelada e estoque/financeiro estornados." }}
          errorMap={ERROR_MSG}
        />

        <PdvClient
          tenantId={tenant.id}
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            stock: p.inventory?.quantity ?? 0,
            category: (p as { category?: string | null }).category ?? null,
            imageUrl: (p as { imageUrl?: string | null }).imageUrl ?? null,
          }))}
          cashboxes={cashboxes.map((c) => ({ id: c.id, name: c.name }))}
          user={user}
        />

      <TableCard
        title="Vendas de hoje"
        description="Últimas vendas registradas no PDV."
        footer={`${todaysSales.length} venda(s) hoje`}
      >
          {todaysSales.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState
                title="Nenhuma venda hoje"
                description="Finalize a primeira acima."
                icon={ShoppingCart}
                action={
                  <Button asChild size="sm">
                    <Link href="/dashboard/pdv/express">Abrir PDV expresso</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <>
            {/* Mobile: lista compacta (skill §8) — tabela só no desktop */}
            <ul className="flex flex-col gap-2 p-3 md:hidden">
              {todaysSales.map((s) => (
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
                  <Link
                    href={`/dashboard/pdv/recibo/${s.id}`}
                    aria-label={`Recibo da venda #${s.id}`}
                    className="rounded-md border p-2 text-muted-foreground hit-area-44"
                  >
                    <Receipt className="size-4" />
                  </Link>
                  <CancelSaleDialog saleId={s.id} />
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
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todaysSales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="tabular-nums">{s.id}</TableCell>
                    <TableCell>
                      {new Date(s.createdAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="tabular-nums">{s.items.reduce((n, i) => n + i.quantity, 0)}</TableCell>
                    <TableCell>{paymentLabel(s.paymentMethod)}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(s.total)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link
                          href={`/dashboard/pdv/recibo/${s.id}`}
                          aria-label={`Recibo da venda #${s.id}`}
                          className="rounded-md border p-2 text-muted-foreground hit-area-44"
                        >
                          <Receipt className="size-4" />
                        </Link>
                        <CancelSaleDialog saleId={s.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            </>
          )}
      </TableCard>
    </main>
  );
}
