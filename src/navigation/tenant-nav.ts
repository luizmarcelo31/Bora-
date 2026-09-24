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
  Truck,
  Percent,
  ClipboardCheck,
} from "lucide-react";
import type { NavGroup } from "./types";

export type { NavBadge, NavGroup, NavMainItem, NavMainLinkItem, NavMainParentItem, NavSubItem } from "./types";

/**
 * Navegação da área do tenant (/dashboard).
 * Mesmo formato do admin-nav (Studio Admin, MIT): grupos + links,
 * reaproveitando o NavMain genérico em src/components/shell/nav-main.tsx.
 */
export const tenantNav: NavGroup[] = [
  {
    id: 1,
    label: "Operação",
    items: [
      { id: "overview", title: "Visão geral", url: "/dashboard", icon: LayoutDashboard },
      { id: "products", title: "Produtos", url: "/dashboard/produtos", icon: Package },
      { id: "categories", title: "Categorias", url: "/dashboard/categorias", icon: Tag },
      { id: "stock", title: "Estoque", url: "/dashboard/estoque", icon: Boxes },
      { id: "inventory", title: "Inventário", url: "/dashboard/inventario", icon: ClipboardCheck },
      { id: "pdv", title: "PDV", url: "/dashboard/pdv", icon: ShoppingCart },
      { id: "promotions", title: "Promoções", url: "/dashboard/promocoes", icon: Percent },
    ],
  },
  {
    id: 2,
    label: "Compras",
    items: [
      { id: "purchases", title: "Compras", url: "/dashboard/compras", icon: Truck },
    ],
  },
  {
    id: 3,
    label: "Financeiro",
    items: [
      { id: "cashbox", title: "Caixa", url: "/dashboard/caixa", icon: Wallet },
      { id: "financial", title: "Financeiro", url: "/dashboard/financeiro", icon: Landmark },
    ],
  },
  {
    id: 4,
    label: "Gestão",
    items: [
      { id: "reports", title: "Relatórios", url: "/dashboard/relatorios", icon: BarChart3 },
      { id: "settings", title: "Configurações", url: "/dashboard/configuracoes", icon: Settings },
      { id: "audit", title: "Auditoria", url: "/dashboard/auditoria", icon: ClipboardList },
    ],
  },
];
