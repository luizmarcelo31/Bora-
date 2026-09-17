import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { BrandMark } from "@/components/shared/BrandMark";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/dashboard");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <BrandMark />
      <PageHeader
        title="Dashboard"
        badge="Privado"
        description={`Logado como ${user.email ?? "usuário"}`}
      />
      <Card>
        <CardHeader>
          <CardTitle>Módulos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
          <div className="flex flex-wrap gap-3">
            <Link className={buttonVariants()} href="/dashboard/produtos">
              Produtos
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href="/dashboard/estoque">
              Estoque
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href="/dashboard/pdv">
              PDV
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href="/dashboard/caixa">
              Caixa
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href="/dashboard/financeiro">
              Financeiro
            </Link>
          </div>
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
