import { requireSessionTenant } from "@/lib/tenant";
import { TenantSidebar } from "@/components/tenant/tenant-sidebar";
import { AppShell } from "@/components/shell/AppShell";
import { BottomNav } from "@/components/shell/BottomNav";
import { GlobalSearch } from "@/components/shared/GlobalSearch";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard");

  return (
    <AppShell
      sidebar={<TenantSidebar user={{ name: dbUser.name, email: dbUser.email }} />}
      contextLabel={tenant.name}
      badge={dbUser.role}
      search={<GlobalSearch tenantId={tenant.id} />}
      bottomNav={
        <BottomNav
          fabImage="/icons/botao-168.png"
          items={[
            { title: "Início", url: "/dashboard", icon: "inicio" },
            { title: "Estoque", url: "/dashboard/estoque", icon: "estoque" },
            { title: "PDV", url: "/dashboard/pdv/express", icon: "pdv" },
            { title: "Caixa", url: "/dashboard/caixa", icon: "caixa" },
            { title: "Finan.", url: "/dashboard/financeiro", icon: "financeiro" },
          ]}
        />
      }
    >
      {children}
    </AppShell>
  );
}
