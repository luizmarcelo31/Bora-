import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

/**
 * Resolve o tenant atual.
 * Ordem: header X-Tenant-Id → usuário do banco (via email da sessão é resolvido na chamada).
 *
 * Nas Route Handlers atuais (fase fundação), o tenant vem do header.
 * Quando o Auth estiver completo, o tenant será derivado da sessão.
 */
export async function getTenantIdFromHeaders(
  fallback?: number
): Promise<number> {
  const h = await headers();
  const raw = h.get("x-tenant-id") ?? h.get("X-Tenant-Id");
  const parsed = raw ? parseInt(raw, 10) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  if (fallback) return fallback;
  throw new Error("Tenant não informado (header X-Tenant-Id)");
}

export async function requireTenant(tenantId: number) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Tenant não encontrado");
  if (!tenant.active || tenant.suspended) throw new Error("Tenant inativo");
  return tenant;
}

/** Busca o vínculo usuário ↔ tenant pelo email (ponte Supabase Auth → banco local). */
export async function getUserContextByEmail(email: string) {
  const user = await prisma.user.findFirst({
    where: { email },
    include: { tenant: true },
  });
  return user;
}

/**
 * Contexto do tenant para Server Components/Actions da área do tenant.
 * Sem sessão → /login. Sem vínculo ativo → /unauthorized.
 */
export async function requireSessionTenant(redirectTo = "/dashboard") {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) redirect(`/login?redirect=${redirectTo}`);

  const dbUser = await getUserContextByEmail(sessionUser.email);
  if (!dbUser || !dbUser.active) redirect("/unauthorized");

  const tenant = await requireTenant(dbUser.tenantId);
  return { tenant, dbUser };
}
