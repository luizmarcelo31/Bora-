import {
  Activity,
  Building2,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Package,
  Receipt,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";
import type { NavGroup } from "./types";

export type {
  NavBadge,
  NavGroup,
  NavMainItem,
  NavMainLinkItem,
  NavMainParentItem,
  NavSubItem,
} from "./types";

/**
 * Navegação da área /admin (nível plataforma).
 *
 * Agrupada por domínio de negócio, não por camada técnica: quem opera a
 * plataforma pensa em "quem são meus clientes", "quanto entra", "quem está
 * com problema" — não em "usuários e permissões". Filtrar por permissão é
 * desnecessário aqui: todo o /admin já exige Funcao SUPER_ADMIN
 * (ver src/lib/admin.ts).
 *
 * As rotas apontam para páginas que ainda não existem em algumas fases;
 * o item marcado `disabled` aparece esmaecido em vez de quebrar o build.
 */
export const adminNav: NavGroup[] = [
  {
    id: 1,
    label: "Plataforma",
    items: [
      { id: "overview", title: "Visão geral", url: "/admin", icon: LayoutDashboard },
      { id: "tenants", title: "Empresas", url: "/admin/empresas", icon: Building2 },
      { id: "users", title: "Usuários", url: "/admin/usuarios", icon: Users },
    ],
  },
  {
    id: 2,
    label: "Receita",
    items: [
      { id: "plans", title: "Planos", url: "/admin/planos", icon: Package },
      { id: "subscriptions", title: "Assinaturas", url: "/admin/assinaturas", icon: CreditCard },
      { id: "invoices", title: "Faturamento", url: "/admin/faturamento", icon: Receipt, disabled: true },
    ],
  },
  {
    id: 3,
    label: "Suporte",
    items: [
      { id: "tickets", title: "Tickets", url: "/admin/suporte", icon: LifeBuoy },
      { id: "broadcasts", title: "Comunicações", url: "/admin/notificacoes", icon: Megaphone },
    ],
  },
  {
    id: 4,
    label: "Acesso",
    items: [{ id: "permissions", title: "Permissões", url: "/admin/permissoes", icon: KeyRound }],
  },
  {
    id: 5,
    label: "Sistema",
    items: [
      { id: "health", title: "Saúde", url: "/admin/saude", icon: Activity },
      { id: "audit", title: "Auditoria", url: "/admin/auditoria", icon: ScrollText },
      {
        id: "settings",
        title: "Configurações",
        url: "/admin/configuracoes",
        icon: Settings,
      },
    ],
  },
];

/** Rotas navegáveis (ignora itens desabilitados), para busca e command palette. */
export const adminRoutes: { title: string; url: string; group: string; icon: NavGroup["items"][number]["icon"] }[] =
  adminNav.flatMap((g) =>
    g.items.flatMap((item) =>
      "url" in item && item.url && !item.disabled
        ? [{ title: item.title, url: item.url, group: g.label ?? "", icon: item.icon }]
        : []
    )
  );
