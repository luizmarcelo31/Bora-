"use client";

import { useEffect } from "react";

import { markChangelogSeen } from "@/lib/changelog-seen";

/**
 * Marca o changelog como visto ao abrir a página (Fase 2 — Retenção).
 *
 * O badge de "novo" no menu é controlado por este marcador. Ele roda no mount,
 * e não no clique: o usuário abriu a página, o texto está na tela — isso já é
 * ler. Não há botão "dispensar" porque seria um segundo caminho para o mesmo
 * estado e mais uma chance de dessincronizar.
 *
 * Não renderiza nada — é só efeito colateral.
 */
export function ChangelogSeenMarker() {
  useEffect(() => {
    markChangelogSeen();
  }, []);

  return null;
}