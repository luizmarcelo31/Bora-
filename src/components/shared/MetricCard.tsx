import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Métrica com assinatura BoraMais (Fase 3).
 * Compatível com o uso antigo (title/value/hint); icon + badge dão
 * o padrão rico (ex.: dashboard) sem bespoke por página.
 */
export function MetricCard({
  title,
  value,
  hint,
  icon: Icon,
  badge,
}: {
  title: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
}) {
  return (
    <Card className="bg-linear-to-t from-primary/5 to-card dark:bg-card">
      <CardHeader>
        {Icon ? (
          <>
            <CardTitle>
              <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </div>
            </CardTitle>
            <CardDescription>{title}</CardDescription>
          </>
        ) : (
          <CardTitle>{title}</CardTitle>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-heading text-2xl font-bold tabular-nums leading-none tracking-tight">
            {value}
          </div>
          {badge}
        </div>
        {hint ? <p className="text-muted-foreground text-sm">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
