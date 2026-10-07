import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { FeatureCard } from "@/components/shared/FeatureCard";
import { FeatureStatusPill } from "@/components/shared/FeatureStatusPill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { LinhaLista } from "@/components/shared/LinhaLista";
import {
  ehFeatureAtiva,
  todosOsNovesAtivos,
  salvarFeatureFlag,
  FEATURE_KEYS,
  type FeatureFlag,
} from "@/lib/feature-flags";
import { prisma } from "@/lib/db";
import {
  Check,
  Plus,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { salvarFeatureFlagAction } from "../actions";

// Descritores privados das chaves conhecidas.
const descricaoKey: Record<string, string> = {
  "pdv-expresso-temporizador":
    "Temporizador do PDV Expresso — avisa quando o cliente selecionar um produto pelo usuário.",
  "suporte-velocidad": "Suporte mais rápido — atrasa o SLA da prioridade CRÍTICA.",
  "saude-expresso": "Métrica de saúde do PDV na tela do cluster. Exibe o status de saúde do cluster.",
};

export default async function FeaturesPage() {
  await requireSuperAdmin();
  const flags = await prisma.featureFlag.findMany({
    orderBy: [{ key: "asc" }],
  });
  const flagsAtivas = await todosOsNovesAtivos(1);

  const descricao = (key: string): string => descricaoKey[key] ?? key;

  // Retorna booleano síncrono para uso no JSX.
  const ehFeatureAtivaSync = (key: string, tenantId: number): boolean => {
    return flagsAtivas.some((f) => f.key === key && f.tenantId === tenantId);
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
      <PageHeader
        title="Recursos"
        badge="Plataforma"
        description="Ative ou desative funcionalidades em tempo de execução."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Lista de flags conhecidas */}
        <section aria-labelledby="plantilla-aria">
          <h2 id="plantilla-aria" className="flex items-center gap-2 text-base font-semibold">
            <Plus className="size-4" />
            Plantilha de recursos
          </h2>
          <div className="mt-3 rounded-xl border border-border bg-card p-3 shadow-sm dark:border-border dark:bg-card">
            <Card>
              <CardHeader>
                <CardTitle>Chaves fixas</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Nova chave exige deploy.
                </p>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2 p-3 md:hidden">
                  {FEATURE_KEYS.map((key) => {
                    const ativo = ehFeatureAtivaSync(key, 1);
                    return (
                      <li key={key}>
                        <FeatureCard
                          chave={key}
                          descricao={descricao(key)}
                          ativo={ativo}
                        />
                      </li>
                    );
                  })}
                </ul>
                <div className="hidden overflow-x-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recurso</TableHead>
                        <TableHead>O que ele controla</TableHead>
                        <TableHead className="text-right">Status global</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {FEATURE_KEYS.map((key) => {
                        const ativo = ehFeatureAtivaSync(key, 1);
                        return (
                          <TableRow key={key}>
                            <TableCell>
                              <span className="font-semibold">{key.replace(/-/g, " ")}</span>
                            </TableCell>
                            <TableCell>{descricao(key)}</TableCell>
                            <TableCell className="text-right">
                              <FeatureStatusPill ativo={ativo} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Tabela de flags ativas */}
        <section aria-labelledby="flags-ativas-aria">
          <h2 id="flags-ativas-aria" className="flex items-center gap-2 text-base font-semibold">
            Ativas hoje
          </h2>
          <div className="mt-3 rounded-xl border border-border bg-card p-3 shadow-sm dark:border-border dark:bg-card">
            {flags.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Nenhum recurso global ativo. Use o formulário para criar flags por empresa.
              </p>
            ) : (
              <>
                <ul className="flex flex-col gap-1.5 p-3 md:hidden">
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
                          <FeatureStatusPill ativo={f.enabled} />
                        }
                        valor={<span className="text-xs tabular-nums">ID {f.id}</span>}
                        acoes={
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/planos?flag=${f.key}`}>Editar</Link>
                          </Button>
                        }
                      />
                    </li>
                  ))}
                </ul>
                <div className="hidden overflow-x-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recurso</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Global</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flags.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell>
                            <span className="font-semibold">{f.key.replace(/-/g, " ")}</span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {f.descricao}
                          </TableCell>
                          <TableCell>
                            <FeatureStatusPill ativo={f.enabled} />
                          </TableCell>
                          <TableCell className="text-right">
                            <form action={salvarFeatureFlagAction}>
                              <input type="hidden" name="key" value={f.key} />
                              <input type="hidden" name="tenantId" value="0" />
                              <input
                                type="hidden"
                                name="enabled"
                                value={f.enabled ? "false" : "true"}
                              />
                              <Button variant="ghost" size="sm" type="submit">
                                {f.enabled ? "Desativar" : "Ativar"}
                              </Button>
                            </form>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Instalação por empresa */}
        <section aria-labelledby="instalacao-aria">
          <h2 id="instalacao-aria" className="flex items-center gap-2 text-base font-semibold">
            <RefreshCw className="size-4" />
            Instalação por empresa
          </h2>
          <div className="mt-3 rounded-xl border border-border bg-card p-3 shadow-sm dark:border-border dark:bg-card">
            <form action={salvarFeatureFlagAction} className="grid gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Chave do recurso*
                <select
                  name="key"
                  className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
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
          </div>
        </section>
      </div>
    </main>
  );
}


