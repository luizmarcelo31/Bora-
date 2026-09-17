import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const tenantCount = await prisma.tenant.count();
    
    return NextResponse.json({
      success: true,
      message: 'Conexao com banco funcionando!',
      tenantCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
