"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/**
 * Lê ?error= / ?ok= da URL, dispara toast (sonner) e limpa os params.
 * Substitui os <p> inline de erro/sucesso nas páginas de formulário.
 */
export function SearchParamToast({
  okText,
  okMap,
  errorMap,
  fallbackError = "Não foi possível concluir a operação.",
}: {
  okText?: string;
  okMap?: Record<string, string>;
  errorMap?: Record<string, string>;
  fallbackError?: string;
}) {
  return (
    <Suspense fallback={null}>
      <SearchParamToastInner
        okText={okText}
        okMap={okMap}
        errorMap={errorMap}
        fallbackError={fallbackError}
      />
    </Suspense>
  );
}

function SearchParamToastInner({
  okText,
  okMap,
  errorMap,
  fallbackError,
}: {
  okText?: string;
  okMap?: Record<string, string>;
  errorMap?: Record<string, string>;
  fallbackError: string;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const seen = useRef<string | null>(null);

  // Guarda a referência mais recente sem re-disparar o efeito.
  const latest = useRef({ okText, okMap, errorMap, fallbackError });
  latest.current = { okText, okMap, errorMap, fallbackError };

  useEffect(() => {
    const error = searchParams.get("error");
    const ok = searchParams.get("ok");
    if (!error && !ok) return;
    const key = `e=${error ?? ""}&o=${ok ?? ""}`;
    if (seen.current === key) return;
    seen.current = key;

    const { okText: ot, okMap: om, errorMap: em, fallbackError: fe } =
      latest.current;
    if (error) {
      toast.error(em?.[error] ?? fe);
    } else if (ok && (ot || om?.[ok])) {
      toast.success(om?.[ok] ?? ot!.replace("{v}", ok));
    }
    router.replace(pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  return null;
}
