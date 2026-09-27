"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

/**
 * Atalhos de teclado globais (Fase 2):
 *   /  → foca busca global
 *   N  → nova página de produto
 *   V  → nova venda (PDV)
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Buscar..."]') as HTMLInputElement;
        searchInput?.focus();
      }

      if (e.key === "n" && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        router.push("/dashboard/produtos?novo=1");
      }

      if (e.key === "v" && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        router.push("/dashboard/pdv");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, searchParams]);

  return null;
}
