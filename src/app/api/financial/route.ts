import { NextRequest, NextResponse } from "next/server";
import { FinancialService } from "@/services";
import { createFinancialMovementSchema } from "@/lib/validators";
import { requireApiContext, toApiError } from "@/lib/api-context";

// POST /api/financial → registrar movimentação financeira
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiContext(req);
    const body = await req.json();
    const validated = createFinancialMovementSchema.parse(body);
    const movement = await FinancialService.registerMovement(ctx.tenantId, validated);
    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    return toApiError(error, "Erro ao registrar movimentação financeira");
  }
}

// GET /api/financial?start=2024-01-01&end=2024-01-31 → resumo
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiContext(req);
    const start = req.nextUrl.searchParams.get("start");
    const end = req.nextUrl.searchParams.get("end");
    const startDate = start ? new Date(start) : new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = end ? new Date(end) : new Date();
    const resume = await FinancialService.getFinancialResume(ctx.tenantId, startDate, endDate);
    return NextResponse.json(resume);
  } catch (error) {
    return toApiError(error, "Failed to fetch financial resume");
  }
}
