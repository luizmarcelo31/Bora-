import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createTenantSchema } from "@/lib/validators";
import { requireApiContext, toApiError } from "@/lib/api-context";

// GET /api/tenants → super admin lista todos; usuário comum vê o próprio
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiContext(req);

    if (!ctx.superAdmin) {
      const own = await prisma.tenant.findUnique({ where: { id: ctx.tenantId } });
      return NextResponse.json(own ? [own] : []);
    }

    const tenants = await prisma.tenant.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(tenants);
  } catch (error) {
    return toApiError(error, "Failed to fetch tenants");
  }
}

// POST /api/tenants → criar empresa (somente SUPER_ADMIN)
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiContext(req);
    if (!ctx.superAdmin) {
      return NextResponse.json({ error: "Forbidden: somente Super Admin" }, { status: 403 });
    }

    const body = await req.json();
    const validated = createTenantSchema.parse(body);

    const tenant = await prisma.tenant.create({
      data: {
        name: validated.name,
        type: validated.type,
        email: validated.email || null,
        phone: validated.phone || null,
      },
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    return toApiError(error, "Erro ao criar tenant");
  }
}
