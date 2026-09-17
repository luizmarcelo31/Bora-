import type { Role } from "@prisma/client";

/**
 * Matriz de permissões por role (nível tenant).
 * Mantém o conceito da fundação: TENANT → TYPE → ROLE → PERMISSION.
 *
 * Convenção: recurso.ação (ex: "products.create").
 */
export type Permission =
  | "products.view"
  | "products.create"
  | "products.update"
  | "products.delete"
  | "inventory.view"
  | "inventory.move"
  | "sales.view"
  | "sales.create"
  | "sales.cancel"
  | "cashbox.view"
  | "cashbox.open"
  | "cashbox.close"
  | "financial.view"
  | "financial.create"
  | "users.view"
  | "users.manage"
  | "tenants.manage"
  | "reports.view";

const OWNER_PERMS: Permission[] = [
  "products.view",
  "products.create",
  "products.update",
  "products.delete",
  "inventory.view",
  "inventory.move",
  "sales.view",
  "sales.create",
  "sales.cancel",
  "cashbox.view",
  "cashbox.open",
  "cashbox.close",
  "financial.view",
  "financial.create",
  "users.view",
  "users.manage",
  "tenants.manage",
  "reports.view",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [...OWNER_PERMS],
  OWNER: [...OWNER_PERMS],
  MANAGER: [
    "products.view",
    "products.create",
    "products.update",
    "inventory.view",
    "inventory.move",
    "sales.view",
    "sales.create",
    "sales.cancel",
    "cashbox.view",
    "cashbox.open",
    "cashbox.close",
    "financial.view",
    "reports.view",
    "users.view",
  ],
  FINANCIAL: ["financial.view", "financial.create", "reports.view", "sales.view"],
  STOCK: [
    "products.view",
    "products.create",
    "products.update",
    "inventory.view",
    "inventory.move",
  ],
  CASHIER: ["products.view", "sales.view", "sales.create", "cashbox.view"],
  STAFF: ["products.view", "sales.view"],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    throw new Error(`Forbidden: role ${role} não possui ${permission}`);
  }
}
