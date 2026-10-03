"use client";

import { cn } from "@/lib/utils";

/**
 * MobileActionBar — Barra de ação fixa mobile.
 * Layout: fixed bottom, altura 56px, padding 16px.
 * Botão full-width, altura 48px, border-radius 12px.
 */
export function MobileActionBar({
  label,
  onClick,
  disabled,
  variant = "primary",
  className,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "destructive";
  className?: string;
}) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-muted text-foreground hover:bg-muted/80",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background px-4 pt-4",
        "pb-[calc(1rem+env(safe-area-inset-bottom))]",
        className
      )}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant]
        )}
      >
        {label}
      </button>
    </div>
  );
}
