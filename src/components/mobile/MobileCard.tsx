"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/**
 * MobileCard — Card compacto mobile.
 * Layout: flex row, icon 48px, título + subtítulo, valor à direita.
 * Altura mínima 64px, padding 12px.
 */
export function MobileCard({
  title,
  subtitle,
  value,
  action,
  icon: Icon,
  onClick,
  className,
}: {
  title: string;
  subtitle?: string;
  value?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card p-3",
        onClick && "cursor-pointer active:scale-[0.98] transition-transform",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {Icon && (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-card-foreground">
          {title}
        </span>
        {subtitle && (
          <span className="truncate text-xs text-muted-foreground">
            {subtitle}
          </span>
        )}
      </div>
      {value && (
        <span className="shrink-0 text-sm font-semibold text-card-foreground">
          {value}
        </span>
      )}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
