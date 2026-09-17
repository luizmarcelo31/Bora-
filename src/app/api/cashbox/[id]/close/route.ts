import { NextRequest, NextResponse } from "next/server";
import { CashBoxService } from "@/services";
import { ValidationError } from "@/lib/validators";

function toError(error: unknown, fallback: string) {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message, type: error.type }, { status: 400 });
  }
  if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ error: fallback }, { status: 500 });
}

// POST /api/cashbox/[id]/close → fechar caixa { closingBalance }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const tenantId = parseInt(req.headers.get("X-Tenant-Id") || "1", 10);
    const closingBalance = body.closingBalance as number;
    if (typeof closingBalance !== "number") {
      return NextResponse.json({ error: "closingBalance é obrigatório (em centavos)" }, { status: 400 });
    }
    const box = await CashBoxService.closeCashBox(tenantId, parseInt(id, 10), closingBalance);
    return NextResponse.json(box);
  } catch (error) {
    return toError(error, "Erro ao fechar caixa");
  }
}
