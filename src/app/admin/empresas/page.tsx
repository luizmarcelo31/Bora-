import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { createTenantAction } from "@/app/admin/actions";

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;

  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true, products: true, sales: true } } },
  });

  return (
    <main className="flex flex-col gap-6">
      <PageHeader title="Empresas" description="Tenants da plataforma." />

      <Card>
        <CardHeader>
          <CardTitle>Nova empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTenantAction} className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Nome*
              <Input name="name" required placeholder="Conveniência Centro" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Email
              <Input name="email" type="email" placeholder="contato@empresa.com" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Telefone
              <Input name="phone" placeholder="11999999999" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Tipo
              <Input name="type" defaultValue="CONVENIENCE" />
            </label>
            {params.error ? (
              <p className="text-sm text-destructive sm:col-span-2">
                Não foi possível criar. Verifique os dados.
              </p>
            ) : null}
            {params.ok ? (
              <p className="text-sm text-muted-foreground sm:col-span-2">
                Empresa criada com sucesso.
              </p>
            ) : null}
            <div className="sm:col-span-2">
              <Button type="submit">Criar empresa</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {tenants.length === 0 ? (
        <EmptyState title="Nenhuma empresa" description="Crie a primeira acima." />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>ID</TH>
              <TH>Nome</TH>
              <TH>Tipo</TH>
              <TH>Usuários</TH>
              <TH>Produtos</TH>
              <TH>Vendas</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {tenants.map((t) => (
              <TR key={t.id}>
                <TD>{t.id}</TD>
                <TD>{t.name}</TD>
                <TD>{t.type}</TD>
                <TD>{t._count.users}</TD>
                <TD>{t._count.products}</TD>
                <TD>{t._count.sales}</TD>
                <TD>{t.suspended ? "Suspensa" : t.active ? "Ativa" : "Inativa"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </main>
  );
}
