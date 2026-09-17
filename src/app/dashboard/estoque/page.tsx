import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { moveStockAction, getStockPageData } from "./actions";

const ERROR_MSG: Record<string, string> = {
  invalid: "Dados inválidos. Confira produto, tipo e quantidade.",
  stock: "Não foi possível movimentar (verifique o saldo).",
  forbidden: "Seu role não tem permissão para movimentar estoque.",
};

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/estoque");
  try {
    requirePermission(dbUser.role as Role, "inventory.view");
  } catch {
    redirect("/unauthorized");
  }
  const params = await searchParams;
  const { products, history } = await getStockPageData(tenant.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <PageHeader
        title="Estoque"
        badge={tenant.name}
        description="Saldo por produto e movimentações."
      />

      <Card>
        <CardHeader>
          <CardTitle>Movimentar estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={moveStockAction} className="grid gap-3 sm:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Produto*
              <select
                name="productId"
                required
                defaultValue=""
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (atual: {p.inventory?.quantity ?? 0})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Tipo*
              <select
                name="type"
                required
                defaultValue="ENTRADA"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
                <option value="AJUSTE">Ajuste (baixa)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Quantidade*
              <Input name="quantity" required inputMode="numeric" placeholder="10" />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-3">
              Motivo
              <Input name="reason" placeholder="Ex.: compra fornecedor" />
            </label>
            {params.error ? (
              <p className="text-sm text-destructive sm:col-span-4">
                {ERROR_MSG[params.error] ?? "Não foi possível movimentar."}
              </p>
            ) : null}
            {params.ok ? (
              <p className="text-sm text-muted-foreground sm:col-span-4">
                Movimentação registrada.
              </p>
            ) : null}
            <div className="sm:col-span-4">
              <Button type="submit">Registrar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saldo atual</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {products.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState title="Nenhum produto" description="Cadastre em Produtos primeiro." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Mínimo</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const qty = p.inventory?.quantity ?? 0;
                  const min = p.inventory?.minimumStock ?? 0;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{qty}</TableCell>
                      <TableCell>{min}</TableCell>
                      <TableCell>{qty <= min ? "⚠️ Baixo" : "OK"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {history.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Últimas movimentações</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{new Date(m.createdAt).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{m.inventory.product.name}</TableCell>
                    <TableCell>{m.type}</TableCell>
                    <TableCell>{m.quantity}</TableCell>
                    <TableCell>{m.reason ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
