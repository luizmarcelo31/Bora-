import { cookies } from "next/headers";
import { requireSessionTenant } from "@/lib/tenant";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { TenantSidebar } from "@/components/tenant/tenant-sidebar";
import { GlobalSearch } from "@/components/shared/GlobalSearch";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard");

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <TenantSidebar user={{ name: dbUser.name, email: dbUser.email }} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b">
          <div className="flex w-full items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-2 h-4" />
            <span className="truncate text-sm text-muted-foreground">{tenant.name}</span>
            <div className="ml-auto flex items-center gap-2">
              <GlobalSearch tenantId={tenant.id} />
              <Badge className="hidden sm:inline-flex">{dbUser.role}</Badge>
            </div>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
