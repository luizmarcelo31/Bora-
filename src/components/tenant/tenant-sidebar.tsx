"use client";

import { tenantNav } from "@/navigation/tenant-nav";
import { AppSidebar, type AppSidebarProps } from "@/components/shell/AppSidebar";

type TenantSidebarProps = Omit<AppSidebarProps, "homeHref" | "nav">;

/** Wrapper fino: área /dashboard usa o shell único com dados do tenant. */
export function TenantSidebar({ user, ...props }: TenantSidebarProps) {
  return <AppSidebar homeHref="/dashboard" nav={tenantNav} user={user} {...props} />;
}
