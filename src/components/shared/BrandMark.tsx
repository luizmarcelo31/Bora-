import { Store } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Slot da marca. Quando a logo oficial existir, trocar o ícone pelo
 * componente de imagem aqui — os 3 usos (login, sidebar, header) atualizam juntos.
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
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          inverted ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"
        )}
      >
        <Store className="size-4" />
      </span>
      {!compact && <span className="font-semibold text-base">{name}</span>}
    </span>
  );
}
