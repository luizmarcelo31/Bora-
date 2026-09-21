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
import { ReportActions } from "@/components/shared/ReportActions";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { SearchParamToast } from "@/components/shared/SearchParamToast";
import { Package } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusBadge, getStockStatus, getStockStatusLabel } from "@/components/shared/StatusBadge";
import { SelectField } from "@/components/ui/select-field";
import { moveStockAction, getStockPageData } from "./actions";
import { EditInventoryDialog } from "./edit-inventory-dialog";

const ERROR_MSG: Record<string, string> = {
  invalid: "Dados inválidos. Confira produto, tipo e quantidade.",
  stock: "Não foi possível movimentar (verifique o saldo).",
  forbidden: "Seu role não tem permissão para movimentar estoque.",
  fail: "Não foi possível concluir. Tente novamente.",
};

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string; q?: string; filter?: string }>;
}) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/estoque");
  try {
    requirePermission(dbUser.role as Role, "inventory.view");
  } catch {
    redirect("/unauthorized");
  }
  const params = await searchParams;
  const { products: allProducts, history } = await getStockPageData(tenant.id);

  const q = (params.q ?? "").toLowerCase().trim();
  const filter = params.filter ?? "all";
  const products = allProducts.filter((p) => {
    const qty = p.inventory?.quantity ?? 0;
    const min = p.inventory?.minimumStock ?? 0;
    const isLow = qty <= min;
    if (filter === "low" && !isLow) return false;
    if (filter === "ok" && isLow) return false;
    if (q && !p.name.toLowerCase().includes(q)) return false;
    return true;
  });

  const total = allProducts.length;
  const baixo = allProducts.filter((p) => (p.inventory?.quantity ?? 0) <= (p.inventory?.minimumStock ?? 0)).length;
  const totalUnidades = allProducts.reduce((s, p) => s + (p.inventory?.quantity ?? 0), 0);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Estoque"
        badge={tenant.name}
        description="Saldo, limites e histórico — com alertas de baixo estoque."
      />
      <SearchParamToast okText="Movimentação registrada." errorMap={ERROR_MSG} />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Produtos" value={String(total)} hint={`${baixo} em baixo estoque`} />
        <MetricCard title="Unidades em estoque" value={String(totalUnidades)} hint={total > 0 ? `Média ${(totalUnidades/total).toFixed(1)} por produto` : "—"} />
        <MetricCard title="Alertas" value={String(baixo)} hint={baixo > 0 ? "Repor em breve" : "Tudo ok"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimentar estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={moveStockAction} className="grid gap-3 sm:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Produto*
              <SelectField
                name="productId"
                defaultValue=""
                placeholder="Selecione..."
                required
                options={products.map((p) => ({ value: String(p.id), label: `${p.name} (atual: ${p.inventory?.quantity ?? 0})` }))}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Tipo*
              <SelectField
                name="type"
                defaultValue="ENTRADA"
                required
                options={[
                  { value: "ENTRADA", label: "Entrada" },
                  { value: "SAIDA", label: "Saída" },
                  { value: "AJUSTE", label: "Ajuste de baixa" },
                ]}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Quantidade*
              <Input name="quantity" required inputMode="numeric" placeholder="10" />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-3">
              Motivo
              <Input name="reason" placeholder="Ex.: compra fornecedor" />
            </label>
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
        <CardContent className="flex flex-col gap-4">
          <ReportActions
            title="Relatório de estoque"
            subtitle={`${tenant.name} — ${products.length} produtos · ${totalUnidades} unidades · ${baixo} em baixo estoque`}
            columns={["Produto", "Quantidade", "Mínimo", "Máximo", "Situação"]}
            rows={products.map((p) => {
              const qty = p.inventory?.quantity ?? 0;
              const min = p.inventory?.minimumStock ?? 0;
              const max = p.inventory?.maximumStock ?? null;
              return [p.name, String(qty), String(min), max === null ? "—" : String(max), qty <= min ? "Baixo" : "Ok"];
            })}
            footer={["Total", String(totalUnidades), "", "", `${baixo} em baixo`]}
            fileName={`estoque-${tenant.id}-${new Date().toISOString().slice(0, 10)}`}
          />
          <div className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col gap-1 text-sm">
              Buscar
              <Input name="q" defaultValue={params.q ?? ""} placeholder="Nome do produto" className="w-56" />
            </label>
            <Button type="submit" variant="outline">Filtrar</Button>
            {(q || filter !== "all") ? <a href="/dashboard/estoque" className="text-sm text-muted-foreground underline">Limpar</a> : null}
          </div>
          <FilterTabs
            value={filter}
            options={[
              { v: "all", label: "Todos" },
              { v: "low", label: "Baixo" },
              { v: "ok", label: "Ok" },
            ].map((t) => ({
              value: t.v,
              label: t.label,
              href: `/dashboard/estoque?filter=${t.v}&q=${encodeURIComponent(q)}`,
            }))}
          />
        </CardContent>
        <CardContent className="px-0 pb-0">
          {products.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState title="Nenhum produto" description={q || filter !== "all" ? "Nenhum resultado para o filtro." : "Cadastre em Produtos primeiro."} icon={Package} />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Mínimo</TableHead>
                  <TableHead>Máximo</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const qty = p.inventory?.quantity ?? 0;
                  const min = p.inventory?.minimumStock ?? 0;
                  const max = p.inventory?.maximumStock ?? null;
                  const status = getStockStatus(qty, min);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="tabular-nums">{qty}</TableCell>
                      <TableCell className="tabular-nums">{min}</TableCell>
                      <TableCell className="tabular-nums">{max ?? "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={status} label={getStockStatusLabel(qty, min)} />
                      </TableCell>
                      <TableCell>
                        <EditInventoryDialog
                          productId={p.id}
                          productName={p.name}
                          minimumStock={min}
                          maximumStock={max}
                        />
                      </TableCell>
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
                    <TableCell className="tabular-nums">{new Date(m.createdAt).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{m.inventory.product.name}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={m.type === "ENTRADA" ? "entry" : m.type === "SAIDA" ? "exit" : "adjustment"}
                      />
                    </TableCell>
                    <TableCell className="tabular-nums">{m.quantity}</TableCell>
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
