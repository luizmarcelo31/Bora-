import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { TableCard } from "@/components/shared/TableCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select-field";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { AlertTriangle, Clock, LifeBuoy, Timer } from "lucide-react";
import {
  labelDe,
  prioridadeTicketLabel,
  prioridadeTicketTom,
  statusTicketLabel,
  statusTicketTom,
} from "@/lib/labels";
import type { PrioridadeTicket, StatusTicket } from "@prisma/client";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { ERROS_TICKET, mudarStatusTicketAction, abrirTicketAction } from "./actions";

const FILTROS: { valor: StatusTicket; rotulo: string }[] = [
  { valor: "ABERTO", rotulo: "Abertos" },
  { valor: "EM_ANALISE", rotulo: "Em análise" },
  { valor: "AGUARDANDO_CLIENTE", rotulo: "Aguardando empresa" },
  { valor: "RESOLVIDO", rotulo: "Resolvidos" },
  { valor: "FECHADO", rotulo: "Fechados" },
];

function slaVencido(sla: Date | null, status: StatusTicket) {
  if (!sla) return false;
  if (status === "RESOLVIDO" || status === "FECHADO") return false;
  return sla.getTime() < Date.now();
}

export default async function SuportePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; prioridade?: string; error?: string; ok?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;

  const status = FILTROS.some((f) => f.valor === params.status)
    ? (params.status as StatusTicket)
    : undefined;
  const prioridade = (["BAIXA", "MEDIA", "ALTA", "CRITICA"] as PrioridadeTicket[]).includes(
    params.prioridade as PrioridadeTicket
  )
    ? (params.prioridade as PrioridadeTicket)
    : undefined;

  const [tickets, empresas, contagens] = await Promise.all([
    prisma.ticket.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(prioridade ? { priority: prioridade } : {}),
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: { tenant: { select: { id: true, name: true } }, _count: { select: { messages: true } } },
    }),
    prisma.tenant.findMany({
      where: { status: { not: "ARQUIVADA" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.ticket.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const abertos = contagens
    .filter((c) => c.status === "ABERTO" || c.status === "EM_ANALISE" || c.status === "AGUARDANDO_CLIENTE")
    .reduce((s, c) => s + c._count._all, 0);
  const vencidos = tickets.filter((t) => slaVencido(t.slaDueAt, t.status)).length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Suporte"
        badge="Atendimento"
        description="Chamados das empresas, com prazo de resposta por prioridade."
      />

      {params.error ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {ERROS_TICKET[params.error] ?? "Não foi possível concluir a ação."}
        </p>
      ) : null}
      {params.ok ? (
        <p role="status" className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">
          Ticket atualizado.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Em andamento" value={String(abertos)} hint="Abertos ou em análise" icon={LifeBuoy} />
        <MetricCard title="Críticos" value={String(contagens.find((c) => c.status === "ABERTO")?._count._all ?? 0)} hint="Novos e não tratados" icon={AlertTriangle} />
        <MetricCard title="Fora do prazo" value={String(vencidos)} hint="Passaram do SLA" icon={Timer} />
        <MetricCard title="Total" value={String(contagens.reduce((s, c) => s + c._count._all, 0))} hint="Todos os tickets" icon={Clock} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Abrir chamado</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={abrirTicketAction} className="grid gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Empresa*
                <SelectField
                  name="tenantId"
                  required
                  placeholder="Selecionar…"
                  options={empresas.map((e) => ({ value: String(e.id), label: e.name }))}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Assunto*
                <Input name="subject" required placeholder="Erro ao finalizar venda" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Descrição*
                <Textarea name="description" rows={5} required placeholder="O que aconteceu, desde quando, e o que já foi tentado." />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Prioridade
                <SelectField
                  name="priority"
                  defaultValue="MEDIA"
                  options={(["BAIXA", "MEDIA", "ALTA", "CRITICA"] as PrioridadeTicket[]).map((p) => ({
                    value: p,
                    label: `${labelDe(prioridadeTicketLabel, p)} — resposta em ${
                      p === "CRITICA" ? "1h" : p === "ALTA" ? "4h" : p === "MEDIA" ? "8h" : "24h"
                    }`,
                  }))}
                />
              </label>
              <Button type="submit">Abrir chamado</Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <TableCard
            title="Chamados"
            description="Prioridade mais alta primeiro."
            footer={`${tickets.length} ticket(s)`}
          >
            <AdminFilterBar
              placeholder="Filtrar por empresa ou assunto…"
              chips={FILTROS.map((f) => ({ valor: f.valor, rotulo: f.rotulo }))}
              chipAtivo={status}
              descricao="Filtrar por situação do ticket"
            />

            {tickets.length === 0 ? (
              <EmptyState title="Nenhum ticket" description="Não há chamados com esses filtros." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Mover</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((t) => {
                    const proximos =
                      t.status === "ABERTO"
                        ? ["EM_ANALISE", "FECHADO"]
                        : t.status === "EM_ANALISE" || t.status === "AGUARDANDO_CLIENTE"
                          ? ["RESOLVIDO", "EM_ANALISE"]
                          : t.status === "RESOLVIDO"
                            ? ["FECHADO", "EM_ANALISE"]
                            : ["ABERTO"];
                    return (
                      <TableRow key={t.id}>
                        <TableCell>
                          <span className="font-medium">{t.subject}</span>
                          <p className="text-xs text-muted-foreground">
                            #{t.id} · {t._count.messages} mensagem(ns) ·{" "}
                            {t.createdAt.toLocaleDateString("pt-BR")}
                          </p>
                        </TableCell>
                        <TableCell>
                          <a href={`/admin/empresas/${t.tenant.id}`} className="hover:underline">
                            {t.tenant.name}
                          </a>
                        </TableCell>
                        <TableCell>
                          <StatusPill tom={prioridadeTicketTom[t.priority]}>
                            {labelDe(prioridadeTicketLabel, t.priority)}
                          </StatusPill>
                        </TableCell>
                        <TableCell>
                          <StatusPill tom={statusTicketTom[t.status]}>
                            {labelDe(statusTicketLabel, t.status)}
                          </StatusPill>
                        </TableCell>
                        <TableCell className="text-xs">
                          {t.slaDueAt ? (
                            <span className={slaVencido(t.slaDueAt, t.status) ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}>
                              {t.slaDueAt.toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {slaVencido(t.slaDueAt, t.status) ? " · vencido" : ""}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {proximos.map((s) => (
                              <form key={s} action={mudarStatusTicketAction}>
                                <input type="hidden" name="id" value={t.id} />
                                <input type="hidden" name="status" value={s} />
                                <Button type="submit" size="sm" variant="outline">
                                  {s === "EM_ANALISE"
                                    ? "Analisar"
                                    : s === "RESOLVIDO"
                                      ? "Resolver"
                                      : s === "FECHADO"
                                        ? "Fechar"
                                        : "Reabrir"}
                                </Button>
                              </form>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TableCard>
        </div>
      </div>
    </main>
  );
}
