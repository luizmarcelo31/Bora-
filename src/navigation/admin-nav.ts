import { LayoutDashboard, Building2, Users, KeyRound } from "lucide-react";
import type { NavGroup } from "./types";

export type { NavBadge, NavGroup, NavMainItem, NavMainLinkItem, NavMainParentItem, NavSubItem } from "./types";

/**
 * Navegação da área /admin (Super Admin, nível plataforma).
 * Formato inspirado no Studio Admin (arhamkhnz/next-shadcn-admin-dashboard, MIT),
 * reduzido ao escopo da plataforma. Filtrar por permissão é desnecessário aqui:
 * todo o /admin já exige role SUPER_ADMIN (ver src/lib/admin.ts).
 */
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
