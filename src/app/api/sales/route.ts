import { NextRequest, NextResponse } from "next/server";
import { SaleService } from "@/services";
import { createSaleSchema } from "@/lib/validators";
import { requireApiContext, toApiError } from "@/lib/api-context";

// GET /api/sales → vendas de hoje do tenant da sessão
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiContext(req);
    const sales = await SaleService.getTodaysSales(ctx.tenantId);
    return NextResponse.json(sales);
  } catch (error) {
    return toApiError(error, "Failed to fetch sales");
  }
}

// POST /api/sales → criar venda (PDV) no tenant da sessão
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiContext(req);
    const body = await req.json();
    const validated = createSaleSchema.parse(body);
    const sale = await SaleService.createSale(ctx.tenantId, validated);
    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    return toApiError(error, "Erro ao criar venda");
  }
}
