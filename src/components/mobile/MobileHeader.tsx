"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

/**
 * MobileHeader — Header colapsável mobile.
 * Layout: flex row, botão voltar 44px, título + subtítulo, ações.
 * Altura 56px, sticky no topo.
 */
export function MobileHeader({
  title,
  subtitle,
  actions,
  onBack,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onBack?: () => void;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-14 items-center gap-2 border-b border-border bg-background px-4",
        className
      )}
    >
      {onBack && (
        <button
          onClick={onBack}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          aria-label="Voltar"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="truncate text-base font-semibold text-foreground">
          {title}
        </h1>
        {subtitle && (
          <span className="truncate text-xs text-muted-foreground">
            {subtitle}
          </span>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
