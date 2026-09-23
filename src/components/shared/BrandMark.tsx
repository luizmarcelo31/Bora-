import { cn } from "@/lib/utils";
import { BrandLogo } from "./BrandLogo";

/**
 * Slot da marca. A arte vive em BrandLogo — os 3 usos
 * (login, sidebar, header) atualizam juntos.
 */
export function BrandMark({
  name = "BoraMais",
  compact = false,
  inverted = false,
  className,
}: {
  name?: string;
  compact?: boolean;
  /** Usar sobre fundo primary (ex.: painel do login). */
  inverted?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {inverted ? (
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground shadow-xs">
          <BrandLogo className="size-6" />
        </span>
      ) : (
        <BrandLogo className="size-8" />
      )}
      {!compact && (
        <span
          className={cn(
            "font-heading text-base font-bold tracking-tight",
            inverted ? "text-primary-foreground" : "text-foreground"
          )}
        >
          {name}
        </span>
      )}
    </span>
  );
}
