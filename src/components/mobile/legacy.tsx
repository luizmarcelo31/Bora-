"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import * as React from "react";

/**
 * MobileBottomSheet — Bottom sheet (mobile) / drawer (desktop).
 * Substitui modal. Alça para arrastar para fechar.
 */
export function MobileBottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const isMobile = useIsMobile();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />

      {/* Content */}
      <div
        className={cn(
          "fixed z-50 flex flex-col bg-background outline-none",
          isMobile
            ? "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-2xl"
            : "inset-y-0 right-0 w-full border-l sm:max-w-lg"
        )}
      >
        {/* Handle (mobile only) */}
        {isMobile && (
          <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
        )}

        {/* Header */}
        <div className="flex items-start justify-between px-4 pt-3 pb-2">
          <div>
            <h3 className="font-heading text-base font-semibold">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="hit-area-44 -mr-2 flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * MobileToast — Toast para feedback.
 * Não bloqueia a ação principal.
 */
export function MobileToast({
  message,
  type = "info",
  onClose,
}: {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  onClose?: () => void;
}) {
  const colors = {
    success: "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]",
    error: "bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]",
    info: "bg-muted text-foreground",
    warning: "bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]",
  };

  return (
    <div
      className={cn(
        "fixed top-4 left-4 right-4 z-[60] flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg",
        colors[type]
      )}
      role="alert"
    >
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="hit-area-44 flex items-center justify-center"
          aria-label="Fechar"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

/**
 * MobileListItem — Item de lista legado.
 */
export function MobileListItem({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn("mobile-list-item", onClick && "cursor-pointer", className)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

/**
 * MobileEmpty — Estado vazio legado.
 */
export function MobileEmpty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mobile-empty">
      {Icon && <Icon className="size-12 text-muted-foreground" />}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {action}
    </div>
  );
}

// Hook useIsMobile
function useIsMobile() {
  return React.useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia("(max-width: 767px)");
      mql.addEventListener("change", notify);
      return () => mql.removeEventListener("change", notify);
    },
    () => window.innerWidth < 768,
    () => false
  );
}
