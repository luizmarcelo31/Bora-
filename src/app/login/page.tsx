import Link from "next/link";
import { BrandMark } from "@/components/shared/BrandMark";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string; redirect?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-full flex-1">
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <BrandMark
              inverted
              className="justify-center text-primary-foreground [&_span:last-child]:text-5xl [&_span:last-child]:font-light"
            />
            <p className="text-primary-foreground/80 text-xl">
              Gestão da sua conveniência
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-8 py-16">
          <div className="space-y-2 text-center">
            <div className="font-medium tracking-tight">Entrar</div>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Bem-vindo de volta. Acesse o painel da sua empresa.
            </p>
          </div>
          <div className="space-y-4">
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
            <p className="text-center text-muted-foreground text-xs">
              Não tem conta?{" "}
              <Link prefetch={false} href="/signup" className="text-primary">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
