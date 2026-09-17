import { NextRequest, NextResponse } from "next/server";
import { FinancialService } from "@/services";
import { createFinancialMovementSchema, ValidationError } from "@/lib/validators";

function toError(error: unknown, fallback: string) {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message, type: error.type }, { status: 400 });
  }
  if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ error: fallback }, { status: 500 });
}

// POST /api/financial → registrar movimentação financeira
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tenantId = parseInt(req.headers.get("X-Tenant-Id") || "1", 10);
    const validated = createFinancialMovementSchema.parse(body);
    const movement = await FinancialService.registerMovement(tenantId, validated);
    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    return toError(error, "Erro ao registrar movimentação financeira");
  }
}

// GET /api/financial?tenantId=1&start=2024-01-01&end=2024-01-31 → resumo
export async function GET(req: NextRequest) {
  try {
    const tenantId = parseInt(req.nextUrl.searchParams.get("tenantId") || "1", 10);
    const start = req.nextUrl.searchParams.get("start");
    const end = req.nextUrl.searchParams.get("end");
    const startDate = start ? new Date(start) : new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = end ? new Date(end) : new Date();
    const resume = await FinancialService.getFinancialResume(tenantId, startDate, endDate);
    return NextResponse.json(resume);
  } catch (error) {
    return toError(error, "Failed to fetch financial resume");
  }
}
