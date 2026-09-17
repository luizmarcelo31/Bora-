import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Building2, Users, KeyRound } from "lucide-react";

/**
 * Navegação da área /admin (Super Admin, nível plataforma).
 * Formato inspirado no Studio Admin (arhamkhnz/next-shadcn-admin-dashboard, MIT),
 * reduzido ao escopo da plataforma. Filtrar por permissão é desnecessário aqui:
 * todo o /admin já exige role SUPER_ADMIN (ver src/lib/admin.ts).
 */
export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const adminNav: NavGroup[] = [
  {
    id: 1,
    label: "Plataforma",
    items: [
      { id: "overview", title: "Visão geral", url: "/admin", icon: LayoutDashboard },
      { id: "tenants", title: "Empresas", url: "/admin/empresas", icon: Building2 },
      { id: "users", title: "Usuários", url: "/admin/usuarios", icon: Users },
      { id: "permissions", title: "Permissões", url: "/admin/permissoes", icon: KeyRound },
    ],
  },
];
