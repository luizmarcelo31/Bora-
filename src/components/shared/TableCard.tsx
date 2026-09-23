import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Invólucro padrão das tabelas do app (Fase 3):
 * título + descrição + ação + toolbar opcional + tabela + rodapé de contagem.
 * A tabela (ou EmptyState) entra como children.
 */
export function TableCard({
  title,
  description,
  action,
  toolbar,
  footer,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {action}
        </div>
        {toolbar}
      </CardHeader>
      <CardContent>
        {children}
        {footer ? (
          <p className="pt-4 text-xs text-muted-foreground tabular-nums">{footer}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
