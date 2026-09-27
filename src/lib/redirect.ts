import type { Funcao } from "@prisma/client";
import { isSuperAdmin } from "@/lib/roles";

export const ADMIN_HOME = "/admin";
export const TENANT_HOME = "/dashboard";

/** Home padrao de cada funcao. Ponto unico de verdade do roteamento. */
export function getHomePathForRole(funcao: Funcao | null | undefined): string {
  return isSuperAdmin(funcao) ? ADMIN_HOME : TENANT_HOME;
}

/**
 * Valida redirect vindo de query string / form (anti open-redirect).
 * Aceita apenas caminho interno: começa com "/" único, sem protocolo,
 * sem "//", sem "\" e sem quebra de linha.
 */
export function isSafeRedirect(target: string): boolean {
  if (!target.startsWith("/") || target.startsWith("//")) return false;
  if (target.includes("://") || target.includes("\\")) return false;
  if (/[\r\n]/.test(target)) return false;
  return true;
}

/**
 * Decide o destino pos-login respeitando a funcao:
 * - SUPER_ADMIN: so aceita destinos /admin* (qualquer outro → /admin).
 * - demais funcoes: so aceita destinos fora de /admin* (qualquer outro → /dashboard).
 * - "/dashboard" e o valor padrao do formulario: cai no home da funcao.
 * - destino ausente/inseguro: cai no home da funcao.
 */
export function resolvePostLoginRedirect(
  funcao: Funcao | null | undefined,
  rawNext: string | null | undefined
): string {
  const fallback = getHomePathForRole(funcao);
  const next = (rawNext ?? "").trim();
  if (!next || !isSafeRedirect(next)) return fallback;

  if (isSuperAdmin(funcao)) {
    if (next === ADMIN_HOME || next.startsWith(`${ADMIN_HOME}/`)) return next;
    return ADMIN_HOME;
  }

  if (next === ADMIN_HOME || next.startsWith(`${ADMIN_HOME}/`)) return fallback;
  if (next === TENANT_HOME) return fallback;
  return next;
}
