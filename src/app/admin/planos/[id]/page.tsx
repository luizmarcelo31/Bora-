import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { salvarPlanoAction } from "../actions";
import { ehFeatureAtiva } from "@/lib/feature-flags";
import { FEATURE_KEYS } from "@/lib/feature-flags";
import { formatCurrency } from "@/lib/validators";

export default async function EditarPlanoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const { id } = await params;
  const planoId = Number(id);
  if (!Number.isInteger(planoId) || planoId <= 0) notFound();

  const plano = await prisma.plan.findUnique({ where: { id: planoId } });
  if (!plano) notFound();

  // Recupera o estado atual dos flags em tempo de render (não é de escrita).
  const flagsAtivas = await Promise.all(
    FEATURE_KEYS.map(async (key) => ({
      key,
      ativo: await ehFeatureAtiva(key, planoId),
    }))
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
      <PageHeader
        title={`Editar ${plano.name}`}
        badge="Receita"
        description="Preços em reais. Empresas já assinadas mantêm o valor que contrataram."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/planos">
              <ArrowLeft aria-hidden="true" className="size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulário de edição */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dados do plano</CardTitle>
            <p className="text-xs text-muted-foreground">
              Edite os limites e o preço. As mudanças sobem imediatamente para os planos
              ativos da plataforma.
            </p>
          </CardHeader>
          <CardContent>
            <form action={salvarPlanoAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium text-muted-foreground">Nome do plano *</span>
                  <Input name="name" required defaultValue={plano.name} placeholder="Ex.: Básico" />
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium text-muted-foreground">Preço mensal (R$) *</span>
                  <Input
                    name="monthlyPrice"
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={(plano.monthlyPrice / 100).toFixed(2)}
                    placeholder="0.00"
                  />
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium text-muted-foreground">Preço anual (R$)</span>
                  <Input
                    name="annualPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={plano.annualPrice ? (plano.annualPrice / 100).toFixed(2) : ""}
                    placeholder="0.00"
                  />
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium text-muted-foreground">Dias de experimentação</span>
                  <Input
                    name="trialDays"
                    type="number"
                    min={0}
                    max={365}
                    defaultValue={plano.trialDays}
                    placeholder="0 = cobrar imediatamente"
                  />
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium text-muted-foreground">Recursos (um por linha)</span>
                  <textarea
                    name="features"
                    rows={5}
                    defaultValue={plano.features.join("\n")}
                    placeholder={"Ao menos um recurso\nEx.: Gestão de estoque\nAté 5 usuários\nSuporte prioritário"}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium text-muted-foreground">Limites do plano</span>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Usuários</p>
                      <Input
                        name="maxUsers"
                        type="number"
                        min={1}
                        defaultValue={plano.maxUsers ?? ""}
                        placeholder="Ilimitado"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Produtos</p>
                      <Input
                        name="maxProducts"
                        type="number"
                        min={1}
                        defaultValue={plano.maxProducts ?? ""}
                        placeholder="Ilimitado"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Vendas/mês</p>
                      <Input
                        name="maxSalesPerMonth"
                        type="number"
                        min={1}
                        defaultValue={plano.maxSalesPerMonth ?? ""}
                        placeholder="Ilimitado"
                      />
                    </div>
                  </div>
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-medium text-muted-foreground">Features que o plano oferece</span>
                  <div className="grid grid-cols-1 gap-2">
                    {FEATURE_KEYS.map((key) => {
                      const ativo = flagsAtivas.some((f) => f.key === key && f.ativo);
                      return (
                        <label key={key} className="flex items-center gap-2 py-1.5 border rounded-lg border-border">
                          <input
                            type="checkbox"
                            name={`features`}
                            value={key}
                            defaultChecked={ativo}
                            className="rounded border-input bg-background focus:ring-ring focus:ring-offset-2"
                          />
                          <span className="text-sm text-muted-foreground">{key.replace(/-/g, " ")}</span>
                        </label>
                      );
                    })}
                  </div>
                </label>
              </div>

              <div className="sm:col-span-2 flex flex-col justify-end gap-2 border-t border-border pt-4">
                <Button type="submit" className="w-full">
                  Salvar plano
                </Button>
                <Button type="button" variant="ghost" asChild className="w-full">
                  <Link href="/admin/planos">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Cards de contexto */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">Preço mensal</dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    {formatCurrency(plano.monthlyPrice)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">Preço anual</dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    {plano.annualPrice ? formatCurrency(plano.annualPrice) : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">Limites</dt>
                  <dd className="text-sm font-semibold">
                    {plano.maxUsers
                      ? `${plano.maxUsers} usuários`
                      : "Ilimitado"}
                    {" · "}
                    {plano.maxProducts
                      ? `${plano.maxProducts} produtos`
                      : "Ilimitado"}
                    {" · "}
                    {plano.maxSalesPerMonth
                      ? `${plano.maxSalesPerMonth} vendas/mês`
                      : "Ilimitado"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">TrialDays</dt>
                  <dd className="text-sm font-semibold">{plano.trialDays} dias</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">Features ativas</dt>
                  <dd className="text-sm font-semibold">
                    {FEATURE_KEYS.filter((k) =>
                      flagsAtivas.some((f) => f.key === k && f.ativo)
                    ).length}{" "}
                    de {FEATURE_KEYS.length}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recursos ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {FEATURE_KEYS.map((key) => {
                  const ativo = flagsAtivas.some((f) => f.key === key && f.ativo);
                  return (
                    <li key={key} className="flex items-center justify-between gap-2">
                      <span className="truncate text-muted-foreground">
                        {key.replace(/-/g, " ")}
                      </span>
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                        ativo
                          ? "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {ativo ? "Ativa" : "Inativa"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
