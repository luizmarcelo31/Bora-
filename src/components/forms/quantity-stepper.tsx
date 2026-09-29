"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useLongPressRepeat } from "@/hooks/use-long-press";
import { cn } from "@/lib/utils";

/**
 * Stepper grande − / valor / + (spec 3.5). Segurar acelera.
 */
export function QuantityStepper({
  value,
  min = 0,
  max = 999,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const dec = useLongPressRepeat(() => onChange(Math.max(min, value - 1)));
  const inc = useLongPressRepeat(() => onChange(Math.min(max, value + 1)));
  const { guardedClick: decClick, ...decHandlers } = dec;
  const { guardedClick: incClick, ...incHandlers } = inc;
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <Button
        type="button"
        variant="outline"
        className="min-h-11 min-w-11"
        aria-label="Diminuir"
        onClick={decClick(() => onChange(Math.max(min, value - 1)))}
        {...decHandlers}
      >
        <Minus className="size-4" />
      </Button>
      <span aria-live="polite" className={cn("w-10 text-center text-base font-semibold tabular-nums")}>
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        className="min-h-11 min-w-11"
        aria-label="Aumentar"
        onClick={incClick(() => onChange(Math.min(max, value + 1)))}
        {...incHandlers}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
