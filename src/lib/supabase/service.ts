import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com service role — SOMENTE servidor.
 *
 * Usado para Storage (upload de imagens de produto), onde o RLS do
 * anon não alcança. Nunca importar em Client Component: a chave
 * contorna todas as políticas do banco.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Supabase novo: `sb_secret_...` equivale ao antigo service_role.
  // Aceita os dois nomes de env.
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY) ausente. Configure no ambiente (docs/STORAGE.md)."
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
