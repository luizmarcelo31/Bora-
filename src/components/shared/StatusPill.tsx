import { cn } from "cn"
import type { Tom } from "@/lib/labels"

const TONS: Record<Tom, string> = {
  neutro:   "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)]",
  positivo: "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]",
  atencao:  "bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]",
  critico:  "bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]",
  informativo: "bg-[var(--status-brand-bg)] text-[var(--status-brand-fg)]",
}

const PONTOS: Record<Tom, string> = {
  neutro:   "bg-[var(--status-neutral-dot)]",
  positivo: "bg-[var(--status-success-dot)]",
  atencao:  "bg-[var(--status-warning-dot)]",
  critico:  "bg-[var(--status-danger-dot)]",
  informativo: "bg-[var(--status-brand-dot)]",
}

export function StatusPill({
  tom = "neutro",
  children,
  className,
}: {
  tom?: Tom
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        TONS[tom],
        "border-black/5 dark:border-white/5",
        className
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", PONTOS[tom])} />
      {children}
    </span>
  )
}
