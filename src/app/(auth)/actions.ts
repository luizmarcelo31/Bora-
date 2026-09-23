"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validators";
import { getUserContextByEmail } from "@/lib/tenant";
import { resolvePostLoginRedirect } from "@/lib/redirect";

export async function login(formData: FormData) {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/login?error=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect("/login?error=auth");
  }

  revalidatePath("/", "layout");

  const rawNext = String(formData.get("redirect") ?? "");

  // Destino validado pelo role: super admin só vai para /admin*,
  // demais roles nunca vão para /admin*. Sem vínculo → home padrão.
  const dbUser = await getUserContextByEmail(parsed.data.email);
  redirect(resolvePostLoginRedirect(dbUser?.role, rawNext));
}

export async function signup(formData: FormData) {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/signup?error=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    redirect("/signup?error=auth");
  }

  revalidatePath("/", "layout");
  redirect("/login?ok=check-email");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
