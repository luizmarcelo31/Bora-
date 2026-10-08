import type { Funcao } from "@prisma/client";

import { can, type Permissao } from "@/lib/permissions";
import type { BottomNavItem } from "@/components/shell/BottomNav";

/**
 * Menu rápido do mobile (abaixo de 768px) da área do tenant.
 *
 * Cada item declara a MESMA permissão que a página de destino exige em
 * `requirePermission`. Sem essa paridade a barra oferecia cinco destinos para
 * todo role e três deles respondiam `/unauthorized` ao toque — e o FAB, que é o
 * item de maior destaque da tela, era um deles.
 *
 * A paridade vale nos dois sentidos: este filtro impede que o item sem
 * permissão seja oferecido, e o `requirePermission` da página continua sendo a
 * autoridade. A lista é dado de navegação, nunca guarda de acesso.
 */
export interface TenantBottomNavItem extends BottomNavItem {
  /** Permissão exigida pela página de destino. `null` = página sem guarda. */
  readonly permission: Permissao | null;
}

/**
 * `fab: true` marca quem recebe o botão elevado (ícone da logo) em vez do
 * ícone da chave — não o índice. A lista é filtrada por permissão antes de
 * chegar no componente, então a posição do PDV muda conforme o role; fixar
 * `i === 2` colocaria a logo em cima de "Estoque" para quem não pode vender.
 */
export const TENANT_BOTTOM_NAV: readonly TenantBottomNavItem[] = [
  { title: "Início", url: "/dashboard", icon: "inicio", permission: null },
  { title: "Estoque", url: "/dashboard/estoque", icon: "estoque", permission: "inventory.view" },
  { title: "PDV", url: "/dashboard/pdv/express", icon: "pdv", permission: "sales.create", fab: true },
  { title: "Caixa", url: "/dashboard/caixa", icon: "caixa", permission: "cashbox.view" },
  { title: "Finan.", url: "/dashboard/financeiro", icon: "financeiro", permission: "financial.view" },
];

/**
 * Itens que o role pode usar de fato.
 *
 * `Início` nunca sai: é o destino válido de todos os roles e, sem ele, a barra
 * ficaria vazia em mobile — que é onde ela é a única navegação. O FAB some
 * junto com o PDV, porque botão elevado que leva a 403 é pior do que uma barra
 * com quatro destinos que funcionam.
 */
export function visibleBottomNavItems(funcao: Funcao | null | undefined): BottomNavItem[] {
  const visiveis = TENANT_BOTTOM_NAV.filter(
    (item) => item.permission === null || can(funcao, item.permission)
  );

  return visiveis.length > 0 ? visiveis : [TENANT_BOTTOM_NAV[0]];
}