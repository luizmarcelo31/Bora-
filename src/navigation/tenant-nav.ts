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
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import type { Funcao } from "@prisma/client";

import { can } from "@/lib/permissions";
import type { NavGroup } from "./types";
import { CHANGELOG_NAV_ID } from "@/lib/changelog";

export type { NavBadge, NavGroup, NavMainItem, NavMainLinkItem, NavMainParentItem, NavSubItem } from "./types";

/**
 * Navegação da área do tenant (/dashboard).
 * Mesmo formato do admin-nav (Studio Admin, MIT): grupos + links,
 * reaproveitando o NavMain genérico em src/components/shell/nav-main.tsx.
 *
 * `permission` é a MESMA permissão que a página de destino exige em
 * `requirePermission`. Sem o filtro em `visibleTenantNav`, a sidebar oferece um
 * item e a página responde `/unauthorized`. `null` = página sem guarda de
 * permissão, item liberado para todo role.
 *
 * Guardas conferidas uma a uma contra o código das páginas em 07/10:
 * estoque e divergências `inventory.view` · pdv, pdv/express e pdv/offline
 * `sales.create` · caixa `cashbox.view` · financeiro `financial.view` ·
 * relatorios `reports.view` · configuracoes `tenants.manage`. As demais
 * páginas não chamam `requirePermission`.
 */
export const tenantNav: NavGroup[] = [
  {
    id: 1,
    label: "Operação",
    items: [
      { id: "overview", title: "Visão geral", url: "/dashboard", icon: LayoutDashboard, permission: null },
      { id: "products", title: "Produtos", url: "/dashboard/produtos", icon: Package, permission: null },
      { id: "categories", title: "Categorias", url: "/dashboard/categorias", icon: Tag, permission: null },
      { id: "stock", title: "Estoque", url: "/dashboard/estoque", icon: Boxes, permission: "inventory.view" },
      { id: "inventory", title: "Inventário", url: "/dashboard/inventario", icon: ClipboardCheck, permission: null },
      { id: "pdv", title: "PDV", url: "/dashboard/pdv", icon: ShoppingCart, permission: "sales.create" },
      { id: "divergencias", title: "Divergências offline", url: "/dashboard/divergencias", icon: TriangleAlert, permission: "inventory.view" },
      { id: "promotions", title: "Promoções", url: "/dashboard/promocoes", icon: Percent, permission: null },
    ],
  },
  {
    id: 2,
    label: "Compras",
    items: [
      { id: "purchases", title: "Compras", url: "/dashboard/compras", icon: Truck, permission: null },
    ],
  },
  {
    id: 3,
    label: "Financeiro",
    items: [
      { id: "cashbox", title: "Caixa", url: "/dashboard/caixa", icon: Wallet, permission: "cashbox.view" },
      { id: "financial", title: "Financeiro", url: "/dashboard/financeiro", icon: Landmark, permission: "financial.view" },
    ],
  },
  {
    id: 4,
    label: "Gestão",
    items: [
      { id: "reports", title: "Relatórios", url: "/dashboard/relatorios", icon: BarChart3, permission: "reports.view" },
      { id: "settings", title: "Configurações", url: "/dashboard/configuracoes", icon: Settings, permission: "tenants.manage" },
      { id: "audit", title: "Auditoria", url: "/dashboard/auditoria", icon: ClipboardList, permission: null },
      { id: CHANGELOG_NAV_ID, title: "Novidades", url: "/dashboard/novidades", icon: Sparkles, badge: "new", permission: null },
    ],
  },
];

/**
 * Sidebar do tenant já filtrada por permissão, para o role informado.
 *
 * Item e subItem saem juntos: um pai sem nenhum filho utilizável é só um título
 * morto. Grupo sem nenhum item utilizável some inteiro, para não deixar
 * "OPERAÇÃO" colado sobre uma lista vazia. `VISÃO GERAL` nunca some — é o
 * destino válido de todo role e sem ele a sidebar fica sem ponto de entrada.
 *
 * `adminNav` NÃO tem equivalente de propósito: /admin exige SUPER_ADMIN por
 * inteiro (ver src/lib/admin.ts), então filtrar lá seria código morto.
 */
export function visibleTenantNav(funcao: Funcao | null | undefined): NavGroup[] {
  const grupos: NavGroup[] = [];

  for (const grupo of tenantNav) {
    const itens = grupo.items.filter((item) => {
      const permissao = item.permission ?? null;
      if (permissao === null) return true;
      return can(funcao, permissao);
    });

    if (itens.length > 0) grupos.push({ ...grupo, items: itens });
  }

  return grupos;
}
