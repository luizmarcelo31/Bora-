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
 * Navegação inferior mobile (skill mobile-saas §5).
 * Só destinos primários (máx 5), labels visíveis, alvos 44px+,
 * safe-area respeitada. `md:hidden` — desktop usa a sidebar.
 */
export function BottomNav({ items }: { items: readonly BottomNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden"
    >
      <div className="grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = pathname === item.url;
          const Icon = item.icon;
          return (
            <Link
              key={item.url}
              href={item.url}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px]",
                active ? "font-semibold text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
