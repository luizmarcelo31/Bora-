"use client";

import { useCallback } from "react";
import { toast } from "sonner";

export function useActionToast() {
  const success = useCallback(
    (message: string) => toast.success(message),
    [],
  );
  const error = useCallback(
    (message: string) => toast.error(message),
    [],
  );
  const info = useCallback(
    (message: string) => toast.info(message),
    [],
  );

  return { success, error, info };
}

/**
 * Wrapper para actions que dispara toast automático.
 * Uso: const { submitWithToast } = useActionToast();
 *      submitWithToast(() => myAction(), "Salvo com sucesso", "Erro ao salvar");
 */
export function useActionSubmit() {
  const { success, error } = useActionToast();

  const submitWithToast = useCallback(
    async (
      action: () => Promise<void>,
      successMessage: string,
      errorMessage: string,
    ) => {
      try {
        await action();
        success(successMessage);
      } catch {
        error(errorMessage);
      }
    },
    [success, error],
  );

  return { submitWithToast };
}
