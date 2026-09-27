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
import { slaVencido } from "@/lib/plataforma";
import { mudarStatusTicketAction, abrirTicketAction } from "./actions";

const ERROS_TICKET: Record<string, string> = {
  tenantInvalida: "Selecione a empresa.",
  dadosInvalidos: "Verifique o assunto, a descrição e a prioridade.",
  naoEncontrado: "Ticket não encontrado.",
  transicaoInvalida: "Essa mudança de situação não é permitida.",
};

const FILTROS: { valor: StatusTicket; rotulo: string }[] = [
  { valor: "ABERTO", rotulo: "Abertos" },
  { valor: "EM_ANALISE", rotulo: "Em análise" },
  { valor: "AGUARDANDO_CLIENTE", rotulo: "Aguardando empresa" },
  { valor: "RESOLVIDO", rotulo: "Resolvidos" },
  { valor: "FECHADO", rotulo: "Fechados" },
];

export default async function SuportePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; prioridade?: string; pagina?: string; error?: string; ok?: string }>;
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
  const q = (params.q ?? "").trim();
  const pagina = Math.max(1, Number(params.pagina ?? 1) || 1);
  const POR_PAGINA = 20;

  const where = {
    ...(status ? { status } : {}),
    ...(prioridade ? { priority: prioridade } : {}),
    ...(q
      ? {
          OR: [
            { subject: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const comQuery = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    if (prioridade) sp.set("prioridade", prioridade);
    if (p > 1) sp.set("pagina", String(p));
    const s = sp.toString();
    return s ? `?${s}` : "";
  };

  const [total, tickets, empresas, contagens] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
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
        <p role="status" className="rounded-lg border border-[var(--status-success-dot)]/40 bg-[var(--status-success-bg)] p-3 text-sm text-[var(--status-success-fg)]">
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
            description={
              total === 0
                ? "Nenhum chamado no filtro atual."
                : `Página ${pagina} de ${Math.max(1, Math.ceil(total / POR_PAGINA))} · ${total} ticket(s). Prioridade mais alta primeiro.`
            }
            footer={
              total === 0
                ? undefined
                : `Mostrando ${(pagina - 1) * POR_PAGINA + 1}–${Math.min(pagina * POR_PAGINA, total)} de ${total}`
            }
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
                          <span className="font-semibold">{t.subject}</span>
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
                            <span className={slaVencido(t.slaDueAt, t.status) ? "text-[var(--status-danger-fg)]" : "text-muted-foreground"}>
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

            {total > POR_PAGINA ? (
              <nav aria-label="Paginação" className="flex items-center justify-end gap-2 px-1">
                {pagina > 1 ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/admin/suporte${comQuery(pagina - 1)}`}>Anterior</a>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Anterior
                  </Button>
                )}
                <span className="text-xs text-muted-foreground tabular-nums">
                  {pagina} de {Math.max(1, Math.ceil(total / POR_PAGINA))}
                </span>
                {pagina < Math.max(1, Math.ceil(total / POR_PAGINA)) ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/admin/suporte${comQuery(pagina + 1)}`}>Próxima</a>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Próxima
                  </Button>
                )}
              </nav>
            ) : null}
          </TableCard>
        </div>
      </div>
    </main>
  );
}
