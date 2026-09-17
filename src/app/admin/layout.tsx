import Link from "next/link";
import { requireSuperAdmin } from "@/lib/admin";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/empresas", label: "Empresas" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/permissoes", label: "Permissões" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireSuperAdmin();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">BoraMais</span>
          <Badge>Super Admin</Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{admin.email}</span>
          <form action={logout}>
            <Button variant="outline" size="sm" type="submit">
              Sair
            </Button>
          </form>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
