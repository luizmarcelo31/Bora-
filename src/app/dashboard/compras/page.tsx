import { prisma } from "@/lib/db";
import { requireSessionTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { StatusBadge } from "@/components/shared/StatusBadge";
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
import { Truck } from "lucide-react";
import { formatCurrency } from "@/lib/validators";
import { createSupplierAction, createPurchaseAction, receivePurchaseAction } from "./actions";

const ERROR_MSG: Record<string, string> = {
  invalid: "Dados inválidos.",
  fail: "Não foi possível concluir.",
};

export default async function ComprasPage() {
  const { tenant } = await requireSessionTenant("/dashboard/compras");

  const [suppliers, purchases] = await Promise.all([
    prisma.supplier.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: "asc" },
    }),
    prisma.purchase.findMany({
      where: { tenantId: tenant.id },
      include: { supplier: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Compras e Fornecedores"
        badge={tenant.name}
        description="Gerencie entradas de mercadorias e contas a pagar."
      />
      <SearchParamToast okText="Registro criado." errorMap={ERROR_MSG} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Novo Fornecedor</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createSupplierAction} className="grid gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Nome do Fornecedor*
                <Input name="name" required placeholder="Ambev S.A." />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                CNPJ / CPF
                <Input name="document" placeholder="00.000.000/0001-00" />
              </label>
              <Button type="submit" className="mt-2">Cadastrar fornecedor</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nova Compra</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createPurchaseAction} className="grid gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Fornecedor*
                <SelectField
                  name="supplierId"
                  options={suppliers.map(s => ({ value: s.id.toString(), label: s.name }))}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Total da Nota (R$)*
                <Input name="total" required inputMode="decimal" placeholder="1.500,00" />
              </label>
              <Button type="submit" className="mt-2" disabled={suppliers.length === 0}>
                Registrar Compra
              </Button>
              {suppliers.length === 0 && <span className="text-xs text-[var(--status-danger-fg)]">Cadastre um fornecedor primeiro.</span>}
            </form>
          </CardContent>
        </Card>
      </div>

      {purchases.length === 0 ? (
        <EmptyState title="Nenhuma compra" description="Comece registrando compras dos seus fornecedores." icon={Truck} />
      ) : (
        <TableCard
          title="Histórico de Compras"
          description="Entradas recentes de mercadoria."
          footer={`${purchases.length} compra(s)`}
        >
        {/* Mobile: lista compacta (skill §8) — tabela só no desktop */}
        <ul className="flex flex-col gap-2 p-3 md:hidden">
          {purchases.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{p.supplier.name}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {p.createdAt.toLocaleDateString('pt-BR')}
                </span>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(p.total)}</span>
              <StatusBadge status={p.status === "RECEBIDA" ? "active" : "pending"} label={p.status} />
              {p.status === "PENDENTE" && (
                <form action={receivePurchaseAction} className="shrink-0">
                  <input type="hidden" name="purchaseId" value={p.id} />
                  <Button variant="outline" size="sm" type="submit" className="hit-area-44">Confirmar</Button>
                </form>
              )}
            </li>
          ))}
        </ul>
        <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-semibold">{p.supplier.name}</TableCell>
                <TableCell className="tabular-nums">{formatCurrency(p.total)}</TableCell>
                <TableCell>
                  <StatusBadge status={p.status === "RECEBIDA" ? "active" : "pending"} label={p.status} />
                </TableCell>
                <TableCell className="tabular-nums">{p.createdAt.toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>
                  {p.status === "PENDENTE" && (
                    <form action={receivePurchaseAction}>
                      <input type="hidden" name="purchaseId" value={p.id} />
                      <Button variant="outline" size="sm" type="submit">Confirmar recebimento</Button>
                    </form>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
        </TableCard>
      )}
    </main>
  );
}
