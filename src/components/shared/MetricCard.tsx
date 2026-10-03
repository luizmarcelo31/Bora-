import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Métrica com assinatura BoraMais (Fase 3 → revisão visual auditoria).
 * Borda de acento colorido no topo, ícone com cor primária, valor maior.
 *
 * ## Duas densidades
 *
 * Abaixo de `sm` o card é compacto: sem a caixa do ícone, sem a linha de
 * descrição duplicada, valor em 16px. Acima, a versão completa.
 *
 * O motivo é medido, não estético. A 390px o grid de KPI cai para uma coluna,
 * e o card completo tem ~140px — quatro métricas consumiam 560px, duas telas e
 * meia de scroll antes de qualquer conteúdo. A versão compacta tem ~56px e as
 * quatro ocupam 240px: o mesmo número cabe em cima do gráfico, que é onde o
 * dono da plataforma olha primeiro.
 *
 * Nada some de informação: o `hint` continua visível, só menor. O que é
 * dispensado no mobile é a caixa decorativa do ícone, que existe para dar
 * contexto quando o rótulo sozinho não basta — e em quatro KPIs seguidos, o
 * rótulo basta.
 *
 * ## Quando usar
 *
 * Para número único com rótulo curto. Quando são três ou quatro números da
 * mesma família, prefira `KpiFaixa`: a repetição de cartões grandes é o que
 * empurra a tela para baixo.
 */
export function MetricCard({
  title,
  value,
  hint,
  icon: Icon,
  badge,
  className,
}: {
  title: string;
  /** Aceita string ou <Valor tom="…"> — número com tom semântico. */
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-t-2 border-t-primary/50 bg-card dark:bg-card",
        "p-2.5 transition-shadow duration-200 sm:p-0 hover:shadow-md",
        className
      )}
    >
      {/* Glow removido (skill §15: sem blobs decorativos) */}

      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          {Icon ? (
            <div
              aria-hidden="true"
              className="hidden size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 sm:flex"
            >
              <Icon className="size-4" />
            </div>
          ) : null}
          <CardTitle
            title={title}
            className="min-w-0 flex-1 truncate text-xs font-semibold text-muted-foreground sm:text-sm sm:text-foreground/70"
          >
            {title}
          </CardTitle>
        </div>

        <CardContent className="flex flex-col gap-1 p-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* 700 é o peso reservado ao número em destaque (tokens.css). */}
            <div className="font-heading text-base font-bold tabular-nums leading-none tracking-tight sm:text-2xl sm:font-semibold">
              {value}
            </div>
          </div>
          {badge ? <div className="hidden items-center sm:flex">{badge}</div> : null}
          {hint ? (
            <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
          ) : null}
        </CardContent>
      </div>
    </Card>
  );
}

/**
 * Faixa densa de KPIs: rótulo em cima, número embaixo, sem card individual.
 *
 * ## Por que existe
 *
 * A leva da auditoria mobile aplicou o mesmo patch de "cartão inflado → faixa
 * compacta" em seis rotas do tenant, e o mesmo bloco de três linhas voltou em
 * cada uma. Esta é a forma que o tenant já usa — escrita à mão seis vezes.
 *
 * ## Quando NÃO usar
 *
 * Para número que precisa de ícone, badge, ou que não é da mesma família dos
 * outros. Aí o `MetricCard` ainda é a escolha: a caixa do ícone é o que dá
 * contexto quando o rótulo sozinho não basta.
 */
export function KpiFaixa({
  itens,
  colunas = 3,
  className,
}: {
  itens: { rotulo: string; valor: React.ReactNode; apoio?: React.ReactNode }[];
  colunas?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        colunas === 2 && "grid-cols-2",
        colunas === 3 && "grid-cols-3",
        colunas === 4 && "grid-cols-2 sm:grid-cols-4",
        className
      )}
    >
      {itens.map((k) => (
        <div
          key={k.rotulo}
          className="rounded-lg border border-border bg-card px-2 py-1.5 md:p-3"
        >
          <p className="truncate text-[10px] text-muted-foreground">{k.rotulo}</p>
          <div className="font-heading text-sm font-semibold tabular-nums leading-tight md:text-lg">
            {k.valor}
          </div>
          {k.apoio ? (
            <p className="truncate text-[10px] text-muted-foreground">{k.apoio}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
