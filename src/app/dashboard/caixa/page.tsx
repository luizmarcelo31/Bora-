import { redirect } from "next/navigation";
import type { Funcao } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableCard } from "@/components/shared/TableCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { SearchParamToast } from "@/components/shared/SearchParamToast";
import { Wallet } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { formatCurrency } from "@/lib/validators";
import { openCashBoxAction } from "./actions";
import { CloseCashBoxDialog } from "./close-dialog";

const ERROR_MSG: Record<string, string> = {
  invalid: "Dados inválidos. Confira nome e valores.",
  close: "Não foi possível fechar (caixa já fechada ou inexistente).",
  forbidden: "Seu role não tem permissão para operar o caixa.",
  fail: "Não foi possível concluir. Tente novamente.",
};

export default async function CaixaPage() {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/caixa");
  try {
    requirePermission(dbUser.role as Funcao, "cashbox.view");
  } catch {
    redirect("/unauthorized");
  }

  const boxes = await prisma.cashBox.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });
  const openBoxes = boxes.filter((b) => b.status === "ABERTO");
  const closedCount = boxes.length - openBoxes.length;
  const saldoAbertos = openBoxes.reduce((s, b) => s + b.currentBalance, 0);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
      <PageHeader title="Caixa" badge={tenant.name} description="Abertura, saldo e fechamento — com preview de sobra/falta." />
      <SearchParamToast okText="Operação registrada." errorMap={ERROR_MSG} />

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border bg-card p-2 text-center">
          <p className="text-lg font-semibold tabular-nums">{openBoxes.length}</p>
          <p className="text-[10px] text-muted-foreground">Abertos</p>
        </div>
        <div className="rounded-lg border bg-card p-2 text-center">
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(saldoAbertos)}</p>
          <p className="text-[10px] text-muted-foreground">Saldo</p>
        </div>
        <div className="rounded-lg border bg-card p-2 text-center">
          <p className="text-lg font-semibold tabular-nums">{boxes.length}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <details className="rounded-xl border border-border/50 bg-card shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            Abrir caixa
            <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">+ Expandir</span>
          </summary>
          <div className="px-4 pb-4">
            <form action={openCashBoxAction} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Nome*
                <Input name="name" required placeholder="Caixa 1" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Saldo inicial (R$)
                <Input name="openingBalance" inputMode="decimal" placeholder="0,00" />
              </label>
              <Button type="submit">Abrir</Button>
            </form>
          </div>
        </details>

        <Card>
          <CardHeader>
            <CardTitle>Fechar caixa</CardTitle>
          </CardHeader>
          <CardContent>
            <CloseCashBoxDialog openBoxes={openBoxes.map((b) => ({ id: b.id, name: b.name, currentBalance: b.currentBalance }))} tenantId={tenant.id} userId={dbUser.id} />
          </CardContent>
        </Card>
      </div>

      <TableCard
        title="Histórico de caixas"
        description="Abertura, saldo e fechamento."
        footer={`${boxes.length} caixa(s)`}
      >
          {boxes.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState title="Nenhum caixa" description="Abra o primeiro acima." icon={Wallet} />
            </div>
          ) : (
            <>
            {/* Mobile: lista compacta (skill §8) — tabela só no desktop */}
            <ul className="flex flex-col gap-2 p-3 md:hidden">
              {boxes.map((b) => (
                <li key={b.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold">{b.name}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      Abertura {formatCurrency(b.openingBalance)}
                      {b.closingBalance !== null ? ` · Fech. ${formatCurrency(b.closingBalance)}` : ""}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(b.currentBalance)}</span>
                  <StatusBadge status={b.status === "ABERTO" ? "open" : "closed"} />
                </li>
              ))}
            </ul>
            <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Abertura</TableHead>
                  <TableHead>Saldo atual</TableHead>
                  <TableHead>Fechamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boxes.map((b) => {
                  const diff = b.closingBalance !== null ? b.closingBalance - b.currentBalance : null;
                  return (
                  <TableRow key={b.id}>
                    <TableCell className="font-semibold">{b.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={b.status === "ABERTO" ? "open" : "closed"} />
                    </TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(b.openingBalance)}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(b.currentBalance)}</TableCell>
                    <TableCell className="tabular-nums">
                      {b.closingBalance !== null ? (
                        <span className="flex flex-col">
                          <span>{formatCurrency(b.closingBalance)}</span>
                          {diff !== null && diff !== 0 ? <span className={`text-xs ${diff > 0 ? "text-[var(--status-success-fg)]" : "text-destructive"}`}>{diff > 0 ? `Sobra ${formatCurrency(diff)}` : `Falta ${formatCurrency(Math.abs(diff))}`}</span> : null}
                        </span>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
            </div>
            </>
          )}
      </TableCard>
    </main>
  );
}
