import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
}: {
  title: string
  description?: string
  badge?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl border border-[var(--border)] bg-card px-4 py-3 text-card-foreground shadow-sm",
        "dark:border-[var(--border)] dark:bg-[var(--card)] dark:shadow-none",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-heading text-base font-semibold tracking-tight md:text-lg">
          {title}
        </h1>
        {badge ? (
          <Badge
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-current border-[var(--border)] dark:border-[var(--border)]"
            variant="outline"
          >
            {badge}
          </Badge>
        ) : null}
        {actions ? (
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}
