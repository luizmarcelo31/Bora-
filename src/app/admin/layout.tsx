import { requireSuperAdmin } from "@/lib/admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AppShell } from "@/components/shell/AppShell";
import { BottomNav } from "@/components/shell/BottomNav";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { AdminCommandPalette } from "@/components/admin/admin-command-palette";

/**
 * Shell da área /admin.
 *
 * A busca do header virou o command palette (Ctrl/Cmd+K): ele cobre as
 * rotas e as ações de plataforma, enquanto o filtro de texto solto da
 * listagem de empresas continua existindo dentro da própria tabela.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireSuperAdmin();

  return (
    <AppShell
      sidebar={<AdminSidebar user={{ name: admin.name, email: admin.email }} />}
      contextLabel="Administração da plataforma"
      badge="Super Admin"
      breadcrumb={<AdminBreadcrumb items={[{ label: "Admin" }, { label: "Visão geral" }]} />}
      actions={<AdminCommandPalette />}
      bottomNav={
        <BottomNav
          items={[
            { title: "Início", url: "/admin", icon: "inicio" },
            { title: "Empresas", url: "/admin/empresas", icon: "empresas" },
            { title: "Usuários", url: "/admin/usuarios", icon: "usuarios" },
            { title: "Assinat.", url: "/admin/assinaturas", icon: "assinaturas" },
            { title: "Planos", url: "/admin/planos", icon: "planos" },
          ]}
        />
      }
    >
      {children}
    </AppShell>
  );
}
