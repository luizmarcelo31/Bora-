import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { FinancialService } from "@/services";
import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
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
import { formatCurrency } from "@/lib/validators";
import { createFinancialAction } from "./actions";

const ERROR_MSG: Record<string, string> = {
  invalid: "Dados inválidos. Confira tipo, categoria, descrição, valor e data.",
  forbidden: "Seu role não tem permissão para lançar no financeiro.",
};

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/financeiro");
  try {
    requirePermission(dbUser.role as Role, "financial.view");
  } catch {
    redirect("/unauthorized");
  }
  const params = await searchParams;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [resume, movements, cashboxes] = await Promise.all([
    FinancialService.getFinancialResume(tenant.id, monthStart, now),
    prisma.financialMovement.findMany({
      where: { tenantId: tenant.id },
      orderBy: { movementDate: "desc" },
      take: 30,
    }),
    prisma.cashBox.findMany({
      where: { tenantId: tenant.id, status: "OPEN" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const today = now.toISOString().slice(0, 10);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <PageHeader
        title="Financeiro"
        badge={tenant.name}
        description="Receitas, despesas e resultado do mês."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Receitas (mês)" value={formatCurrency(resume.receitas)} />
        <MetricCard title="Despesas (mês)" value={formatCurrency(resume.despesas)} />
        <MetricCard title="Saldo (mês)" value={formatCurrency(resume.saldo)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo lançamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createFinancialAction} className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              Tipo*
              <select
                name="type"
                required
                defaultValue="DESPESA"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="RECEITA">Receita</option>
                <option value="DESPESA">Despesa</option>
                <option value="TRANSFERENCIA">Transferência</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Categoria*
              <Input name="category" required placeholder="Ex.: Aluguel, Vendas" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Valor (R$)*
              <Input name="amount" required inputMode="decimal" placeholder="100,00" />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Descrição*
              <Input name="description" required placeholder="Detalhe o lançamento" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Data*
              <Input name="movementDate" type="date" required defaultValue={today} />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-3">
              Caixa (opcional)
              <select
                name="cashBoxId"
                defaultValue=""
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Nenhum</option>
                {cashboxes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            {params.error ? (
              <p className="text-sm text-destructive sm:col-span-3">
                {ERROR_MSG[params.error] ?? "Não foi possível lançar."}
              </p>
            ) : null}
            {params.ok ? (
              <p className="text-sm text-muted-foreground sm:col-span-3">Lançamento registrado.</p>
            ) : null}
            <div className="sm:col-span-3">
              <Button type="submit">Lançar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimos lançamentos</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {movements.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState title="Sem lançamentos" description="Registre o primeiro acima." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{new Date(m.movementDate).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{m.type}</TableCell>
                    <TableCell>{m.category}</TableCell>
                    <TableCell>{m.description}</TableCell>
                    <TableCell>{formatCurrency(m.amount)}</TableCell>
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
