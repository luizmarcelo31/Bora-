"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Barra de busca/leitor do Express (spec E2 §4.2).
 * Modo leitor (inputMode none) padrão; ⌨ alterna digitação.
 * Aviso persistente até próximo bip ou limpar.
 */
export function ScanBar({
  value,
  onChange,
  onEnter,
  warning,
  focusKey,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  warning: string | null;
  focusKey: number;
}) {
  const [typing, setTyping] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusKey > 0) ref.current?.focus({ preventScroll: true });
  }, [focusKey]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-base">
            🔎
          </span>
          <Input
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onEnter();
            }}
            placeholder={typing ? "Buscar nome ou código…" : "Bipe ou busque…"}
            aria-label="Buscar produto ou bipar código"
            inputMode={typing ? "search" : "none"}
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoFocus
            className="h-12 pl-9 text-base"
          />
        </div>
        {/* Câmera (E7): só renderizar com BarcodeDetector + implementação */}
        <Button
          type="button"
          variant={typing ? "default" : "outline"}
          className="h-12 w-12 shrink-0"
          aria-label={typing ? "Modo leitor" : "Modo teclado"}
          aria-pressed={typing}
          onClick={() => setTyping((t) => !t)}
        >
          <Keyboard className="size-5" />
        </Button>
      </div>
      {warning ? (
        <p role="alert" className={cn("text-sm font-semibold text-destructive")}>
          {warning}
        </p>
      ) : null}
    </div>
  );
}
