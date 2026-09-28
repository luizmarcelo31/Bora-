import { requireSessionTenant } from "@/lib/tenant";
import { TenantSidebar } from "@/components/tenant/tenant-sidebar";
import { AppShell } from "@/components/shell/AppShell";
import { BottomNav } from "@/components/shell/BottomNav";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { LayoutDashboard, ShoppingCart, Boxes, Wallet, Landmark } from "lucide-react";

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
          items={[
            { title: "Início", url: "/dashboard", icon: LayoutDashboard },
            { title: "PDV", url: "/dashboard/pdv", icon: ShoppingCart },
            { title: "Estoque", url: "/dashboard/estoque", icon: Boxes },
            { title: "Caixa", url: "/dashboard/caixa", icon: Wallet },
            { title: "Finan.", url: "/dashboard/financeiro", icon: Landmark },
          ]}
        />
      }
    >
      {children}
    </AppShell>
  );
}
