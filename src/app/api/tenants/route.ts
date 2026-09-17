import { prisma } from '@/lib/db';
import { createTenantSchema } from '@/lib/validators';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(tenants);
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar tenant' },
      { status: 500 }
    );
  }
}
