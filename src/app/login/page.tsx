import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/auth";
import { getUserContextByEmail } from "@/lib/tenant";
import { getHomePathForRole } from "@/lib/redirect";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string; redirect?: string }>;
}) {
  const params = await searchParams;

  // Já logado → home do role (evita super admin preso no form de login).
  const sessionUser = await getSessionUser();
  if (sessionUser?.email) {
    const dbUser = await getUserContextByEmail(sessionUser.email);
    redirect(getHomePathForRole(dbUser?.role));
  }

  return (
    <AuthSplitLayout
      tagline="Gestão da sua conveniência"
      title="Entrar"
      description="Bem-vindo de volta. Acesse o painel da sua empresa."
      footer={
        <p className="text-center text-muted-foreground text-xs">
          Não tem conta?{" "}
          <Link prefetch={false} href="/signup" className="text-primary">
            Criar conta
          </Link>
        </p>
      }
    >
      <LoginForm redirectTo={params.redirect ?? "/dashboard"} />
      {params.error ? (
        <p className="text-center text-sm text-destructive">
          Não foi possível entrar. Verifique email e senha.
        </p>
      ) : null}
      {params.ok ? (
        <p className="text-center text-sm text-muted-foreground">
          Conta criada. Confirme o email e entre.
        </p>
      ) : null}
    </AuthSplitLayout>
  );
}
