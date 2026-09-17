import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUserContextByEmail } from "@/lib/tenant";
import { isSuperAdmin } from "@/lib/roles";

/**
 * Super Admin raiz: conta única e imutável da plataforma.
 * Nunca rebaixar, desativar ou excluir este email em nenhum fluxo
 * (usar `assertMutableUser` em toda rota/action de gestão de usuários).
 */
export const ROOT_ADMIN_EMAIL = "luizmarcelodev@gmail.com";

export function assertMutableUser(email: string): void {
  if (email.toLowerCase() === ROOT_ADMIN_EMAIL) {
    throw new Error("Forbidden: conta raiz não pode ser alterada");
  }
}

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
