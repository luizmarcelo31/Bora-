import { NextRequest, NextResponse } from "next/server";
import { SaleService } from "@/services";
import { createSaleSchema, ValidationError } from "@/lib/validators";

function toError(error: unknown, fallback: string) {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message, type: error.type }, { status: 400 });
  }
  if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ error: fallback }, { status: 500 });
}

// GET /api/sales?tenantId=1 → vendas de hoje
export async function GET(req: NextRequest) {
  try {
    const tenantId = parseInt(req.nextUrl.searchParams.get("tenantId") || "1", 10);
    const sales = await SaleService.getTodaysSales(tenantId);
    return NextResponse.json(sales);
  } catch (error) {
    return toError(error, "Failed to fetch sales");
  }
}

// POST /api/sales → criar venda (PDV)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tenantId = parseInt(req.headers.get("X-Tenant-Id") || "1", 10);
    const validated = createSaleSchema.parse(body);
    const sale = await SaleService.createSale(tenantId, validated);
    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    return toError(error, "Erro ao criar venda");
  }
}
