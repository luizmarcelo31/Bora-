import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUserContextByEmail, requireTenant } from "@/lib/tenant";
import { isSuperAdmin } from "@/lib/roles";
import { ValidationError } from "@/lib/validators";

export type ApiContext = {
  tenantId: number;
  dbUserId: number;
  role: string;
  superAdmin: boolean;
};

/**
 * Contexto autenticado para Route Handlers.
 * - Exige sessão Supabase + vínculo ativo no banco (por email).
 * - Tenant SEMPRE derivado do vínculo; header/query são ignorados,
 *   exceto para SUPER_ADMIN operando sobre um tenant (nível plataforma).
 */
export async function requireApiContext(req: NextRequest): Promise<ApiContext> {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) throw new Error("Unauthorized");

  const dbUser = await getUserContextByEmail(sessionUser.email);
  if (!dbUser || !dbUser.active) {
    throw new Error("Forbidden: usuário sem vínculo ativo");
  }

  if (isSuperAdmin(dbUser.role)) {
    const raw =
      req.headers.get("x-tenant-id") ??
      req.nextUrl.searchParams.get("tenantId");
    const tenantId = raw ? parseInt(raw, 10) : NaN;
    if (!Number.isFinite(tenantId)) {
      throw new Error("Tenant não informado (header X-Tenant-Id)");
    }
    await requireTenant(tenantId);
    return { tenantId, dbUserId: dbUser.id, role: dbUser.role, superAdmin: true };
  }

  await requireTenant(dbUser.tenantId);
  return {
    tenantId: dbUser.tenantId,
    dbUserId: dbUser.id,
    role: dbUser.role,
    superAdmin: false,
  };
}

export function toApiError(error: unknown, fallback: string) {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.message, type: error.type },
      { status: 400 }
    );
  }
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message.startsWith("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: fallback }, { status: 500 });
}
