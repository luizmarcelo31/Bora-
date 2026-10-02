"use client";

import { CloudOff, RefreshCw, TriangleAlert } from "lucide-react";

import { useSync } from "@/lib/offline/use-sync";
import { Button } from "@/components/ui/button";

/**
 * Indicador de vendas pendentes de sincronização (Fase 3.1 — modo offline).
 *
 * Vive dentro do PDV porque é lá que a venda é confirmada: o operador precisa
 * ver a contagem no mesmo gesto que fecha a venda, não numa tela de relatório
 * que ele não abre durante o expediente.
 *
 * some quando não há pendência. Um indicador fixo em "0 pendentes" vira
 * decoração depois de uma hora de balcão — e o alerta tem que ser raro para
 * ser lido.
 */
export function SyncIndicator({ tenantId, userId }: { tenantId: number; userId: number }) {
  const { estado, pendentes, mensagem, sincronizar } = useSync(tenantId, userId);

  if (pendentes === 0 && estado !== "pausado" && estado !== "erro") {
    return null;
  }

  if (estado === "pausado" || estado === "erro") {
    return (
      <div
        role="status"
        className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
      >
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="flex-1">
          <p className="font-semibold">
            {pendentes} venda{pendentes === 1 ? "" : "s"} aguardando
          </p>
          {mensagem ? <p className="text-xs text-muted-foreground">{mensagem}</p> : null}
          <p className="text-xs text-muted-foreground">
            As vendas estão salvas neste aparelho. Sincronize depois de entrar novamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
    >
      <CloudOff aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <span className="flex-1">
        <span className="font-semibold">{pendentes}</span> venda{pendentes === 1 ? "" : "s"} sem
        sincronizar
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => void sincronizar()}
        disabled={estado === "sincronizando"}
        aria-label="Sincronizar vendas agora"
      >
        <RefreshCw aria-hidden="true" className={estado === "sincronizando" ? "animate-spin" : ""} />
        {estado === "sincronizando" ? "Sincronizando" : "Sincronizar"}
      </Button>
    </div>
  );
}
