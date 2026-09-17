import { NextRequest, NextResponse } from "next/server";
import { CashBoxService } from "@/services";
import { requireApiContext, toApiError } from "@/lib/api-context";

// POST /api/cashbox/[id]/close → fechar caixa { closingBalance }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiContext(req);
    const { id } = await params;
    const body = await req.json();
    const closingBalance = body.closingBalance as number;
    if (typeof closingBalance !== "number") {
      return NextResponse.json({ error: "closingBalance é obrigatório (em centavos)" }, { status: 400 });
    }
    const box = await CashBoxService.closeCashBox(ctx.tenantId, parseInt(id, 10), closingBalance);
    return NextResponse.json(box);
  } catch (error) {
    return toApiError(error, "Erro ao fechar caixa");
  }
}
