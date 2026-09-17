import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
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
import { MetricCard } from "@/components/shared/MetricCard";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/validators";
import { openCashBoxAction } from "./actions";
import { CloseCashBoxDialog } from "./close-dialog";

const ERROR_MSG: Record<string, string> = {
  invalid: "Dados inválidos. Confira nome e valores.",
  close: "Não foi possível fechar (caixa já fechada ou inexistente).",
  forbidden: "Seu role não tem permissão para operar o caixa.",
};

export default async function CaixaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/caixa");
  try {
    requirePermission(dbUser.role as Role, "cashbox.view");
  } catch {
    redirect("/unauthorized");
  }
  const params = await searchParams;

  const boxes = await prisma.cashBox.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });
  const openBoxes = boxes.filter((b) => b.status === "OPEN");
  const closedCount = boxes.length - openBoxes.length;
  const saldoAbertos = openBoxes.reduce((s, b) => s + b.currentBalance, 0);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader title="Caixa" badge={tenant.name} description="Abertura, saldo e fechamento — com preview de sobra/falta." />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Abertos" value={String(openBoxes.length)} hint={`${closedCount} fechados`} />
        <MetricCard title="Saldo em abertos" value={formatCurrency(saldoAbertos)} hint={`${openBoxes.length} caixa(s)`} />
        <MetricCard title="Total caixas" value={String(boxes.length)} hint={boxes.length > 0 ? `Último: ${boxes[0].name}` : "Nenhum ainda"} />
      </div>

      {params.error ? (
        <p className="text-sm text-destructive">{ERROR_MSG[params.error] ?? "Erro no caixa."}</p>
      ) : null}
      {params.ok ? <p className="text-sm text-muted-foreground">Operação registrada.</p> : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Abrir caixa</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fechar caixa</CardTitle>
          </CardHeader>
          <CardContent>
            <CloseCashBoxDialog openBoxes={openBoxes.map((b) => ({ id: b.id, name: b.name, currentBalance: b.currentBalance }))} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de caixas</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {boxes.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState title="Nenhum caixa" description="Abra o primeiro acima." />
            </div>
          ) : (
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
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{b.status === "OPEN" ? <Badge>Aberto</Badge> : <Badge variant="secondary">Fechado</Badge>}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(b.openingBalance)}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(b.currentBalance)}</TableCell>
                    <TableCell className="tabular-nums">
                      {b.closingBalance !== null ? (
                        <span className="flex flex-col">
                          <span>{formatCurrency(b.closingBalance)}</span>
                          {diff !== null && diff !== 0 ? <span className={`text-xs ${diff > 0 ? "text-emerald-600" : "text-destructive"}`}>{diff > 0 ? `Sobra ${formatCurrency(diff)}` : `Falta ${formatCurrency(Math.abs(diff))}`}</span> : null}
                        </span>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
