import { cn } from "@/lib/utils";

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
    <div className={cn("w-full flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-4 px-1">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {toolbar && <div>{toolbar}</div>}
      </div>
      
      <div className="w-full rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
        {children}
      </div>

      {footer ? (
        <div className="px-1 flex items-center justify-between text-xs font-medium text-muted-foreground tabular-nums">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
