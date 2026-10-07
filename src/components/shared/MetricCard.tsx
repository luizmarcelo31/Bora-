import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/** Metric card with refined typography. Two variants: default (large icon) and compact (no icon box). */
export function MetricCard({
  title,
  value,
  hint,
  icon: Icon,
  badge,
  className,
}: {
  title: string
  value: React.ReactNode
  hint?: string
  icon?: LucideIcon
  badge?: React.ReactNode
  className?: string
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-t-2 border-t-primary/50 bg-card dark:bg-card",
        "px-3 py-2.5 transition-shadow duration-200 sm:px-4 sm:py-3 sm:hover:shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          {Icon ? (
            <div
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 sm:hidden"
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

        <CardContent className="flex flex-col gap-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-heading text-lg font-semibold tabular-nums leading-none tracking-tight sm:text-xl sm:font-semibold">
              {value}
            </div>
          </div>
          {badge ? (
            <div className="flex items-center gap-1.5">{badge}</div>
          ) : null}
          {hint ? <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p> : null}
        </CardContent>
      </div>
    </Card>
  )
}

/** Dense KPI row: label above, value below, no individual card. */
export function KpiFaixa({
  itens,
  colunas = 3,
  className,
}: {
  itens: { rotulo: string; valor: React.ReactNode; apoio?: React.ReactNode }[]
  colunas?: 2 | 3 | 4
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid gap-1.5",
        colunas === 2 && "grid-cols-2",
        colunas === 3 && "grid-cols-3",
        colunas === 4 && "grid-cols-2 sm:grid-cols-4",
        className
      )}
    >
      {itens.map((k) => (
        <div
          key={k.rotulo}
          className="rounded-lg border border-[var(--border)] bg-card px-2.5 py-2 transition-colors hover:bg-muted/30"
        >
          <p className="truncate text-[10px] font-medium text-muted-foreground">{k.rotulo}</p>
          <div className="font-heading text-base font-semibold tabular-nums leading-tight sm:text-lg">
            {k.valor}
          </div>
          {k.apoio ? (
            <p className="mt-0.5 truncate text-[10px] leading-relaxed text-muted-foreground">{k.apoio}</p>
          ) : null}
        </div>
      ))}
    </div>
  )
}
