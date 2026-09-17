import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUserContextByEmail } from "@/lib/tenant";
import { isSuperAdmin } from "@/lib/roles";

/**
 * Guarda de páginas Server (área /admin).
 * Sem sessão → /login. Sem role SUPER_ADMIN → /unauthorized.
 * Nunca confie apenas em esconder links no menu.
 */
export async function requireSuperAdmin() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) redirect("/login?redirect=/admin");

  const dbUser = await getUserContextByEmail(sessionUser.email);
  if (!dbUser || !dbUser.active || !isSuperAdmin(dbUser.role)) {
    redirect("/unauthorized");
  }

  return dbUser;
}
