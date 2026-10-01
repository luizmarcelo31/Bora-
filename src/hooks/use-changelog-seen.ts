"use client";

import { useSyncExternalStore } from "react";

import { hasUnseenChanges } from "@/lib/changelog";
import { CHANGELOG_SEEN_EVENT, readLastSeenVersion } from "@/lib/changelog-seen";

/**
 * Assina mudanças do marcador "changelog visto".
 *
 * Ouvimos o evento do próprio app e não o `storage`: o evento `storage` do
 * navegador só dispara em OUTRA aba, então marcar como visto na página de
 * novidades não atualizaria a sidebar na mesma aba.
 */
function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener(CHANGELOG_SEEN_EVENT, onStoreChange);

  return () => {
    window.removeEventListener(CHANGELOG_SEEN_EVENT, onStoreChange);
  };
}

function getSnapshot(): boolean {
  return hasUnseenChanges(readLastSeenVersion());
}

/**
 * No servidor assumimos "há novidade".
 *
 * É o snapshot de hidratação: o servidor não tem `localStorage`, e devolver
 * `false` aqui deixaria o badge ausente no HTML e aparecendo só depois da
 * hidratação — um piscar. O `useSyncExternalStore` reavalia o snapshot do
 * cliente logo após hidratar e some com o badge sozinho.
 */
function getServerSnapshot(): boolean {
  return true;
}

/** Badge de "novo" no menu: `true` enquanto o texto da versão atual não foi lido. */
export function useHasUnseenChangelog(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}