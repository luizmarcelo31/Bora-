import { createClient } from "@/lib/supabase/server";

/**
 * Retorna o usuário autenticado no Supabase (ou null).
 * Nunca confie apenas no frontend: use este helper em Server Components,
 * Server Actions e Route Handlers.
 */
export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
