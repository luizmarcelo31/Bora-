"use client";

import { cn } from "@/lib/utils";
import { MobileCard } from "./MobileCard";

/**
 * MobileList — Lista-em-card mobile.
 * Renderiza lista de MobileCard com scroll vertical.
 */
export function MobileList({
  items,
  className,
}: {
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    value?: string;
    status?: string;
    action?: React.ReactNode;
  }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 overflow-y-auto",
        className
      )}
    >
      {items.map((item) => (
        <MobileCard
          key={item.id}
          title={item.title}
          subtitle={item.subtitle}
          value={item.value}
          action={item.action}
        />
      ))}
    </div>
  );
}
