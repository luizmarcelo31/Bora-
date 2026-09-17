import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/services";
import { createStockMovementSchema } from "@/lib/validators";
import { requireApiContext, toApiError } from "@/lib/api-context";

// POST /api/stock → registrar movimentação de estoque
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiContext(req);
    const body = await req.json();
    const validated = createStockMovementSchema.parse(body);
    const movement = await InventoryService.registerMovement(ctx.tenantId, validated);
    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    return toApiError(error, "Erro ao movimentar estoque");
  }
}

// GET /api/stock?inventoryId=1 → histórico
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiContext(req);
    const inventoryId = parseInt(req.nextUrl.searchParams.get("inventoryId") || "0", 10);
    if (!inventoryId) return NextResponse.json({ error: "inventoryId é obrigatório" }, { status: 400 });
    const history = await InventoryService.getMovementHistory(ctx.tenantId, inventoryId);
    return NextResponse.json(history);
  } catch (error) {
    return toApiError(error, "Failed to fetch stock history");
  }
}
