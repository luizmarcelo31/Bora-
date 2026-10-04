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

  useEffect(() => {
    const error = searchParams.get("error");
    const ok = searchParams.get("ok");
    if (!error && !ok) return;
    const key = `e=${error ?? ""}&o=${ok ?? ""}`;
    if (seen.current === key) return;
    seen.current = key;

    if (error) {
      // `msg` carrega a mensagem que o servidor já calculou — usada quando o
      // erro tem um número que o mapa estático não conhece ("limite do plano
      // atingido: 300 produtos"). O mapa continua sendo o piso, para o caso de
      // o servidor redirecionar sem detalhe.
      const doServidor = searchParams.get("msg");
      toast.error(doServidor ?? errorMap?.[error] ?? fallbackError);
    } else if (ok && (okText || okMap?.[ok])) {
      toast.success(okMap?.[ok] ?? okText!.replace("{v}", ok));
    }
    router.replace(pathname, { scroll: false });
  }, [searchParams, pathname, router, okText, okMap, errorMap, fallbackError]);

  return null;
}
