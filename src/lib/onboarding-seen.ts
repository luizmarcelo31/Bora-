"use client";

/**
 * Estado de dispositivo do onboarding (Fase 2 — Onboarding).
 *
 * Só duas coisas moram aqui: se a pessoa já viu a tela de boas-vindas e se já
 * abriu os relatórios. Os outros dois passos são lidos do banco — ver o
 * comentário em `onboarding.ts` para o porquê dessa divisão.
 */

const SEEN_WELCOME_KEY = "boramais:onboarding:boas-vindas";
const SEEN_REPORTS_KEY = "boramais:onboarding:relatorio";

/** Evento interno: muda só nesta aba, que é onde o onboarding vive. */
export const ONBOARDING_EVENT = "boramais:onboarding:mudou";

function read(key: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    // Storage bloqueado: tratamos como "não viu". Repetir a boas-vindas é
    // incômodo, mostrar três tarefas a quem já vendeu é pior.
    return false;
  }
}

function write(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, "1");
    window.dispatchEvent(new Event(ONBOARDING_EVENT));
  } catch {
    // Sem escrita possível, o estado simplesmente não persiste entre recargas.
  }
}

/** A tela de boas-vindas já foi vista? */
export function hasSeenWelcome(): boolean {
  return read(SEEN_WELCOME_KEY);
}

/** Marca a boas-vindas como vista. */
export function markWelcomeSeen(): void {
  write(SEEN_WELCOME_KEY);
}

/** O relatório já foi aberto ao menos uma vez? */
export function hasSeenReports(): boolean {
  return read(SEEN_REPORTS_KEY);
}

/** Marca os relatórios como vistos. */
export function markReportsSeen(): void {
  write(SEEN_REPORTS_KEY);
}