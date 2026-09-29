"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

/**
 * Contêiner imersivo do Express (spec E1): cobre header + bottom nav
 * (z-60), barra própria, scroll interno, safe-areas. ✕ volta ao dashboard.
 */
export function ExpressShell({
  cashboxName,
  children,
}: {
  cashboxName: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-2 pt-[env(safe-area-inset-top)]">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="hit-area-44"
          aria-label="Sair do PDV Expresso"
          onClick={() => router.push("/dashboard")}
        >
          <X className="size-5" />
        </Button>
        <span className="truncate text-sm font-semibold">{cashboxName}</span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">{children}</div>
    </div>
  );
}
