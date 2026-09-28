import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TableCard } from "@/components/shared/TableCard";
import { StatusPill } from "@/components/shared/StatusPill";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/validators";
import { salvarPlanoAction, alternarPlanoAtivoAction } from "./actions";

const ERROS: Record<string, string> = {
  invalid: "Verifique o nome e os preços informados.",
};

export default async function PlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string; novo?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;

  const planos = await prisma.plan.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { monthlyPrice: "asc" }],
    include: { _count: { select: { subscriptions: true } } },
  });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
      <AdminBreadcrumb items={[{ label: "Início", href: "/admin" }, { label: "Visão geral" }]} />
        <PageHeader
        title="Planos"
        badge="Receita"
        description="O que a plataforma vende. A assinatura é o que liga um plano a uma empresa."
      />

      {params.error ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {ERROS[params.error] ?? "Não foi possível salvar."}
        </p>
      ) : null}
      {params.ok ? (
        <p role="status" className="rounded-lg border border-[var(--status-success-dot)]/40 bg-[var(--status-success-bg)] p-3 text-sm text-[var(--status-success-fg)]">
          Plano salvo.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Novo plano</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={salvarPlanoAction} className="grid gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Nome*
                <Input name="name" required placeholder="Básico" />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-sm">
                  Preço mensal (R$)*
                  <Input name="monthlyPrice" required type="number" step="0.01" min="0" placeholder="99.90" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Preço anual (R$)
                  <Input name="annualPrice" type="number" step="0.01" min="0" placeholder="999.00" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-sm">
                  Limite de usuários
                  <Input name="maxUsers" type="number" min="1" placeholder="5" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Limite de produtos
                  <Input name="maxProducts" type="number" min="1" placeholder="1000" />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                Dias de experimentação
                <Input name="trialDays" type="number" min="0" max="365" defaultValue="14" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Recursos (um por linha)
                <textarea
                  name="features"
                  rows={4}
                  placeholder={"Até 5 usuários\nGestão de produtos\nSuporte por e-mail"}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                />
              </label>
              <Button type="submit">Criar plano</Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <TableCard
            title="Planos cadastrados"
            description="Preços em reais; o banco guarda centavos."
            footer={`${planos.length} plano(s)`}
          >
            {planos.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Nenhum plano criado. Comece pelo formulário ao lado.
              </p>
            ) : (
              <>
              {/* Mobile: lista compacta — tabela só no desktop */}
              <ul className="flex flex-col gap-2 p-3 md:hidden">
                {planos.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link href={`/admin/planos/${p.id}`} className="truncate text-sm font-semibold hover:underline">
                        {p.name}
                      </Link>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatCurrency(p.monthlyPrice)}/mês · {p._count.subscriptions} empresas
                      </span>
                    </div>
                    <StatusPill tom={p.active ? "positivo" : "neutro"}>
                      {p.active ? "Disponível" : "Indisponível"}
                    </StatusPill>
                  </li>
                ))}
              </ul>
              <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plano</TableHead>
                    <TableHead className="text-right">Mensal</TableHead>
                    <TableHead className="text-right">Anual</TableHead>
                    <TableHead className="text-right">Limites</TableHead>
                    <TableHead className="text-right">Empresas</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <span className="font-semibold">{p.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {p.trialDays > 0 ? `${p.trialDays} dias de experimentação` : "Sem experimentação"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(p.monthlyPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.annualPrice ? formatCurrency(p.annualPrice) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {p.maxUsers ? `${p.maxUsers} usuários` : "Ilimitado"}
                        <br />
                        {p.maxProducts ? `${p.maxProducts} produtos` : "Ilimitado"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{p._count.subscriptions}</TableCell>
                      <TableCell>
                        <StatusPill tom={p.active ? "positivo" : "neutro"}>
                          {p.active ? "Disponível" : "Indisponível"}
                        </StatusPill>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/planos/${p.id}`}>Editar</Link>
                          </Button>
                          <form action={alternarPlanoAtivoAction}>
                            <input type="hidden" name="id" value={p.id} />
                            <Button variant="ghost" size="sm" type="submit">
                              {p.active ? "Desativar" : "Ativar"}
                            </Button>
                          </form>
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
        </div>
      </div>
    </main>
  );
}



