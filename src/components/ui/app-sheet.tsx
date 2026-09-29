"use client";

import { Drawer } from "vaul";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/**
 * Primitivo único de sheet (spec MOBILE-UX 3.2).
 * Mobile: sobe de baixo com alça; desktop: painel lateral direito.
 * Cabeçalho fixo, corpo com scroll, rodapé fixo opcional.
 */
export function AppSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  dismissible = true,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  dismissible?: boolean;
}) {
  const isMobile = useIsMobile();
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      direction={isMobile ? "bottom" : "right"}
      dismissible={dismissible}
      handleOnly
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content
          className={cn(
            "fixed z-50 flex flex-col bg-background outline-none motion-reduce:transition-none",
            isMobile
              ? "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-2xl"
              : "inset-y-0 right-0 w-full border-l sm:max-w-lg"
          )}
        >
          {isMobile && (
            <Drawer.Handle
              aria-hidden="true"
              className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30"
            />
          )}
          <header className="px-4 pt-3 pb-2">
            <Drawer.Title className="font-heading text-base font-semibold">{title}</Drawer.Title>
            {description ? (
              <Drawer.Description className="text-sm text-muted-foreground">
                {description}
              </Drawer.Description>
            ) : null}
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
          {footer ? (
            <footer className="border-t bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              {footer}
            </footer>
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
