"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function useBarcodeSupported() {
  return React.useSyncExternalStore(
    () => () => {},
    () => typeof window !== "undefined" && "BarcodeDetector" in window,
    () => false
  );
}

/**
 * Escolha única em chips até ~6 opções; SelectField acima disso (spec 3.5).
 */
export function ChipSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span id={label} className="text-sm font-semibold">
        {label}
      </span>
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby={label}>
        {options.map((o) => (
          <Button
            key={o.value}
            type="button"
            variant={value === o.value ? "default" : "outline"}
            size="sm"
            aria-pressed={value === o.value}
            className={cn(value === o.value && "font-semibold")}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * Data com atalhos Hoje/Ontem; nativo por baixo (spec 3.5).
 */
export function DateField({
  value,
  onChange,
  label = "Data",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const [days] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    return { today, yesterday };
  });
  const { today, yesterday } = days;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={value === today ? "default" : "outline"}
          size="sm"
          aria-pressed={value === today}
          onClick={() => onChange(today)}
        >
          Hoje
        </Button>
        <Button
          type="button"
          variant={value === yesterday ? "default" : "outline"}
          size="sm"
          aria-pressed={value === yesterday}
          onClick={() => onChange(yesterday)}
        >
          Ontem
        </Button>
      </div>
      <Input type="date" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/**
 * Código de barras: digitação/leitor USB + câmera só se suportada (spec 3.5).
 */
export function BarcodeField({
  value,
  onChange,
  onScan,
  label = "Código de barras",
}: {
  value: string;
  onChange: (v: string) => void;
  onScan?: () => void;
  label?: string;
}) {
  const canScan = useBarcodeSupported() && !!onScan;
  return (
    <div className="flex gap-2">
      <Input
        aria-label={label}
        inputMode="numeric"
        autoComplete="off"
        autoCorrect="off"
        placeholder="Bipe ou digite…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1"
      />
      {canScan ? (
        <Button type="button" variant="outline" aria-label="Escanear com câmera" onClick={onScan}>
          📷
        </Button>
      ) : null}
    </div>
  );
}
