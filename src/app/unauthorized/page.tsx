import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-12">
      <PageHeader title="Sem acesso" description="Sua conta não tem permissão para esta área." />
      <Card>
        <CardHeader>
          <CardTitle>403 — Não autorizado</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
          <p>
            Esta área é restrita ao Super Admin da plataforma. Se você deveria
            ter acesso, peça ao administrador para ajustar seu role.
          </p>
          <div className="flex gap-3">
            <Link className={buttonVariants()} href="/dashboard">
              Voltar ao painel
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href="/">
              Início
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
