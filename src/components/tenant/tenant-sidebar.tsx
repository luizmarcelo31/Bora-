"use client";

import type { Funcao } from "@prisma/client";

import { visibleTenantNav } from "@/navigation/tenant-nav";
import { AppSidebar, type AppSidebarProps } from "@/components/shell/AppSidebar";

/**
 * Wrapper da área /dashboard: o shell único com os dados do tenant.
 *
 * `"use client"` é obrigatório aqui, e não por convenience: `nav` carrega
 * ícones do lucide, que são `forwardRef` — objeto com método, não serializável.
 * Sem esta fronteira o Server Component tenta serializar a lista e o React
 * recusa (erro #441), derrubando a página inteira. Mesmo bug que o e3f054c
 * corrigiu no BottomNav.
 *
 * O `role` chega do layout (Server Component) como string do enum — serializa
 * junto, e o filtro por permissão roda aqui. Isso não é brecha de autorização:
 * a autoridade continua sendo o `requirePermission` de cada página, que roda
 * no servidor. O filtro é para o menu não oferecer beco sem saída.
 */
type TenantSidebarProps = Omit<AppSidebarProps, "homeHref" | "nav">;

export function TenantSidebar({ user, role, ...props }: TenantSidebarProps & { role: Funcao }) {
  return (
    <AppSidebar homeHref="/dashboard" nav={visibleTenantNav(role)} user={user} {...props} />
  );
}