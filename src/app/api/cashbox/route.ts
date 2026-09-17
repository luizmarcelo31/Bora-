import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CashBoxService } from "@/services";
import { ValidationError } from "@/lib/validators";

function toError(error: unknown, fallback: string) {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message, type: error.type }, { status: 400 });
  }
  if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ error: fallback }, { status: 500 });
}

// GET /api/cashbox?tenantId=1 → listar caixas
export async function GET(req: NextRequest) {
  try {
    const tenantId = parseInt(req.nextUrl.searchParams.get("tenantId") || "1", 10);
    const boxes = await prisma.cashBox.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(boxes);
  } catch (error) {
    return toError(error, "Failed to fetch cash boxes");
  }
}

// POST /api/cashbox → abrir caixa { name, openingBalance }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tenantId = parseInt(req.headers.get("X-Tenant-Id") || body.tenantId || "1", 10);
    const { name, openingBalance } = body as { name: string; openingBalance?: number };
    if (!name) return NextResponse.json({ error: "name é obrigatório" }, { status: 400 });
    const box = await CashBoxService.openCashBox(tenantId, name, openingBalance ?? 0);
    return NextResponse.json(box, { status: 201 });
  } catch (error) {
    return toError(error, "Erro ao abrir caixa");
  }
}
