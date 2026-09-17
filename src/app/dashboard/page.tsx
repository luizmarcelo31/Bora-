import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/dashboard");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <PageHeader
        title="Dashboard"
        badge="Privado"
        description={`Logado como ${user.email ?? "usuário"}`}
      />
      <Card>
        <CardHeader>
          <CardTitle>Próximo passo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
          <p>
            Fundação pronta: Auth, tenant, roles e permissões estão no código.
            Os módulos comerciais (produtos, estoque, PDV, caixa, financeiro)
            entram na próxima etapa do roadmap.
          </p>
          <form action={logout}>
            <Button variant="outline" type="submit">
              Sair
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
