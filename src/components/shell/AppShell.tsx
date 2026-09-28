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
 * Header: trigger + (trilha) + rótulo de contexto + (ações) + (busca) + tema + selo.
 * `breadcrumb` e `actions` são opcionais para não acoplar a área do tenant
 * a concepts que só o admin usa. O padding do conteúdo pertence às páginas
 * (contrato documentado em DESIGN.md).
 */
export async function AppShell({
  sidebar,
  contextLabel,
  badge,
  breadcrumb,
  actions,
  search,
  bottomNav,
  children,
}: {
  sidebar: React.ReactNode;
  contextLabel: string;
  badge: string;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
  search?: React.ReactNode;
  bottomNav?: React.ReactNode;
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      {sidebar}
      <SidebarInset className="min-w-0">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
        >
          Pular para o conteúdo
        </a>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b">
          <div className="flex w-full items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-2 h-4" />
            {breadcrumb}
            <span className="hidden truncate text-sm text-muted-foreground min-[480px]:block">{contextLabel}</span>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              {actions}
              {search}
              <ThemeToggle />
              <Badge className="hidden sm:inline-flex">{badge}</Badge>
            </div>
          </div>
        </header>
        <div id="conteudo" className="min-w-0 flex-1 scroll-mt-14 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
      </SidebarInset>
      {bottomNav}
    </SidebarProvider>
  );
}
