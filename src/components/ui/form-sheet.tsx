"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { AppSheet } from "./app-sheet";
import { ConfirmSheet } from "./confirm-sheet";

/**
 * Formulário dentro do AppSheet (spec MOBILE-UX 3.3).
 * Submit mora no rodapé fixo; fechar com alterações pede confirmação.
 */
export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  pending,
  dirty,
  onSubmit,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  submitLabel: string;
  pending: boolean;
  dirty: boolean;
  onSubmit: (fd: FormData) => void;
  children: React.ReactNode;
}) {
  const formId = useId();
  const [confirming, setConfirming] = useState(false);

  function requestClose(next: boolean) {
    if (!next && dirty && !pending) {
      setConfirming(true);
      return;
    }
    onOpenChange(next);
  }

  return (
    <>
      <AppSheet
        open={open}
        onOpenChange={requestClose}
        title={title}
        description={description}
        footer={
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              form={formId}
              disabled={pending}
              className="h-12 w-full text-base font-semibold"
            >
              {pending ? "Salvando…" : submitLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              className="w-full"
              onClick={() => requestClose(false)}
            >
              Cancelar
            </Button>
          </div>
        }
      >
        <form
          id={formId}
          action={onSubmit}
          className="flex flex-col gap-3"
          onSubmit={() => setConfirming(false)}
        >
          {children}
        </form>
      </AppSheet>
      <ConfirmSheet
        open={confirming}
        onOpenChange={setConfirming}
        title="Descartar alterações?"
        consequence="O que você digitou será perdido."
        destructiveLabel="Descartar"
        onConfirm={() => {
          setConfirming(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
