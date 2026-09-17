import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/services";
import { createProductSchema } from "@/lib/validators";
import { requireApiContext, toApiError } from "@/lib/api-context";

// GET /api/products → produtos do tenant da sessão
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiContext(req);
    const products = await ProductService.listProducts(ctx.tenantId);
    return NextResponse.json(products);
  } catch (error) {
    return toApiError(error, "Failed to fetch products");
  }
}

// POST /api/products → criar produto no tenant da sessão
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiContext(req);
    const body = await req.json();

    const validated = createProductSchema.parse(body);
    const product = await ProductService.createProduct(ctx.tenantId, validated);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return toApiError(error, "Erro ao criar produto");
  }
}
