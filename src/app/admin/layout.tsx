import { requireSuperAdmin } from "@/lib/admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AppShell } from "@/components/shell/AppShell";
import { AdminSearch } from "@/components/admin/admin-search";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireSuperAdmin();

  return (
    <AppShell
      sidebar={<AdminSidebar user={{ name: admin.name, email: admin.email }} />}
      contextLabel="Administração da plataforma"
      badge="Super Admin"
      search={<AdminSearch />}
    >
      {children}
    </AppShell>
  );
}
