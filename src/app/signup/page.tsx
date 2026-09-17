import Link from "next/link";
import { BrandMark } from "@/components/shared/BrandMark";
import { RegisterForm } from "@/components/auth/register-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
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
              Comece a gerenciar sua conveniência
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-8 py-16">
          <div className="space-y-2 text-center">
            <div className="font-medium tracking-tight">Criar conta</div>
            <p className="mx-auto max-w-xl text-muted-foreground">
              O acesso à empresa é liberado pelo administrador após o cadastro.
            </p>
          </div>
          <div className="space-y-4">
            <RegisterForm />
            {params.error ? (
              <p className="text-center text-sm text-destructive">
                Não foi possível criar a conta. Tente outro email.
              </p>
            ) : null}
            <p className="text-center text-muted-foreground text-xs">
              Já tem conta?{" "}
              <Link prefetch={false} href="/login" className="text-primary">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
