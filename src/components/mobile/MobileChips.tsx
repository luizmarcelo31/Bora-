"use client";

import { cn } from "@/lib/utils";

/**
 * MobileChips — Chips/filtros mobile.
 * Layout: flex wrap, gap 8px.
 * Chip ativo: bg-primary, text-primary-foreground.
 * Chip inativo: bg-muted, text-muted-foreground.
 */
export function MobileChips({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      role="group"
      aria-label="Filtros"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold transition-colors",
            "min-h-11", // 44px touch target
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
