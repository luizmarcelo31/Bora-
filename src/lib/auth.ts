import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Retorna o usuário autenticado no Supabase (ou null).
 * Nunca confie apenas no frontend: use este helper em Server Components,
 * Server Actions e Route Handlers.
 *
 * `cache()` dedup por request: layout + page + actions do mesmo ciclo
 * compartilham 1 chamada ao Supabase em vez de N.
 */
export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
