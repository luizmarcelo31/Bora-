"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BottomNavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

/**
 * Bottom bar estilo Android nativo (Material M3 navigation bar).
 * Com `fabImage`, o item do meio (índice 2) vira FAB elevado com a logo.
 * Labels sempre visíveis, alvos 44px+, safe-area respeitada.
 * `md:hidden` — desktop usa a sidebar.
 */
export function BottomNav({ items, fabImage }: { items: readonly BottomNavItem[]; fabImage?: string }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden"
    >
      <div className="grid grid-cols-5 items-end px-1 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))]">
        {items.map((item, i) => {
          const active = pathname === item.url;
          if (fabImage && i === 2) {
            return (
              <Link
                key={item.url}
                href={item.url}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                aria-label={item.title}
                className="flex flex-col items-center gap-0.5 text-[11px]"
              >
                <span
                  className={cn(
                    "-mt-5 size-14 overflow-hidden rounded-full shadow-lg ring-4",
                    active ? "ring-primary" : "ring-background"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- logo local public/, sem remotePatterns */}
                  <img src={fabImage} alt="" className="size-full object-cover" />
                </span>
                <span className={cn(active ? "font-semibold text-primary" : "text-muted-foreground")}>
                  {item.title}
                </span>
              </Link>
            );
          }
          const Icon = item.icon;
          return (
            <Link
              key={item.url}
              href={item.url}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              className="flex min-h-14 flex-col items-center justify-center gap-1 py-0.5 text-[11px]"
            >
              <span className={cn("flex h-7 items-center rounded-full px-4", active && "bg-primary/15")}>
                <Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
              </span>
              <span className={cn(active ? "font-semibold text-primary" : "text-muted-foreground")}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
