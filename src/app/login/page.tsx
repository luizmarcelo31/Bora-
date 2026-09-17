import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login } from "@/app/(auth)/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string; redirect?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-12">
      <PageHeader title="Entrar" description="Acesse o painel da sua conveniência." />

      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={login} className="flex flex-col gap-4">
            <input type="hidden" name="redirect" value={params.redirect ?? "/dashboard"} />
            <label className="flex flex-col gap-1 text-sm">
              Email
              <Input name="email" type="email" required placeholder="voce@empresa.com" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Senha
              <Input name="password" type="password" required placeholder="••••••" />
            </label>
            {params.error ? (
              <p className="text-sm text-destructive">
                Não foi possível entrar. Verifique email e senha.
              </p>
            ) : null}
            {params.ok ? (
              <p className="text-sm text-muted-foreground">
                Conta criada. Confirme o email e entre.
              </p>
            ) : null}
            <Button type="submit">Entrar</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
