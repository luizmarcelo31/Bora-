import type { Funcao } from "@prisma/client";

import { requireSessionTenant } from "@/lib/tenant";
import { TenantSidebar } from "@/components/tenant/tenant-sidebar";
import { AppShell } from "@/components/shell/AppShell";
import { BottomNav } from "@/components/shell/BottomNav";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { visibleBottomNavItems } from "@/navigation/tenant-bottom-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard");
  const funcao = dbUser.role as Funcao;

  // Filtra por permissão: em mobile a BottomNav é a única navegação, então um
  // item que a página rejeitaria com /unauthorized seria um beco sem saída.
  // Ver src/navigation/tenant-bottom-nav.ts.
  const bottomNavItems = visibleBottomNavItems(funcao);

  return (
    <AppShell
      sidebar={
        <TenantSidebar role={funcao} user={{ name: dbUser.name, email: dbUser.email }} />
      }
      contextLabel={tenant.name}
      badge={dbUser.role}
      search={<GlobalSearch tenantId={tenant.id} />}
      bottomNav={<BottomNav fabImage="/icons/botao-168.png" items={bottomNavItems} />}
    >
      {children}
    </AppShell>
  );
}
