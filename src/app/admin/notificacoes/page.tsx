import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/shared/StatusPill";
import { TableCard } from "@/components/shared/TableCard";
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
import { Megaphone, Send, Users } from "lucide-react";
import {
  alvoNotificacaoLabel,
  labelDe,
  statusEnvioLabel,
} from "@/lib/labels";
import type { Tom } from "@/lib/labels";
import { salvarComunicacaoAction } from "./actions";

const ERROS_COMUNICACAO: Record<string, string> = {
  dadosInvalidos: "Verifique assunto, mensagem e o público-alvo.",
  alvoInvalido: "Escolha um público-alvo válido.",
  naoEncontrado: "Comunicação não encontrada.",
};

const TOM_ENVIO: Record<string, Tom> = {
  RASCUNHO: "neutro",
  AGENDADO: "informativo",
  ENVIANDO: "atencao",
  ENVIADO: "positivo",
  FALHOU: "critico",
};

export default async function NotificacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;

  const [comunicacoes, planos, empresas, totalUsuarios] = await Promise.all([
    prisma.broadcast.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.plan.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.tenant.findMany({
      where: { status: { not: "ARQUIVADA" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.count({ where: { active: true } }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
      <AdminBreadcrumb items={[{ label: "Início", href: "/admin" }, { label: "Visão geral" }]} />
        $2<PageHeader
        title="Comunicações"
        badge="Relacionamento"
        description="Avisos para as empresas. Rascunhar é livre; enviar é registrado na auditoria."
      />

      {params.error ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {ERROS_COMUNICACAO[params.error] ?? "Não foi possível salvar a comunicação."}
        </p>
      ) : null}
      {params.ok ? (
        <p role="status" className="rounded-lg border border-[var(--status-success-dot)]/40 bg-[var(--status-success-bg)] p-3 text-sm text-[var(--status-success-fg)]">
          Comunicação salva.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Nova comunicação</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={salvarComunicacaoAction} className="grid gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Assunto*
                <Input name="subject" required placeholder="Nova functionality disponível" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Mensagem*
                <Textarea name="body" rows={6} required placeholder="O que mudou, para quem, e o que a empresa precisa fazer." />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Público*
                <SelectField
                  name="target"
                  defaultValue="TODAS_EMPRESAS"
                  options={[
                    { value: "TODAS_EMPRESAS", label: "Todas as empresas" },
                    { value: "POR_PLANO", label: "Um plano específico" },
                    { value: "POR_EMPRESA", label: "Uma empresa específica" },
                  ]}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Escolha o segmento
                <SelectField
                  name="targetRef"
                  placeholder="Selecionar…"
                  options={[
                    ...planos.map((p) => ({ value: String(p.id), label: `Plano: ${p.name}` })),
                    ...empresas.map((e) => ({ value: String(e.id), label: `Empresa: ${e.name}` })),
                  ]}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="enviarAgora" className="size-4" />
                Enviar agora (sem isso, fica como rascunho)
              </label>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users aria-hidden="true" className="size-3.5" />
                {totalUsuarios} usuário(s) ativos na plataforma
              </div>
              <Button type="submit">
                <Send aria-hidden="true" className="size-4" />
                Salvar comunicação
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <TableCard
            title="Comunicações"
            description="Últimas 50."
            footer={`${comunicacoes.length} comunicação(ões)`}
          >
            {comunicacoes.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Nenhuma comunicação enviada ainda.
              </p>
            ) : (
              <>
              {/* Mobile: lista compacta — tabela só no desktop */}
              <ul className="flex flex-col gap-2 p-3 md:hidden">
                {comunicacoes.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-semibold">{c.subject}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {labelDe(alvoNotificacaoLabel, c.target)} · {c.recipients} dest. · {(c.sentAt ?? c.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                      </span>
                    </div>
                    <StatusPill tom={TOM_ENVIO[c.status] ?? "neutro"}>
                      {labelDe(statusEnvioLabel, c.status)}
                    </StatusPill>
                  </li>
                ))}
              </ul>
              <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Público</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Destinatários</TableHead>
                    <TableHead>Quando</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comunicacoes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-semibold">{c.subject}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {labelDe(alvoNotificacaoLabel, c.target)}
                      </TableCell>
                      <TableCell>
                        <StatusPill tom={TOM_ENVIO[c.status] ?? "neutro"}>
                          {labelDe(statusEnvioLabel, c.status)}
                        </StatusPill>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{c.recipients}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {(c.sentAt ?? c.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              </>
            )}
          </TableCard>

          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Megaphone aria-hidden="true" className="size-3.5" />
            O envio efetivo de e-mail depende do provedor configurado. Sem provedor, a comunicação é
            registrada com o público-alvo mas não entrega.
          </p>
        </div>
      </div>
    </main>
  );
}


