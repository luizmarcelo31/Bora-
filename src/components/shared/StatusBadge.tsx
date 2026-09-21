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

const statusConfig: Record<StatusType, { bg: string; text: string; defaultLabel: string }> = {
  active: { bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-400", defaultLabel: "Ativo" },
  inactive: { bg: "bg-muted", text: "text-muted-foreground", defaultLabel: "Inativo" },
  open: { bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-400", defaultLabel: "Aberto" },
  closed: { bg: "bg-muted", text: "text-muted-foreground", defaultLabel: "Fechado" },
  paid: { bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-400", defaultLabel: "Pago" },
  pending: { bg: "bg-amber-50 dark:bg-amber-950/50", text: "text-amber-700 dark:text-amber-400", defaultLabel: "Pendente" },
  ok: { bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-400", defaultLabel: "Ok" },
  low: { bg: "bg-amber-50 dark:bg-amber-950/50", text: "text-amber-700 dark:text-amber-400", defaultLabel: "Baixo" },
  out: { bg: "bg-red-50 dark:bg-red-950/50", text: "text-red-700 dark:text-red-400", defaultLabel: "Sem estoque" },
  income: { bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-400", defaultLabel: "Receita" },
  expense: { bg: "bg-red-50 dark:bg-red-950/50", text: "text-red-700 dark:text-red-400", defaultLabel: "Despesa" },
  transfer: { bg: "bg-blue-50 dark:bg-blue-950/50", text: "text-blue-700 dark:text-blue-400", defaultLabel: "Transferência" },
  entry: { bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-400", defaultLabel: "Entrada" },
  exit: { bg: "bg-red-50 dark:bg-red-950/50", text: "text-red-700 dark:text-red-400", defaultLabel: "Saída" },
  adjustment: { bg: "bg-amber-50 dark:bg-amber-950/50", text: "text-amber-700 dark:text-amber-400", defaultLabel: "Ajuste" },
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      data-slot="status-badge"
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        config.bg,
        config.text,
        className
      )}
    >
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
