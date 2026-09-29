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
    // Roadmap Fase 1.3 — "Header de página: fundo laranja no day, #111 no dark".
    // A faixa é uma faixa: cantos arredondados e respiro, não uma tarja cheia.
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl bg-[var(--page-header-bg)] px-5 py-4 text-[var(--page-header-fg)]",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
          {title}
        </h1>
        {badge ? (
          <Badge
            className="rounded-full border border-current/25 bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-current"
          >
            {badge}
          </Badge>
        ) : null}
        {actions ? (
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {description ? (
        <p className="text-sm text-current/80">{description}</p>
      ) : null}
    </div>
  );
}
