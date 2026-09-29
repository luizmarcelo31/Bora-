import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/shared/StatusPill";
import { salvarConfiguracoesAction } from "./actions";
import { labelDe, statusIntegracaoLabel } from "@/lib/labels";
import type { Tom } from "@/lib/labels";

const TOM_INTEGRACAO: Record<string, Tom> = {
  CONECTADA: "positivo",
  DESCONECTADA: "neutro",
  ERRO: "critico",
  PENDENTE: "atencao",
};

const ERROS_CONFIG: Record<string, string> = {
  dadosInvalidos: "Verifique os valores informados.",
};

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;

  const [config, integracoes] = await Promise.all([
    prisma.platformSettings.findFirst(),
    prisma.integracao.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8">
      <AdminBreadcrumb items={[{ label: "Início", href: "/admin" }, { label: "Visão geral" }]} />
        <PageHeader
        title="Configurações da plataforma"
        badge="Sistema"
        description="Padrões que valem para todas as empresas. Configuração alterada fica na auditoria."
      />

      {params.error ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {ERROS_CONFIG[params.error] ?? "Não foi possível salvar."}
        </p>
      ) : null}
      {params.ok ? (
        <p role="status" className="rounded-lg border border-[var(--status-success-dot)]/40 bg-[var(--status-success-bg)] p-3 text-sm text-[var(--status-success-fg)]">
          Configurações salvas.
        </p>
      ) : null}

      {config?.maintenanceMode ? (
        <p role="alert" className="rounded-lg border border-[var(--status-warning-dot)]/50 bg-[var(--status-warning-bg)] p-3 text-sm text-[var(--status-warning-fg)]">
          Modo de manutenção ativo. Novas empresas não conseguem se cadastrar.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={salvarConfiguracoesAction} className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Email de suporte
              <Input
                name="supportEmail"
                type="email"
                defaultValue={config?.supportEmail ?? ""}
                placeholder="suporte@bora.app"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Moeda padrão
              <Input name="defaultCurrency" defaultValue={config?.defaultCurrency ?? "BRL"} maxLength={3} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Fuso horário padrão
              <Input
                name="defaultTimezone"
                defaultValue={config?.defaultTimezone ?? "America/Sao_Paulo"}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Dias de experimentação padrão
              <Input
                name="defaultTrialDays"
                type="number"
                min={0}
                max={365}
                defaultValue={config?.defaultTrialDays ?? 14}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Retenção da auditoria (dias)
              <Input
                name="auditRetentionDays"
                type="number"
                min={30}
                max={3650}
                defaultValue={config?.auditRetentionDays ?? 365}
              />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                name="maintenanceMode"
                defaultChecked={config?.maintenanceMode ?? false}
                className="size-4"
              />
              Modo de manutenção
            </label>
            <div className="sm:col-span-2">
              <Button type="submit">Salvar configurações</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrações</CardTitle>
        </CardHeader>
        <CardContent>
          {integracoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma integração cadastrada. Supabase e ImageKit já são usados pelo app.
            </p>
          ) : (
            <ul className="divide-y">
              {integracoes.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-semibold">{i.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.externalAccount ?? "Conta não informada"}
                      {i.lastSyncAt
                        ? ` · sincronizado ${i.lastSyncAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
                        : ""}
                      {i.lastError ? ` · erro: ${i.lastError}` : ""}
                    </p>
                  </div>
                  <StatusPill tom={TOM_INTEGRACAO[i.status] ?? "neutro"}>
                    {labelDe(statusIntegracaoLabel, i.status)}
                  </StatusPill>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}



