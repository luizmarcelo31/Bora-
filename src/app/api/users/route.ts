import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createUserSchema } from "@/lib/validators";
import { requireApiContext, toApiError } from "@/lib/api-context";

// GET /api/users → usuários do tenant da sessão
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiContext(req);
    const users = await prisma.user.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { name: "asc" },
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    });
    return NextResponse.json(users);
  } catch (error) {
    return toApiError(error, "Failed to fetch users");
  }
}

// POST /api/users → criar usuário no tenant da sessão
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiContext(req);
    const body = await req.json();
    const validated = createUserSchema.parse(body);

    const existing = await prisma.user.findFirst({
      where: { tenantId: ctx.tenantId, email: validated.email },
    });
    if (existing) {
      return NextResponse.json({ error: "Email já existe neste tenant" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        tenantId: ctx.tenantId,
        email: validated.email,
        name: validated.name,
        role: validated.role,
      },
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return toApiError(error, "Failed to create user");
  }
}
