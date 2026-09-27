import { requireSuperAdmin } from "@/lib/admin";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createTenantAction } from "@/app/admin/actions";
import { VOLTAR_EMPRESAS } from "../mensagens";

/**
 * Cadastro de empresa em página própria, e não embutido na listagem.
 * Motivo: o formulário antigo empurrava a tabela para baixo e diluía a
 * ação principal. Criar é uma tarefa com começo, meio e fim — merece URL.
 */
export default async function NovaEmpresaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Nova empresa"
        badge="Plataforma"
        description="Cadastre a empresa e vincule o primeiro usuário a ela."
      />

      <Card>
        <CardContent>
          <form action={createTenantAction} className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Nome*
              <Input name="name" required placeholder="Conveniência Centro" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Tipo
              <Input name="type" defaultValue="CONVENIENCE" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Email
              <Input name="email" type="email" placeholder="contato@empresa.com" />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Telefone
              <Input name="phone" placeholder="11999999999" />
            </label>

            {params.error ? (
              <p role="alert" className="text-sm text-destructive sm:col-span-2">
                {VOLTAR_EMPRESAS.error.invalid}
              </p>
            ) : null}

            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">Criar empresa</Button>
              <Button type="button" variant="ghost" asChild>
                <Link href="/admin/empresas">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
