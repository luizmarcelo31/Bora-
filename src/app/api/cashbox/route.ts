import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CashBoxService } from "@/services";
import { requireApiContext, toApiError } from "@/lib/api-context";

// GET /api/cashbox → listar caixas do tenant da sessão
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiContext(req);
    const boxes = await prisma.cashBox.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(boxes);
  } catch (error) {
    return toApiError(error, "Failed to fetch cash boxes");
  }
}

// POST /api/cashbox → abrir caixa { name, openingBalance }
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiContext(req);
    const body = await req.json();
    const { name, openingBalance } = body as { name: string; openingBalance?: number };
    if (!name) return NextResponse.json({ error: "name é obrigatório" }, { status: 400 });
    const box = await CashBoxService.openCashBox(ctx.tenantId, name, openingBalance ?? 0);
    return NextResponse.json(box, { status: 201 });
  } catch (error) {
    return toApiError(error, "Erro ao abrir caixa");
  }
}
