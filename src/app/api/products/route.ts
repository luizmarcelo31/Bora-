import { ProductService } from '@/services';
import { createProductSchema } from '@/lib/validators';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const tenantId = parseInt(req.nextUrl.searchParams.get('tenantId') || '1');
    const products = await ProductService.listProducts(tenantId);
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tenantId = parseInt(req.headers.get('X-Tenant-Id') || '1');

    const validated = createProductSchema.parse(body);
    const product = await ProductService.createProduct(tenantId, validated);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    );
  }
}
