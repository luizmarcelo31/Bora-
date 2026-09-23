import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
}: {
  title: string;
  description?: string;
  badge?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1 pb-4 border-b border-border/60", className)}>
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {badge ? (
          <Badge
            variant="secondary"
            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
          >
            {badge}
          </Badge>
        ) : null}
        {actions ? (
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
