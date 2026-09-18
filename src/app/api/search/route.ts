import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiContext, toApiError } from "@/lib/api-context";

// GET /api/search?q=... → produtos + categorias do tenant (para a busca global do header)
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiContext(req);
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return NextResponse.json({ products: [], categories: [] });

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          tenantId: ctx.tenantId,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { barcode: { contains: q } },
          ],
        },
        select: { id: true, name: true, price: true, active: true },
        orderBy: { name: "asc" },
        take: 8,
      }),
      prisma.category.findMany({
        where: { tenantId: ctx.tenantId, active: true, name: { contains: q, mode: "insensitive" } },
        select: { id: true, name: true, kind: true },
        orderBy: { name: "asc" },
        take: 5,
      }),
    ]);
    return NextResponse.json({ products, categories });
  } catch (error) {
    return toApiError(error, "Failed to search");
  }
}
