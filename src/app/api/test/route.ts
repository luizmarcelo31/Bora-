import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * Health check público: prova que o runtime alcança o Postgres.
 * Não devolve contagens nem ecoa a mensagem crua do erro (o log
 * do servidor é o lugar certo pra diagnosticar — aqui só status).
 * `NEXT_PUBLIC_*` é pública por definição (vai pro bundle do cliente),
 * então reportar a URL do Supabase não vaza nada novo.
 */
export async function GET() {
  try {
    await prisma.tenant.count();

    return NextResponse.json({
      success: true,
      message: 'Conexao com banco funcionando!',
      supabase: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    });
  } catch (error) {
    console.error('[api/test] falha no banco:', error);
    return NextResponse.json(
      { success: false, error: 'db_unavailable' },
      { status: 500 }
    );
  }
}
