"use client";

import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { BrandMark } from "@/components/shared/BrandMark";
import type { NavGroup } from "@/navigation/types";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  homeHref: string;
  nav: readonly NavGroup[];
  user: { name: string; email: string };
}

/**
 * Sidebar única das duas roles (Fase 2 — shell unificado).
 * A diferenciação é só dados: homeHref + grupos de navegação + usuário.
 */
export function AppSidebar({ homeHref, nav, user, ...props }: AppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link prefetch={false} href={homeHref}>
                <BrandMark />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={nav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
