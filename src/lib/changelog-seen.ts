"use client";

import { CURRENT_CHANGELOG_VERSION } from "./changelog";

/**
 * Marcação de "changelog visto" (Fase 2 — Retenção).
 *
 * Fica em localStorage, e não no banco: "a pessoa já leu este texto" é estado
 * do dispositivo, não dado do tenant. Se fosse coluna, o mesmo operador em dois
 * dispositivos seria marcado como visto num e não no outro — e pior, criar
 * migration por causa disso viola o AI_RULES sem ganho real.
 */

const STORAGE_KEY = "boramais:changelog:visto";

/**
 * Evento disparado quando o texto é marcado como visto.
 *
 * A sidebar vive no layout e não remonta ao navegar, então um `useState` lido
 * uma vez ficaria preso num valor velho: o usuário abriria "Novidades", o
 * storage mudaria, e o badge continuaria aceso em todas as telas seguintes.
 * O evento é o que religa a sidebar ao storage sem polling.
 */
export const CHANGELOG_SEEN_EVENT = "boramais:changelog:visto-mudou";

/**
 * Lê a última versão vista.
 *
 * Devolve `null` em vez de lançar: roda no servidor durante o render, onde
 * `localStorage` não existe, e uma exceção aqui derrubaria a página inteira
 * por causa de um texto de rodapé.
 */
export function readLastSeenVersion(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Modo privado / storage bloqueado: tratamos como "não viu".
    return null;
  }
}

/** Marca a versão atual como vista. Silencioso em falha de storage. */
export function markChangelogSeen(version: string = CURRENT_CHANGELOG_VERSION): void {
  if (typeof window === "undefined") {
    return;
  }

try {
    window.localStorage.setItem(STORAGE_KEY, version);
    window.dispatchEvent(new Event(CHANGELOG_SEEN_EVENT));
  } catch {
    // Sem espaço ou storage bloqueado: o badge simplesmente continua aparecendo,
    // que é o estado seguro — melhor novidade eterna do que sumir sem ler.
  }
}