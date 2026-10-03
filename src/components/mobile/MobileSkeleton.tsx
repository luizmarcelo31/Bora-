"use client";

import { cn } from "@/lib/utils";

/**
 * MobileSkeleton — Skeleton mobile.
 * Renderiza skeletons animados (pulse).
 */
export function MobileSkeleton({
  width,
  height,
  count = 1,
  className,
}: {
  width?: string;
  height?: string;
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg bg-muted"
          style={{
            width: width ?? "100%",
            height: height ?? "1rem",
          }}
        />
      ))}
    </div>
  );
}
