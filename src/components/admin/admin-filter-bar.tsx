"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface FiltroChip {
  valor: string;
  rotulo: string;
}

/**
 * Barra de filtro das listagens do admin.
 *
 * O estado mora na URL: com isso a lista é compartilhável, o botão voltar
 * do navegador funciona e a consulta no servidor é sempre a fonte da
 * verdade (nada de filtrar um array já trazido do banco).
 *
 * A busca tem debounce para não disparar uma query por tecla.
 */
export function AdminFilterBar({
  placeholder = "Buscar…",
  paramBusca = "q",
  chips,
  paramChip = "status",
  chipAtivo,
  descricao = "Filtrar",
}: {
  placeholder?: string;
  paramBusca?: string;
  chips?: FiltroChip[];
  paramChip?: string;
  chipAtivo?: string;
  descricao?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendente, iniciar] = useTransition();

  const urlAtual = searchParams.get(paramBusca) ?? "";

  // `texto` guarda o que o usuário digitou; `urlAtual` é a verdade da
  // consulta. A sincronia entre os dois é feita pelo debounce abaixo, e
  // não por effect que chama setState — evitar render em cascata.
  const [texto, setTexto] = useState(urlAtual);
  const ultimoEnviado = useRef(urlAtual);

  function montar(novos: Record<string, string | undefined>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(novos)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    // Mudar filtro reinicia a paginação: a página 7 do filtro anterior
    // não significa nada no novo recorte.
    sp.delete("pagina");
    const s = sp.toString();
    ultimoEnviado.current = novos[paramBusca] ?? "";
    iniciar(() => router.push(s ? `?${s}` : "?", { scroll: false }));
  }

  // Debounce: espera o usuário parar de digitar antes de consultar.
  useEffect(() => {
    if (texto === urlAtual) return;
    const t = setTimeout(() => montar({ [paramBusca]: texto || undefined }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, urlAtual]);

  // Voltar/avançar do navegador muda a URL por fora: alinha o campo sem
  // disparar consulta nova, porque `texto` já é o valor da URL.
  const valorExibido = texto === urlAtual ? urlAtual : texto;

  const temFiltro = Boolean(urlAtual) || Boolean(chipAtivo);

  return (
    <div className="flex flex-wrap items-center gap-3 py-3">
      <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={valorExibido}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-9 pl-8"
        />
      </div>

      {chips && chips.length > 0 ? (
        <div
          role="group"
          aria-label={descricao}
          className="flex flex-wrap items-center gap-1.5"
        >
          {chips.map((c) => {
            const ativo = chipAtivo === c.valor;
            return (
              <Button
                key={c.valor}
                type="button"
                size="sm"
                variant={ativo ? "default" : "outline"}
                className={cn("h-9", !ativo && "text-muted-foreground")}
                aria-pressed={ativo}
                onClick={() => montar({ [paramChip]: ativo ? undefined : c.valor })}
              >
                {c.rotulo}
              </Button>
            );
          })}
        </div>
      ) : null}

      {temFiltro ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-9 text-muted-foreground"
          onClick={() => {
            setTexto("");
            montar({ [paramBusca]: undefined, [paramChip]: undefined });
          }}
        >
          <X aria-hidden="true" className="size-3.5" />
          Limpar
        </Button>
      ) : null}

      {pendente ? (
        <span className="text-xs text-muted-foreground" role="status">
          Filtrando…
        </span>
      ) : null}
    </div>
  );
}
