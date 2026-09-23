import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Métrica com assinatura BoraMais (Fase 3 → revisão visual auditoria).
 * Borda de acento colorido no topo, ícone com cor primária, valor maior.
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
  value: string;
  hint?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-t-2 border-t-primary/50",
        "bg-card dark:bg-card",
        "transition-shadow duration-200 hover:shadow-md",
        className
      )}
    >
      {/* Glow decorativo no canto superior */}
      <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-primary/8 blur-xl" />

      <CardHeader className="pb-2">
        {Icon ? (
          <>
            <CardTitle>
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <Icon className="size-4" />
              </div>
            </CardTitle>
            <CardDescription className="text-sm font-medium text-foreground/70">
              {title}
            </CardDescription>
          </>
        ) : (
          <CardTitle className="text-sm font-medium text-foreground/70">{title}</CardTitle>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-heading text-3xl font-bold tabular-nums leading-none tracking-tight">
            {value}
          </div>
        </div>
        {badge && <div className="flex items-center">{badge}</div>}
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
