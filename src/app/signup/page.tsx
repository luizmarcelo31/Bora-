import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signup } from "@/app/(auth)/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-12">
      <PageHeader
        title="Criar conta"
        description="O acesso ao tenant é liberado pelo administrador após o cadastro."
      />

      <Card>
        <CardHeader>
          <CardTitle>Cadastro</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={signup} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Email
              <Input name="email" type="email" required placeholder="voce@empresa.com" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Senha
              <Input name="password" type="password" required minLength={6} placeholder="Mínimo 6 caracteres" />
            </label>
            {params.error ? (
              <p className="text-sm text-destructive">
                Não foi possível criar a conta. Tente outro email.
              </p>
            ) : null}
            <Button type="submit">Criar conta</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
