import { cookies } from "next/headers";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

/**
 * Shell único das duas roles (Fase 2).
 * Header idêntico: trigger + rótulo de contexto + (busca opcional) + tema + selo.
 * O padding do conteúdo pertence às páginas (contrato documentado em DESIGN.md).
 */
export async function AppShell({
  sidebar,
  contextLabel,
  badge,
  search,
  children,
}: {
  sidebar: React.ReactNode;
  contextLabel: string;
  badge: string;
  search?: React.ReactNode;
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      {sidebar}
      <SidebarInset className="min-w-0">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b">
          <div className="flex w-full items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-2 h-4" />
            <span className="truncate text-sm text-muted-foreground">{contextLabel}</span>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              {search}
              <ThemeToggle />
              <Badge className="hidden sm:inline-flex">{badge}</Badge>
            </div>
          </div>
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
