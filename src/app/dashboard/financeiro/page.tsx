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
import { Textarea } from "@/components/ui/textarea";
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
import { SearchParamToast } from "@/components/shared/SearchParamToast";
import { Badge } from "@/components/ui/badge";
import { SelectField } from "@/components/ui/select-field";
import { formatCurrency } from "@/lib/validators";
import { Wallet } from "lucide-react";
import { createFinancialAction } from "./actions";
import { togglePaidAction } from "./pay-actions";
import { EditFinancialDialog, DeleteFinancialDialog } from "./financial-dialogs";

const ERROR_MSG: Record<string, string> = {
  invalid: "Dados inválidos. Confira tipo, categoria, descrição, valor e data.",
  forbidden: "Seu role não tem permissão para esta ação.",
  paid_locked: "Lançamento pago não pode ser editado/excluído — desmarque o pago antes.",
  not_found: "Lançamento não encontrado.",
};

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string; type?: string; q?: string }>;
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
  const typeFilterRaw = params.type ?? "all";
  const typeFilter = typeFilterRaw.toUpperCase();
  const q = (params.q ?? "").toLowerCase().trim();

  const allowed = ["RECEITA", "DESPESA", "TRANSFERENCIA"] as const;
  const whereType =
    typeFilter === "ALL" || !allowed.includes(typeFilter as (typeof allowed)[number])
      ? {}
      : { type: typeFilter as import("@prisma/client").FinancialMovementType };

  const [resume, allMovements, cashboxes, finCategories] = await Promise.all([
    FinancialService.getFinancialResume(tenant.id, monthStart, now),
    prisma.financialMovement.findMany({
      where: { tenantId: tenant.id, ...whereType },
      orderBy: { movementDate: "desc" },
      take: 50,
    }),
    prisma.cashBox.findMany({
      where: { tenantId: tenant.id, status: "OPEN" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { tenantId: tenant.id, kind: "FINANCIAL", active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const movements = allMovements.filter((m) => {
    if (!q) return true;
    return `${m.category} ${m.description}`.toLowerCase().includes(q);
  });

  const today = now.toISOString().slice(0, 10);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Financeiro"
        badge={tenant.name}
        description="Receitas, despesas e resultado — com filtros e baixa."
      />
      <SearchParamToast okText="Lançamento registrado." errorMap={ERROR_MSG} />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Receitas (mês)" value={formatCurrency(resume.receitas)} hint={`${resume.totalMovimentos} lançamentos`} />
        <MetricCard title="Despesas (mês)" value={formatCurrency(resume.despesas)} hint={`Saldo ${formatCurrency(resume.saldo)}`} />
        <MetricCard title="Saldo (mês)" value={formatCurrency(resume.saldo)} hint={resume.saldo >= 0 ? "Positivo" : "Negativo"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo lançamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createFinancialAction} className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              Tipo*
              <SelectField
                name="type"
                defaultValue="DESPESA"
                required
                options={[
                  { value: "RECEITA", label: "Receita" },
                  { value: "DESPESA", label: "Despesa" },
                  { value: "TRANSFERENCIA", label: "Transferência" },
                ]}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Categoria*
              {finCategories.length > 0 ? (
                <SelectField
                  name="category"
                  defaultValue=""
                  placeholder="Selecione..."
                  required
                  options={finCategories.map((c) => ({ value: c.name, label: c.name }))}
                />
              ) : (
                <Input name="category" required placeholder="Ex.: Aluguel (crie em Categorias)" />
              )}
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Valor (R$)*
              <Input name="amount" required inputMode="decimal" placeholder="100,00" />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Descrição*
              <Textarea name="description" required placeholder="Detalhe o lançamento" rows={2} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Data*
              <Input name="movementDate" type="date" required defaultValue={today} />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-3">
              Caixa (opcional)
              <SelectField
                name="cashBoxId"
                defaultValue=""
                placeholder="Nenhum"
                options={[{ value: "", label: "Nenhum" }, ...cashboxes.map((c) => ({ value: String(c.id), label: c.name }))]}
              />
            </label>
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
        <CardContent className="flex flex-col gap-4">
          <form className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col gap-1 text-sm">
              Tipo
              <SelectField
                name="type"
                defaultValue={typeFilterRaw}
                options={[
                  { value: "all", label: "Todos" },
                  { value: "RECEITA", label: "Receita" },
                  { value: "DESPESA", label: "Despesa" },
                  { value: "TRANSFERENCIA", label: "Transferência" },
                ]}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Buscar
              <Input name="q" defaultValue={params.q ?? ""} placeholder="Categoria ou descrição" className="w-56" />
            </label>
            <Button type="submit" variant="outline">Filtrar</Button>
            {(q || typeFilterRaw !== "all") ? <a href="/dashboard/financeiro" className="text-sm text-muted-foreground underline">Limpar</a> : null}
          </form>
        </CardContent>
        <CardContent className="px-0 pb-0">
          {movements.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState title="Sem lançamentos" description="Registre o primeiro acima." icon={Wallet} />
            </div>
          ) : (
            <div className="overflow-x-auto"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{new Date(m.movementDate).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell><Badge variant={m.type === "RECEITA" ? "default" : m.type === "DESPESA" ? "destructive" : "secondary"}>{m.type}</Badge></TableCell>
                    <TableCell>{m.category}</TableCell>
                    <TableCell className="max-w-xs truncate">{m.description}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(m.amount)}</TableCell>
                    <TableCell><Badge variant={m.paid ? "default" : "outline"}>{m.paid ? "Pago" : "Pendente"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <form action={togglePaidAction}>
                          <input type="hidden" name="movementId" value={m.id} />
                          <input type="hidden" name="paid" value={m.paid ? "false" : "true"} />
                          <Button variant="outline" size="sm" type="submit">
                            {m.paid ? "Desmarcar" : "Dar baixa"}
                          </Button>
                        </form>
                        <EditFinancialDialog
                          movement={{
                            id: m.id,
                            type: m.type,
                            category: m.category,
                            description: m.description,
                            amount: m.amount,
                            movementDate: m.movementDate.toISOString(),
                            cashBoxId: m.cashBoxId,
                          }}
                          categories={finCategories}
                          cashboxes={cashboxes}
                        />
                        <DeleteFinancialDialog id={m.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
