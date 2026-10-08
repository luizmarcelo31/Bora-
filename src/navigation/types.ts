import type { LucideIcon } from "lucide-react";
import type { Permissao } from "@/lib/permissions";

/**
 * Tipos de navegação compartilhados (única fonte — admin e tenant
 * só exportam dados). Formato inspirado no Studio Admin
 * (arhamkhnz/next-shadcn-admin-dashboard, MIT).
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
  /**
   * Permissão exigida pela página de destino, a mesma que a página passa para
   * `requirePermission`. Serve para FILTRAR o menu, não para autorizar: a
   * autorização continua sendo da página. `null` = página sem guarda.
   *
   * Só o tenant-nav usa. O admin-não precisa porque /admin já exige
   * SUPER_ADMIN inteiro (ver src/lib/admin.ts) e o comentário dele diz isso.
   */
  permission?: Permissao | null;
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
