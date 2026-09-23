"use client";

import { adminNav } from "@/navigation/admin-nav";
import { AppSidebar, type AppSidebarProps } from "@/components/shell/AppSidebar";

type AdminSidebarProps = Omit<AppSidebarProps, "homeHref" | "nav">;

/** Wrapper fino: área /admin usa o shell único com dados da plataforma. */
export function AdminSidebar({ user, ...props }: AdminSidebarProps) {
  return <AppSidebar homeHref="/admin" nav={adminNav} user={user} {...props} />;
}
