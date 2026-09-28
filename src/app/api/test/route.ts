import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * Health check público: prova que o runtime alcança o Postgres.
 *
 * Não devolve contagens (vazava quantos tenants a plataforma tem) e não
 * ecoa a mensagem crua do erro — o log do servidor é o lugar certo pra
 * diagnosticar; aqui só o status.
 */
export async function GET() {
  try {
    await prisma.tenant.count();

    return NextResponse.json({
      success: true,
      message: 'Conexao com banco funcionando!',
    });
  } catch (error) {
    console.error('[api/test] falha no banco:', error);
    return NextResponse.json(
      { success: false, error: 'db_unavailable' },
      { status: 500 }
    );
  }
}
