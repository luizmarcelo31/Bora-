import { cn } from "cn"

type StatusType =
  | "active"
  | "inactive"
  | "open"
  | "closed"
  | "paid"
  | "pending"
  | "ok"
  | "low"
  | "out"
  | "income"
  | "expense"
  | "transfer"
  | "entry"
  | "exit"
  | "adjustment"

interface StatusBadgeProps {
  status: StatusType
  label?: string
  className?: string
}

const statusConfig: Record<
  StatusType,
  { bg: string; text: string; dot: string; defaultLabel: string }
> = {
  active:     { bg: "bg-[var(--status-success-bg)]", text: "text-[var(--status-success-fg)]", dot: "bg-[var(--status-success-dot)]", defaultLabel: "Ativo" },
  inactive:   { bg: "bg-[var(--status-neutral-bg)]",   text: "text-[var(--status-neutral-fg)]",   dot: "bg-[var(--status-neutral-dot)]",   defaultLabel: "Inativo" },
  open:       { bg: "bg-[var(--status-success-bg)]", text: "text-[var(--status-success-fg)]", dot: "bg-[var(--status-success-dot)]", defaultLabel: "Aberto" },
  closed:     { bg: "bg-[var(--status-neutral-bg)]",   text: "text-[var(--status-neutral-fg)]",   dot: "bg-[var(--status-neutral-dot)]",   defaultLabel: "Fechado" },
  paid:       { bg: "bg-[var(--status-success-bg)]", text: "text-[var(--status-success-fg)]", dot: "bg-[var(--status-success-dot)]", defaultLabel: "Pago" },
  pending:    { bg: "bg-[var(--status-warning-bg)]", text: "text-[var(--status-warning-fg)]", dot: "bg-[var(--status-warning-dot)]", defaultLabel: "Pendente" },
  ok:         { bg: "bg-[var(--status-success-bg)]", text: "text-[var(--status-success-fg)]", dot: "bg-[var(--status-success-dot)]", defaultLabel: "Ok" },
  low:        { bg: "bg-[var(--status-warning-bg)]", text: "text-[var(--status-warning-fg)]", dot: "bg-[var(--status-warning-dot)]", defaultLabel: "Baixo" },
  out:        { bg: "bg-[var(--status-danger-bg)]",   text: "text-[var(--status-danger-fg)]",   dot: "bg-[var(--status-danger-dot)]",   defaultLabel: "Sem estoque" },
  income:     { bg: "bg-[var(--status-success-bg)]", text: "text-[var(--status-success-fg)]", dot: "bg-[var(--status-success-dot)]", defaultLabel: "Receita" },
  expense:    { bg: "bg-[var(--status-danger-bg)]",   text: "text-[var(--status-danger-fg)]",   dot: "bg-[var(--status-danger-dot)]",   defaultLabel: "Despesa" },
  transfer:   { bg: "bg-[var(--status-neutral-bg)]", text: "text-[var(--status-neutral-fg)]", dot: "bg-[var(--status-neutral-dot)]", defaultLabel: "Transferência" },
  entry:      { bg: "bg-[var(--status-success-bg)]", text: "text-[var(--status-success-fg)]", dot: "bg-[var(--status-success-dot)]", defaultLabel: "Entrada" },
  exit:       { bg: "bg-[var(--status-danger-bg)]",   text: "text-[var(--status-danger-fg)]",   dot: "bg-[var(--status-danger-dot)]",   defaultLabel: "Saída" },
  adjustment: { bg: "bg-[var(--status-warning-bg)]", text: "text-[var(--status-warning-fg)]", dot: "bg-[var(--status-warning-dot)]", defaultLabel: "Ajuste" },
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      data-slot="status-badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-black/5 px-2.5 py-1 text-xs font-semibold dark:border-white/5",
        config.bg,
        config.text,
        className
      )}
    >
      {/* Dot indicator */}
      <span
        aria-hidden="true"
        className={cn("inline-block size-1.5 shrink-0 rounded-full", config.dot)}
      />
      {label ?? config.defaultLabel}
    </span>
  )
}

export function getStockStatus(quantity: number, minimum: number): StatusType {
  if (quantity <= 0) return "out"
  if (quantity <= minimum) return "low"
  return "ok"
}

export function getStockStatusLabel(quantity: number, minimum: number): string {
  if (quantity <= 0) return "Sem estoque"
  if (quantity <= minimum) return "Baixo"
  return "Ok"
}
