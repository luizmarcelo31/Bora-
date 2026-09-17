import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/services";
import { createStockMovementSchema, ValidationError } from "@/lib/validators";

function toError(error: unknown, fallback: string) {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message, type: error.type }, { status: 400 });
  }
  if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ error: fallback }, { status: 500 });
}

// POST /api/stock → registrar movimentação de estoque
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tenantId = parseInt(req.headers.get("X-Tenant-Id") || "1", 10);
    const validated = createStockMovementSchema.parse(body);
    const movement = await InventoryService.registerMovement(tenantId, validated);
    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    return toError(error, "Erro ao movimentar estoque");
  }
}

// GET /api/stock?inventoryId=1&tenantId=1 → histórico
export async function GET(req: NextRequest) {
  try {
    const tenantId = parseInt(req.nextUrl.searchParams.get("tenantId") || "1", 10);
    const inventoryId = parseInt(req.nextUrl.searchParams.get("inventoryId") || "0", 10);
    if (!inventoryId) return NextResponse.json({ error: "inventoryId é obrigatório" }, { status: 400 });
    const history = await InventoryService.getMovementHistory(tenantId, inventoryId);
    return NextResponse.json(history);
  } catch (error) {
    return toError(error, "Failed to fetch stock history");
  }
}
