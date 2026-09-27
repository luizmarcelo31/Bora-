import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Trilha de navegação da área do admin.
 *
 * O último item é a página atual: sem link, com peso maior. Os anteriores
 * voltam. Fica no header do AppShell, à esquerda do rótulo de contexto.
 */
export function AdminBreadcrumb({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Trilha de navegação" className="hidden min-w-0 items-center gap-1 text-sm md:flex">
      {items.map((item, i) => {
        const ultimo = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1">
            {i > 0 ? (
              <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground/60" />
            ) : null}
            {item.href && !ultimo ? (
              <Link
                prefetch={false}
                href={item.href}
                className="truncate text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={ultimo ? "page" : undefined}
                className={cn("truncate", ultimo ? "font-semibold text-foreground" : "text-muted-foreground")}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
