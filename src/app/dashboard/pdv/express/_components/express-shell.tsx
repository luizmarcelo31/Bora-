"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Contêiner imersivo do Express (spec E1): cobre header + bottom nav
 * (z-60), barra própria, scroll interno, safe-areas.
 * Botão Cancelar visível no header (decisão Fase 0).
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
          className="hit-area-44 gap-1"
          aria-label="Cancelar e sair do PDV Expresso"
          onClick={() => router.push("/dashboard")}
        >
          <span aria-hidden="true">✕</span>
          <span className="text-sm">Cancelar</span>
        </Button>
        <span className="truncate text-sm font-semibold">{cashboxName}</span>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden pb-[env(safe-area-inset-bottom)]">{children}</div>
    </div>
  );
}
