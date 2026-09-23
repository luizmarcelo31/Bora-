import { requireSessionTenant } from "@/lib/tenant";
import { TenantSidebar } from "@/components/tenant/tenant-sidebar";
import { AppShell } from "@/components/shell/AppShell";
import { GlobalSearch } from "@/components/shared/GlobalSearch";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard");

  return (
    <AppShell
      sidebar={<TenantSidebar user={{ name: dbUser.name, email: dbUser.email }} />}
      contextLabel={tenant.name}
      badge={dbUser.role}
      search={<GlobalSearch tenantId={tenant.id} />}
    >
      {children}
    </AppShell>
  );
}
