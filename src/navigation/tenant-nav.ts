import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Wallet,
  Landmark,
  Tag,
  BarChart3,
  Settings,
  ClipboardList,
} from "lucide-react";

/**
 * Navegação da área do tenant (/dashboard).
 * Mesmo formato do admin-nav (Studio Admin, MIT): grupos + links,
 * reaproveitando o NavMain genérico em src/components/admin/nav-main.tsx.
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

export const tenantNav: NavGroup[] = [
  {
    id: 1,
    label: "Operação",
    items: [
      { id: "overview", title: "Visão geral", url: "/dashboard", icon: LayoutDashboard },
      { id: "products", title: "Produtos", url: "/dashboard/produtos", icon: Package },
      { id: "categories", title: "Categorias", url: "/dashboard/categorias", icon: Tag },
      { id: "stock", title: "Estoque", url: "/dashboard/estoque", icon: Boxes },
      { id: "pdv", title: "PDV", url: "/dashboard/pdv", icon: ShoppingCart },
    ],
  },
  {
    id: 2,
    label: "Financeiro",
    items: [
      { id: "cashbox", title: "Caixa", url: "/dashboard/caixa", icon: Wallet },
      { id: "financial", title: "Financeiro", url: "/dashboard/financeiro", icon: Landmark },
    ],
  },
  {
    id: 3,
    label: "Gestão",
    items: [
      { id: "reports", title: "Relatórios", url: "/dashboard/relatorios", icon: BarChart3 },
      { id: "settings", title: "Configurações", url: "/dashboard/configuracoes", icon: Settings },
      { id: "audit", title: "Auditoria", url: "/dashboard/auditoria", icon: ClipboardList },
    ],
  },
];
