import { redirect } from "next/navigation";
import type { Funcao } from "@prisma/client";
import { prisma } from "@/lib/db";
import { FinancialService } from "@/services";
import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { TableCard } from "@/components/shared/TableCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { LazyReportActions } from "@/components/shared/LazyReportActions";
import { getCompanyLogoUrl } from "@/lib/get-company-logo";
import { SearchParamToast } from "@/components/shared/SearchParamToast";
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
  fail: "Não foi possível concluir. Tente novamente.",
};

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string; type?: string; q?: string }>;
}) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/financeiro");
  try {
    requirePermission(dbUser.role as Funcao, "financial.view");
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
      : { type: typeFilter as import("@prisma/client").TipoMovimentacaoFinanceira };

  const [resume, allMovements, cashboxes, finCategories] = await Promise.all([
    FinancialService.getFinancialResume(tenant.id, monthStart, now),
    prisma.financialMovement.findMany({
      where: { tenantId: tenant.id, ...whereType },
      orderBy: { movementDate: "desc" },
      take: 50,
    }),
    prisma.cashBox.findMany({
      where: { tenantId: tenant.id, status: "ABERTO" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { tenantId: tenant.id, kind: "FINANCEIRO", active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const movements = allMovements.filter((m) => {
    if (!q) return true;
    return `${m.category} ${m.description}`.toLowerCase().includes(q);
  });

  const today = now.toISOString().slice(0, 10);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
      <PageHeader
        title="Financeiro"
        badge={tenant.name}
        description="Receitas, despesas e resultado — com filtros e baixa."
      />
      <SearchParamToast okText="Lançamento registrado." errorMap={ERROR_MSG} />

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border bg-card p-2 text-center">
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(resume.receitas)}</p>
          <p className="text-[10px] text-muted-foreground">Receitas</p>
        </div>
        <div className="rounded-lg border bg-card p-2 text-center">
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(resume.despesas)}</p>
          <p className="text-[10px] text-muted-foreground">Despesas</p>
        </div>
        <div className="rounded-lg border bg-card p-2 text-center">
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(resume.saldo)}</p>
          <p className="text-[10px] text-muted-foreground">Saldo</p>
        </div>
      </div>

      {/* DRE — Demonstrativo de Resultado do Exercício */}
      <Card>
        <CardHeader>
          <CardTitle>DRE — Resultado do Período</CardTitle>
          <p className="text-sm text-muted-foreground">Receitas menos despesas = resultado.</p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-[var(--status-success-bg)] border border-[var(--status-success-dot)]/30 p-4">
            <p className="text-xs text-muted-foreground">Receitas Totais</p>
            <p className="text-xl font-semibold text-[var(--status-success-fg)]">{formatCurrency(resume.receitas)}</p>
          </div>
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4">
            <p className="text-xs text-muted-foreground">Despesas Totais</p>
            <p className="text-xl font-semibold text-destructive">{formatCurrency(resume.despesas)}</p>
          </div>
          <div className={`rounded-lg p-4 border ${resume.saldo >= 0 ? "bg-[var(--status-success-bg)] border-[var(--status-success-dot)]/30" : "bg-destructive/10 border-destructive/30"}`}>
            <p className="text-xs text-muted-foreground">Resultado Líquido</p>
            <p className={`text-xl font-semibold ${resume.saldo >= 0 ? "text-[var(--status-success-fg)]" : "text-destructive"}`}>{formatCurrency(resume.saldo)}</p>
          </div>
        </CardContent>
      </Card>

      <details className="rounded-xl border border-border/50 bg-card shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          Novo lançamento
          <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">+ Expandir</span>
        </summary>
        <div className="px-4 pb-4">
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
        </div>
      </details>

      <TableCard
        title="Últimos lançamentos"
        description="Filtre, exporte e gerencie."
        footer={`${movements.length} lançamento(s)`}
        toolbar={
          <div className="flex flex-col gap-4">
          <LazyReportActions
            title="Relatório financeiro"
            subtitle={`${tenant.name} — mês atual · receitas ${formatCurrency(resume.receitas)} · despesas ${formatCurrency(resume.despesas)} · saldo ${formatCurrency(resume.saldo)}`}
            columns={["Data", "Tipo", "Categoria", "Descrição", "Valor", "Pago"]}
            rows={movements.map((m) => [
              new Date(m.movementDate).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
              m.type,
              m.category,
              m.description,
              formatCurrency(m.amount),
              m.paid ? "Pago" : "Pendente",
            ])}
            footer={["", "", "", "Saldo", formatCurrency(resume.saldo), ""]}
            fileName={`financeiro-${tenant.id}-${now.toISOString().slice(0, 10)}`}
            orientation="landscape"
            companyLogoUrl={await getCompanyLogoUrl(tenant.id)}
          />
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
          </div>
        }
      >
          {movements.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState title="Sem lançamentos" description="Registre o primeiro acima." icon={Wallet} />
            </div>
          ) : (
            <>
            {/* Mobile: lista compacta (skill §8) — tabela só no desktop */}
            <ul className="flex flex-col gap-2 p-3 md:hidden">
              {movements.map((m) => (
                <li key={m.id} className="flex flex-col gap-2 rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-semibold">{m.description}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.movementDate).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })} · {m.category}
                      </span>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(m.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.paid ? "paid" : "pending"} />
                    <StatusBadge
                      status={m.type === "RECEITA" ? "income" : m.type === "DESPESA" ? "expense" : "transfer"}
                    />
                    <div className="ml-auto flex shrink-0 gap-1">
                      <form action={togglePaidAction}>
                        <input type="hidden" name="movementId" value={m.id} />
                        <input type="hidden" name="paid" value={m.paid ? "false" : "true"} />
                        <Button variant="outline" size="sm" type="submit" className="hit-area-44">
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
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden md:block">
            <Table>
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
                    <TableCell>{new Date(m.movementDate).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={m.type === "RECEITA" ? "income" : m.type === "DESPESA" ? "expense" : "transfer"}
                      />
                    </TableCell>
                    <TableCell>{m.category}</TableCell>
                    <TableCell className="max-w-xs truncate">{m.description}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(m.amount)}</TableCell>
                    <TableCell>
                      <StatusBadge status={m.paid ? "paid" : "pending"} />
                    </TableCell>
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
            </Table>
            </div>
            </>
          )}
      </TableCard>
    </main>
  );
}
