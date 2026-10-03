import type { Funcao } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableCard } from "@/components/shared/TableCard";
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
import { LazyReportActions } from "@/components/shared/LazyReportActions";
import { getCompanyLogoUrl } from "@/lib/get-company-logo";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { SearchParamToast } from "@/components/shared/SearchParamToast";
import { Package } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusBadge, getStockStatus, getStockStatusLabel } from "@/components/shared/StatusBadge";
import { LinhaLista, AvatarProduto } from "@/components/shared/LinhaLista";
import { Valor } from "@/components/shared/Valor";
import { SelectField } from "@/components/ui/select-field";
import { moveStockAction, getStockPageData } from "./actions";
import { EditInventoryDialog } from "./edit-inventory-dialog";
import Link from "next/link";

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
    requirePermission(dbUser.role as Funcao, "inventory.view");
  } catch {
    redirect("/unauthorized");
  }
  const params = await searchParams;
  const { products: allProducts, history } = await getStockPageData(tenant.id);

  const q = (params.q ?? "").toLowerCase().trim();
  const filter = params.filter ?? "all";
  const temFiltro = Boolean(q) || filter !== "all";
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
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
      <PageHeader
        title="Estoque"
        badge={tenant.name}
        description="Saldo, limites e histórico — com alertas de baixo estoque."
      />
      <SearchParamToast okText="Movimentação registrada." errorMap={ERROR_MSG} />

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border bg-card p-2 text-center">
          <p className="text-lg font-semibold tabular-nums">{total}</p>
          <p className="text-[10px] text-muted-foreground">Produtos</p>
        </div>
        <div className="rounded-lg border bg-card p-2 text-center">
          <p className="text-lg font-semibold tabular-nums">{totalUnidades}</p>
          <p className="text-[10px] text-muted-foreground">Unidades</p>
        </div>
        <div className="rounded-lg border bg-card p-2 text-center">
          <p className="text-lg font-semibold tabular-nums">{baixo}</p>
          <p className="text-[10px] text-muted-foreground">Alertas</p>
        </div>
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
          <LazyReportActions
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
            companyLogoUrl={await getCompanyLogoUrl(tenant.id)}
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
              <EmptyState
                title="Nenhum produto"
                description={
                  temFiltro
                    ? "Nenhum resultado para o filtro."
                    : "Cadastre produtos para começar a movimentar o estoque."
                }
                icon={Package}
                action={
                  temFiltro ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/estoque">Limpar filtros</Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm">
                      <Link href="/dashboard/produtos">Cadastrar produto</Link>
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <>
            {/* Mobile: lista compacta (skill §8) — tabela só no desktop */}
            <ul className="flex flex-col gap-2 p-3 md:hidden">
              {products.map((p) => {
                const qty = p.inventory?.quantity ?? 0;
                const min = p.inventory?.minimumStock ?? 0;
                const max = p.inventory?.maximumStock ?? null;
                const status = getStockStatus(qty, min);
                const tomQtd =
                  qty <= 0 ? ("negativo" as const) : qty <= min ? ("atencao" as const) : undefined;
                return (
                  <li key={p.id}>
                    <LinhaLista
                      avatar={<AvatarProduto nome={p.name} />}
                      titulo={p.name}
                      apoio={`mín ${min}${max !== null ? ` · máx ${max}` : ""}`}
                      badge={<StatusBadge status={status} label={getStockStatusLabel(qty, min)} />}
                      valor={
                        <>
                          <Valor tom={tomQtd ?? "neutro"}>{qty}</Valor>
                          <span className="text-[10px] font-normal text-muted-foreground"> un.</span>
                        </>
                      }
                      acoes={
                        <EditInventoryDialog
                          productId={p.id}
                          productName={p.name}
                          minimumStock={min}
                          maximumStock={max}
                        />
                      }
                      acoesNaLinha
                    />
                  </li>
                );
              })}
            </ul>
            <div className="hidden md:block">
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
                      <TableCell className="font-semibold">{p.name}</TableCell>
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
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {history.length > 0 ? (
        <TableCard
          title="Últimas movimentações"
          description="Entradas, saídas e ajustes."
          footer={`${history.length} movimentação(ões)`}
        >
            {/* Mobile: lista compacta (skill §8) — tabela só no desktop */}
            <ul className="flex flex-col gap-2 p-3 md:hidden">
              {history.map((m) => (
                <li key={m.id}>
                  <LinhaLista
                    titulo={m.inventory.product.name}
                    apoio={`${new Date(m.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · ${m.reason ?? "—"}`}
                    badge={
                      <StatusBadge
                        status={m.type === "ENTRADA" ? "entry" : m.type === "SAIDA" ? "exit" : "adjustment"}
                      />
                    }
                    valor={
                      <Valor
                        tom={m.type === "ENTRADA" ? "positivo" : m.type === "SAIDA" ? "negativo" : "atencao"}
                        sinal={m.type === "ENTRADA"}
                      >
                        {m.type === "ENTRADA" ? m.quantity : -m.quantity}
                      </Valor>
                    }
                  />
                </li>
              ))}
            </ul>
            <div className="hidden md:block">
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
                    <TableCell className="tabular-nums">{new Date(m.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</TableCell>
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
            </div>
        </TableCard>
      ) : null}
    </main>
  );
}
