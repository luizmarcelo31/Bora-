"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AppSheet } from "./app-sheet";
import { cn } from "@/lib/utils";

/**
 * Confirmação curta (spec MOBILE-UX 3.4). Substitui AlertDialog e cancel-dialog.
 * Destrutiva à esquerda-abaixo, Cancelar como padrão; chips quando há opções.
 */
export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  consequence,
  destructiveLabel,
  options,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  consequence: string;
  destructiveLabel: string;
  options?: string[];
  onConfirm: (choice?: string) => void;
}) {
  const [choice, setChoice] = useState<string | undefined>(options?.[0]);
  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={consequence}
      footer={
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="destructive"
            className="h-12 w-full text-base font-semibold"
            disabled={options !== undefined && choice === undefined}
            onClick={() => onConfirm(choice)}
          >
            {destructiveLabel}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      }
    >
      {options ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Opções">
          {options.map((o) => (
            <Button
              key={o}
              type="button"
              variant={choice === o ? "default" : "outline"}
              size="sm"
              aria-pressed={choice === o}
              className={cn(choice === o && "font-semibold")}
              onClick={() => setChoice(o)}
            >
              {o}
            </Button>
          ))}
        </div>
      ) : null}
    </AppSheet>
  );
}
