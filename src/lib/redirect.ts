import type { Role } from "@prisma/client";
import { isSuperAdmin } from "@/lib/roles";

export const ADMIN_HOME = "/admin";
export const TENANT_HOME = "/dashboard";

/** Home padrão de cada role. Ponto único de verdade do roteamento por role. */
export function getHomePathForRole(role: Role | null | undefined): string {
  return isSuperAdmin(role) ? ADMIN_HOME : TENANT_HOME;
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
 * Decide o destino pós-login respeitando o role:
 * - SUPER_ADMIN: só aceita destinos /admin* (qualquer outro → /admin).
 * - demais roles: só aceita destinos fora de /admin* (qualquer outro → /dashboard).
 * - "/dashboard" é o valor padrão do formulário: cai no home do role.
 * - destino ausente/inseguro: cai no home do role.
 */
export function resolvePostLoginRedirect(
  role: Role | null | undefined,
  rawNext: string | null | undefined
): string {
  const fallback = getHomePathForRole(role);
  const next = (rawNext ?? "").trim();
  if (!next || !isSafeRedirect(next)) return fallback;

  if (isSuperAdmin(role)) {
    if (next === ADMIN_HOME || next.startsWith(`${ADMIN_HOME}/`)) return next;
    return ADMIN_HOME;
  }

  if (next === ADMIN_HOME || next.startsWith(`${ADMIN_HOME}/`)) return fallback;
  if (next === TENANT_HOME) return fallback;
  return next;
}
