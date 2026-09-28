import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * Health check público.
 *
 * Reporta 3 coisas que decidem se o login funciona em produção:
 *  1. `db`      — o runtime alcança o Postgres (pooler IPv4);
 *  2. `supabase` — URL do projeto Supabase resolvida no build;
 *  3. `auth`    — se o PAR (url, publishable key) é aceito pelo Auth.
 *     Faz um `signIn` com credenciais inventadas: `invalid_credentials`
 *     prova que a key e a URL pertencem ao mesmo projeto. Qualquer outro
 *     código (401, `invalid API key`) indica key trocada = login quebra.
 *
 * Não devolve contagens, não ecoa a mensagem crua do erro de banco (o log
 * do servidor é o lugar certo) e nunca expõe segredo: `publishable` é
 * pública por definição (vai pro bundle do cliente), daí mostrar só prefixo.
 *
 * TEMPORÁRIO: `key` e `auth` existem pra diagnosticar o erro reportado;
 * devem sair depois que o login for confirmado.
 */
export async function GET() {
  // --- 1. banco -----------------------------------------------------------
  let db: 'ok' | 'falha' = 'ok';
  try {
    await prisma.tenant.count();
  } catch (error) {
    console.error('[api/test] falha no banco:', error);
    db = 'falha';
  }

  // --- 2. supabase: qual key o runtime realmente usa -----------------------
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = publishable ?? anon ?? null;
  const via = publishable
    ? 'PUBLISHABLE_KEY'
    : anon
      ? 'ANON_KEY'
      : 'AUSENTE';

  // --- 3. probe: o par (url, key) passa no Auth do Supabase? ---------------
  type AuthProbe = { status: number; errorCode: string | null };
  let auth: AuthProbe | null = null;

  if (url && key) {
    try {
      const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'probe@bora.nao-existe',
          password: 'inventada',
        }),
        cache: 'no-store',
      });

      let errorCode: string | null = null;
      try {
        const body: unknown = await res.json();
        if (body && typeof body === 'object' && 'error_code' in body) {
          errorCode = String((body as { error_code: unknown }).error_code);
        } else if (body && typeof body === 'object' && 'code' in body) {
          errorCode = String((body as { code: unknown }).code);
        }
      } catch {
        // resposta não-JSON (ex.: HTML de erro de gateway)
      }

      auth = { status: res.status, errorCode };
    } catch (error) {
      auth = { status: 0, errorCode: String(error).slice(0, 160) };
    }
  }

  return NextResponse.json({
    db,
    supabase: url,
    key: key ? { via, prefix: key.slice(0, 22), len: key.length } : null,
    auth,
    ok: db === 'ok' && auth !== null && auth.errorCode === 'invalid_credentials',
  });
}
