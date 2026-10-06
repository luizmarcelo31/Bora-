import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { LinhaLista } from "@/components/shared/LinhaLista";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { salvarFeatureFlagAction } from "../actions";
import { ehFeatureAtiva, todosOsNovesAtivos, salvarFeatureFlag, FEATURE_KEYS, FeatureFlag } from "@/lib/feature-flags";

export default async function FeaturesPage() {
  await requireSuperAdmin();
  const flags = await prisma.featureFlag.findMany({
    orderBy: [{ key: "asc" }],
  });
  const flagsAtivas = await todosOsNovesAtivos(1);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
      <AdminBreadcrumb items={[{ label: "Início", href: "/admin" }, { label: "Recursos" }]} />
      <PageHeader
        title="Recursos"
        badge="Plataforma"
        description="Ligue ou desligue funcionalidades em tempo de execução. O admin decide o que a plataforma entrega hoje; o código fica parado."
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
        {/* Lista de flags conhecidas */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Paleta de recursos</CardTitle>
            <p className="text-xs text-muted-foreground">
              Chaves fixas. Nova chave precisa de deploy.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {FEATURE_KEYS.map((key) => {
              const ativo = flagsAtivas.some((f) => f.key === key);
              return (
                <div key={key} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{key.replace(/-/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">{descricao(key)}</p>
                  </div>
                  <button
                    type="button"
                    data-key={key}
                    data-tenant="global"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${
                      ativo ? "bg-[var(--status-success-dot)]" : "bg-muted"
                    }`}
                    aria-pressed={ativo}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full transform transition-transform bg-white shadow-sm ${
                        ativo ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Tabela de flags ativas por empresa */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Atual (plataforma)</CardTitle>
            <p className="text-xs text-muted-foreground">
              Flags globais ligadas — valem para toda empresa que não sobrepuser.
            </p>
          </CardHeader>
          <CardContent>
            {flags.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Nenhum recurso global ativo. Use o formulário para criar flags por empresa.
              </p>
            ) : (
              <ul className="flex flex-col gap-2 p-3 md:hidden">
                {flags.map((f) => (
                  <li key={f.id}>
                    <LinhaLista
                      titulo={
                        <Link
                          href={`/admin/planos?flag=${f.key}`}
                          className="hover:underline"
                        >
                          <span className="font-semibold">{f.key.replace(/-/g, " ")}</span>
                        </Link>
                      }
                      apoio={f.descricao}
                      badge={
                        <StatusPill
                          tom="critico"
                        >
                          {f.enabled ? "Ativa" : "Inativa"}
                        </StatusPill>
                      }
                      valor={
                        <span className="text-xs tabular-nums">ID {f.id}</span>
                      }
                      acoes={
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link
                            href={`/admin/planos?flag=${f.key}`}
                          >
                            Editar
                          </Link>
                        </Button>
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Auditoria do uso</CardTitle>
            <p className="text-xs text-muted-foreground">
              O que cada recurso controla. O que ele liga/desliga.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3 p-3 md:hidden">
              {FEATURE_KEYS.map((key) => {
                const ativo = flagsAtivas.some((f) => f.key === key);
                return (
                  <li key={key} className="border-b border-[var(--border)] pb-3 last:border-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{key.replace(/-/g, " ")}</p>
                        <p className="text-xs text-muted-foreground">{descricao(key)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {ativo ? (
                          <CheckCircle className="size-4 text-[var(--status-success-dot)]" />
                        ) : (
                          <XCircle className="size-4 text-[var(--status-destructive)]" />
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recurso</TableHead>
                    <TableHead>O que ele controla</TableHead>
                    <TableHead className="text-right">Status global</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FEATURE_KEYS.map((key) => {
                    const ativo = flagsAtivas.some((f) => f.key === key);
                    return (
                      <TableRow key={key}>
                        <TableCell>
                          <span className="font-semibold">{key.replace(/-/g, " ")}</span>
                        </TableCell>
                        <TableCell>{descricao(key)}</TableCell>
                        <TableCell className="text-right">
                          <StatusPill
                            tom={ativo ? "positivo" : "critico"}
                          >
                            {ativo ? "Ativa" : "Inativa"}
                          </StatusPill>
                        </TableCell>
                        <TableCell className="text-right">
                          <form action={salvarFeatureFlagAction}>
                            <input type="hidden" name="key" value={key} />
                            <input type="hidden" name="tenantId" value="0" />
                            <input type="hidden" name="enabled" value={ativo ? "false" : "true"} />
                            <Button variant="ghost" size="sm" type="submit">
                              {ativo ? "Desativar" : "Ativar"}
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Instalação por empresa */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Configuração por empresa</CardTitle>
            <p className="text-xs text-muted-foreground">
              Sobreescreva uma flag global para uma empresa específica.
            </p>
          </CardHeader>
          <CardContent>
            <form action={salvarFeatureFlagAction} className="grid gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Chave do recurso*
                <select name="key" className="rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                  {FEATURE_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {key.replace(/-/g, " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Empresa*
                <select name="tenantId" className="rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                  <option value="0">Plataforma (global)</option>
                  {flags
                    .filter((f) => f.tenantId)
                    .map((f) => (
                      <option key={f.id} value={f.tenantId!.toString()}>
                        Empresa {f.tenantId}
                      </option>
                    ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Ativar*
                <select name="enabled" className="rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </label>
              <Button type="submit">Salvar configuração</Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              A linha do tenant tem precedência sobre a global.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function descricao(key: string): string {
  const m: Record<string, string> = {
    "pdv-expresso-temporizador":
      "Temporizador do PDV Expresso — avisa quando o cliente selecionar um produto pelo usuário.",
    "suporte-velocidad":
      "Suporte mais rápido — atrasa o SLA da prioridade CRÍTICA.",
    "saude-expresso":
      "Métrica de saúde do PDV na tela do cluster. Exibe o status de saúde do cluster.",
  };
  return m[key];
}
