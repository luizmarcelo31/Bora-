import { cn } from "cn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Invólucro padrão das tabelas do app (Fase 3 → revisão visual auditoria):
 * borda de acento colorida no topo, título + descrição + ação + toolbar + rodapé.
 */
export function TableCard({
  title,
  description,
  action,
  toolbar,
  footer,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-t-2 border-t-primary/40", className)}>
      <CardHeader className="pb-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {description ? (
              <CardDescription className="text-sm">{description}</CardDescription>
            ) : null}
          </div>
          {action}
        </div>
        {toolbar && <div className="pt-3">{toolbar}</div>}
      </CardHeader>
      <CardContent className="pt-3">
        {children}
        {footer ? (
          <p className="border-t border-border/60 pt-3 mt-2 text-xs text-muted-foreground tabular-nums">
            {footer}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
