"use client";

import { cn } from "@/lib/utils";

/**
 * MobileStepper — Stepper mobile.
 * Layout: flex row, gap 8px.
 * Step ativo: bg-primary, step completado: bg-success, step pendente: bg-muted.
 */
export function MobileStepper({
  steps,
  currentStep,
  className,
}: {
  steps: Array<{ label: string; status: "pending" | "active" | "completed" }>;
  currentStep: number;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="progressbar"
      aria-valuenow={currentStep + 1}
      aria-valuemin={1}
      aria-valuemax={steps.length}
    >
      {steps.map((step, i) => {
        const isActive = i === currentStep;
        const isCompleted = i < currentStep || step.status === "completed";

        return (
          <div key={step.label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                isActive && "bg-primary text-primary-foreground",
                isCompleted && "bg-[var(--status-success-fg)] text-white",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? "✓" : i + 1}
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-6 rounded-full",
                  isCompleted ? "bg-[var(--status-success-fg)]" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
