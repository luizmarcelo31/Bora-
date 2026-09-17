import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createUserSchema, ValidationError } from "@/lib/validators";
import { getTenantIdFromHeaders } from "@/lib/tenant";

function toError(error: unknown, fallback: string) {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message, type: error.type }, { status: 400 });
  }
  if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantIdFromHeaders(
      parseInt(req.nextUrl.searchParams.get("tenantId") || "0", 10) || undefined
    );
    const users = await prisma.user.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    });
    return NextResponse.json(users);
  } catch (error) {
    return toError(error, "Failed to fetch users");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tenantIdHeader = req.headers.get("X-Tenant-Id");
    const tenantId = tenantIdHeader
      ? parseInt(tenantIdHeader, 10)
      : (body.tenantId as number);

    if (!tenantId || Number.isNaN(tenantId)) {
      return NextResponse.json({ error: "Tenant não informado (header X-Tenant-Id)" }, { status: 400 });
    }

    const validated = createUserSchema.parse(body);

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

    const existing = await prisma.user.findFirst({ where: { tenantId, email: validated.email } });
    if (existing) return NextResponse.json({ error: "Email já existe neste tenant" }, { status: 400 });

    const user = await prisma.user.create({
      data: {
        tenantId,
        email: validated.email,
        name: validated.name,
        role: validated.role,
      },
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return toError(error, "Failed to create user");
  }
}
