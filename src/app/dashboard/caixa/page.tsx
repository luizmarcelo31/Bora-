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
import { formatCurrency } from "@/lib/validators";
import { openCashBoxAction, closeCashBoxAction } from "./actions";

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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <PageHeader title="Caixa" badge={tenant.name} description="Abertura, saldo e fechamento." />

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
            {openBoxes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum caixa aberto.</p>
            ) : (
              <form action={closeCashBoxAction} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  Caixa*
                  <select
                    name="cashBoxId"
                    required
                    defaultValue=""
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="" disabled>
                      Selecione...
                    </option>
                    {openBoxes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} (saldo {formatCurrency(b.currentBalance)})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Valor contado (R$)*
                  <Input name="closingBalance" required inputMode="decimal" placeholder="0,00" />
                </label>
                <Button type="submit">Fechar</Button>
              </form>
            )}
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
                {boxes.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.name}</TableCell>
                    <TableCell>{b.status === "OPEN" ? "Aberto" : "Fechado"}</TableCell>
                    <TableCell>{formatCurrency(b.openingBalance)}</TableCell>
                    <TableCell>{formatCurrency(b.currentBalance)}</TableCell>
                    <TableCell>{b.closingBalance !== null ? formatCurrency(b.closingBalance) : "—"}</TableCell>
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
