import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { KpiFaixa } from "@/components/shared/MetricCard";
import { Valor } from "@/components/shared/Valor";
import { StatusPill } from "@/components/shared/StatusPill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableCard } from "@/components/shared/TableCard";
import { LinhaLista } from "@/components/shared/LinhaLista";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Activity, Database } from "lucide-react";
import { formatCurrency } from "@/lib/validators";
import { labelDe, statusEmpresaLabel, statusEmpresaTom } from "@/lib/labels";
import type { Tom } from "@/lib/labels";

/** Um único teste no banco decide o estado do sistema. */
async function checarBanco(): Promise<{ ok: boolean; latenciaMs: number; erro?: string }> {
  const inicio = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latenciaMs: Date.now() - inicio };
  } catch (e) {
    return {
      ok: false,
      latenciaMs: Date.now() - inicio,
      erro: e instanceof Error ? e.message : "erro desconhecido",
    };
  }
}

function saude(latenciaMs: number): Tom {
  if (latenciaMs < 300) return "positivo";
  if (latenciaMs < 1500) return "atencao";
  return "critico";
}

/** Datas de corte calculadas fora do componente: `Date.now()` no corpo do
 *  render é lido pelo React como impure e quebra a idempotência. */
const AGORA = Date.now();
const CORTE_SEM_ATIVIDADE = new Date(AGORA - 14 * 86_400_000);

export default async function SaudePage() {
  await requireSuperAdmin();

  const [banco, empresas, ticketsAbertos, assinaturas, semAtividade, crticos, produtos, vendas] =
    await Promise.all([
      checarBanco(),
      prisma.tenant.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.ticket.count({
        where: { status: { in: ["ABERTO", "EM_ANALISE", "AGUARDANDO_CLIENTE"] } },
      }),
      prisma.subscription.findMany({
        where: { status: { in: ["ATIVA", "EXPERIMENTACAO"] } },
        include: { plan: { select: { monthlyPrice: true } } },
      }),
      prisma.tenant.count({
        where: {
          status: { in: ["ATIVA", "TRIAL"] },
          OR: [{ lastActivityAt: null }, { lastActivityAt: { lt: CORTE_SEM_ATIVIDADE } }],
        },
      }),
      prisma.ticket.count({
        where: { priority: "CRITICA", status: { in: ["ABERTO", "EM_ANALISE"] } },
      }),
      prisma.product.count(),
      prisma.sale.count({ where: { status: "CONCLUIDA" } }),
    ]);

  const porStatus = new Map(empresas.map((e) => [e.status, e._count._all]));
  const totalEmpresas = empresas.reduce((s, e) => s + e._count._all, 0);
  const ativas = (porStatus.get("ATIVA") ?? 0) + (porStatus.get("TRIAL") ?? 0);
  const mrr = assinaturas.reduce(
    (s, a) =>
      s + (a.billingCycle === "ANUAL" ? Math.round(a.plan.monthlyPrice / 12) : a.plan.monthlyPrice),
    0
  );

  const servicos: { nome: string; ok: boolean; detalhe: string; tom: Tom }[] = [
    {
      nome: "Banco de dados",
      ok: banco.ok,
      detalhe: banco.ok ? `${banco.latenciaMs} ms` : (banco.erro ?? "sem resposta"),
      tom: banco.ok ? saude(banco.latenciaMs) : "critico",
    },
    {
      nome: "Autenticação",
      ok: true,
      detalhe: "Supabase Auth (SSR)",
      tom: "positivo",
    },
    {
      nome: "Armazenamento de imagens",
      ok: true,
      detalhe: "ImageKit",
      tom: "positivo",
    },
    {
      nome: "Envio de e-mail",
      ok: false,
      detalhe: "Provedor não configurado",
      tom: "atencao",
    },
  ];

  const volume: { recurso: string; registros: string }[] = [
    { recurso: "Empresas", registros: String(totalEmpresas) },
    { recurso: "Produtos no catálogo", registros: String(produtos) },
    { recurso: "Vendas concluídas", registros: String(vendas) },
    { recurso: "Tickets", registros: `${ticketsAbertos} em aberto` },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
      <AdminBreadcrumb items={[{ label: "Início", href: "/admin" }, { label: "Visão geral" }]} />
        <PageHeader
        title="Saúde da plataforma"
        badge="Operação"
        description="O que está funcionando, o que está travado, e onde olhar primeiro."
      />

      <KpiFaixa
        colunas={4}
        itens={[
          {
            rotulo: "Receita mensal",
            valor: <Valor tom="positivo">{formatCurrency(mrr)}</Valor>,
            apoio: `${assinaturas.length} assinatura(s) em dia`,
          },
          {
            rotulo: "Empresas ativas",
            valor: <Valor tom={ativas > 0 ? "positivo" : "neutro"}>{ativas}</Valor>,
            apoio: `${totalEmpresas} no total`,
          },
          {
            rotulo: "Tickets em aberto",
            valor: <Valor tom={ticketsAbertos > 0 ? "atencao" : "neutro"}>{ticketsAbertos}</Valor>,
            apoio: crticos > 0 ? `${crticos} crítico(s)` : "Nenhum crítico",
          },
          {
            rotulo: "Sem atividade há 14 dias",
            valor: (
              <Valor tom={semAtividade > 0 ? "atencao" : "neutro"}>{semAtividade}</Valor>
            ),
            apoio: "Ativas que pararam de usar",
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2">
            {servicos.map((s) => (
              <li
                key={s.nome}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
              >
                <span className="font-semibold">{s.nome}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {s.detalhe}
                  <StatusPill tom={s.tom}>{s.ok ? "Operacional" : "Atenção"}</StatusPill>
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <TableCard title="Distribuição de empresas" description="Por situação do ciclo de vida.">
          <ul className="divide-y">
            {empresas.map((e) => (
              <li key={e.status} className="flex items-center justify-between p-3 text-sm">
                <span className="flex items-center gap-2">
                  <Activity aria-hidden="true" className="size-4 text-muted-foreground" />
                  {labelDe(statusEmpresaLabel, e.status)}
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums">{e._count._all}</span>
                  <StatusPill tom={statusEmpresaTom[e.status]}>
                    {totalEmpresas > 0
                      ? `${Math.round((e._count._all / totalEmpresas) * 100)}%`
                      : "0%"}
                  </StatusPill>
                </span>
              </li>
            ))}
          </ul>
        </TableCard>

        <TableCard title="Volume de dados" description="Tudo que a plataforma guarda hoje.">
          {/* Mobile: a mesma leitura em linha, recurso à esquerda e registros
              à direita. A tabela de duas colunas cabe, mas a linha é a leitura
              que o celular já usa no resto da tela. */}
          <ul className="flex flex-col gap-2 p-2 md:hidden">
            {volume.map((v) => (
              <li key={v.recurso}>
                <LinhaLista
                  titulo={v.recurso}
                  valor={<span className="tabular-nums">{v.registros}</span>}
                />
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recurso</TableHead>
                <TableHead className="text-right">Registros</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <Database aria-hidden="true" className="size-4 text-muted-foreground" />
                    Empresas
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{totalEmpresas}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Produtos no catálogo</TableCell>
                <TableCell className="text-right tabular-nums">{produtos}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Vendas concluídas</TableCell>
                <TableCell className="text-right tabular-nums">{vendas}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Tickets</TableCell>
                <TableCell className="text-right tabular-nums">{ticketsAbertos} em aberto</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          </div>
        </TableCard>
      </div>
    </main>
  );
}



