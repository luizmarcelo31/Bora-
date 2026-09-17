import type { Role } from "@prisma/client";

/**
 * Hierarquia de roles (maior número = mais poder).
 * SUPER_ADMIN está fora do tenant (nível plataforma).
 */
export const ROLE_RANK: Record<Role, number> = {
  STAFF: 10,
  CASHIER: 20,
  STOCK: 30,
  FINANCIAL: 40,
  MANAGER: 60,
  OWNER: 80,
  SUPER_ADMIN: 100,
};

export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}

export function isSuperAdmin(role: Role | null | undefined): boolean {
  return role === "SUPER_ADMIN";
}
