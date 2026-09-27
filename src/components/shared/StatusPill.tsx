import { cn } from "cn";
import type { Tom } from "@/lib/labels";

/**
 * Badge genérico de status, alimentado pelos mapas de `src/lib/labels.ts`.
 *
 * Existe para os enums de plataforma (empresa, assinatura, ticket, saúde),
 * onde o componente legado `StatusBadge` — que conhece só os status do
 * tenant — não se aplica. A cor vem do `Tom`, nunca do token cru.
 */
const TONS: Record<Tom, string> = {
  neutro: "bg-muted text-muted-foreground",
  positivo: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  atencao: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  critico: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  informativo: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
};

const PONTOS: Record<Tom, string> = {
  neutro: "bg-muted-foreground/50",
  positivo: "bg-emerald-500",
  atencao: "bg-amber-500",
  critico: "bg-red-500",
  informativo: "bg-blue-500",
};

export function StatusPill({
  tom = "neutro",
  children,
  className,
}: {
  tom?: Tom;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-black/5 px-2.5 py-1 text-xs font-medium dark:border-white/5",
        TONS[tom],
        className
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", PONTOS[tom])} />
      {children}
    </span>
  );
}
