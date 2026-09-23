import Link from "next/link";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { RegisterForm } from "@/components/auth/register-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthSplitLayout
      tagline="Comece a gerenciar sua conveniência"
      title="Criar conta"
      description="O acesso à empresa é liberado pelo administrador após o cadastro."
      footer={
        <p className="text-center text-muted-foreground text-xs">
          Já tem conta?{" "}
          <Link prefetch={false} href="/login" className="text-primary">
            Entrar
          </Link>
        </p>
      }
    >
      <RegisterForm />
      {params.error ? (
        <p className="text-center text-sm text-destructive">
          Não foi possível criar a conta. Tente outro email.
        </p>
      ) : null}
    </AuthSplitLayout>
  );
}
